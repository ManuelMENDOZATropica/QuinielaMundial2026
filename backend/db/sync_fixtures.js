// Sincroniza la tabla `matches` con db/fixtures.json (fuente de verdad).
// Idempotente: se ejecuta en cada arranque del servidor (SQLite local y Postgres en Render).
// - Partidos con equipos/fecha cambiados: se actualizan y sus predicciones se eliminan (sin otorgar puntos).
// - Partidos sin cambios (p. ej. México vs Sudáfrica): predicciones y puntos intactos.
// - Partidos extra que no están en fixtures.json: se eliminan junto con sus predicciones.
// - Al final recalcula points_earned de partidos finalizados y el total de cada usuario (misma lógica 3/1/0 de server.js).

const db = require('./db');
const fixtures = require('./fixtures.json');
const { computePoints } = require('./scoring');

function get(sql, params = []) {
  return new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));
}
function run(sql, params = []) {
  return new Promise((resolve, reject) => db.run(sql, params, function (err) { err ? reject(err) : resolve(this); }));
}

// Migración idempotente: agrega columnas de tiempo extra / penales si faltan.
// SQLite y Postgres tiran error si la columna ya existe -> lo ignoramos.
async function addColumnIfMissing(table, column, type) {
  try { await run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`); }
  catch (e) { /* columna ya existe */ }
}
async function migrate() {
  await addColumnIfMissing('matches', 'et_home_score', 'INTEGER');
  await addColumnIfMissing('matches', 'et_away_score', 'INTEGER');
  await addColumnIfMissing('matches', 'pen_winner', 'TEXT');
  await addColumnIfMissing('predictions', 'pred_et_home', 'INTEGER');
  await addColumnIfMissing('predictions', 'pred_et_away', 'INTEGER');
  await addColumnIfMissing('predictions', 'pred_pen_winner', 'TEXT');
}

async function syncFixtures() {
  await migrate();

  const dbMatches = await all('SELECT * FROM matches');
  const dbByNum = {};
  dbMatches.forEach(m => { dbByNum[m.match_num] = m; });

  const fixtureNums = new Set(fixtures.map(f => f.match_num));
  let updated = 0, inserted = 0, deleted = 0, predsDeleted = 0;

  for (const f of fixtures) {
    const m = dbByNum[f.match_num];
    const status = f.status || 'scheduled';
    const homeScore = f.home_score !== undefined ? f.home_score : null;
    const awayScore = f.away_score !== undefined ? f.away_score : null;

    if (!m) {
      await run(
        `INSERT INTO matches (match_num, group_name, home_team, away_team, match_date, is_knockout, stage, status, home_score, away_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [f.match_num, f.group_name, f.home_team, f.away_team, f.match_date, f.is_knockout, f.stage, status, homeScore, awayScore]
      );
      inserted++;
      continue;
    }

    const teamsChanged = m.home_team !== f.home_team || m.away_team !== f.away_team;
    const dateChanged = m.match_date !== f.match_date;

    // No pisar marcadores cargados desde el admin: si el fixture no trae resultado
    // (score null / no 'finished') pero la BD ya tiene un partido finalizado, se conserva
    // lo de la BD. fixtures.json manda en calendario (equipos/fechas), el admin manda en marcadores.
    // Si los equipos cambian, el resultado viejo deja de tener sentido y sí se descarta.
    const fixtureHasResult = homeScore !== null && awayScore !== null;
    const effStatus = (fixtureHasResult || teamsChanged) ? status : (m.status === 'finished' ? 'finished' : status);
    const effHome = (fixtureHasResult || teamsChanged) ? homeScore : m.home_score;
    const effAway = (fixtureHasResult || teamsChanged) ? awayScore : m.away_score;

    const detailsChanged = m.group_name !== f.group_name || m.status !== effStatus ||
      m.home_score !== effHome || m.away_score !== effAway;

    if (teamsChanged) {
      // Partido mal capturado (equipos distintos): fuera las predicciones, sin puntos.
      // Un cambio solo de fecha/hora NO borra pronósticos.
      const r = await run('DELETE FROM predictions WHERE match_id = ?', [m.id]);
      predsDeleted += r.changes || 0;
      console.log(`[sync] Partido #${f.match_num}: (${m.home_team} vs ${m.away_team}, ${m.match_date}) -> (${f.home_team} vs ${f.away_team}, ${f.match_date})`);
    }

    if (teamsChanged || dateChanged || detailsChanged) {
      await run(
        `UPDATE matches SET home_team = ?, away_team = ?, match_date = ?, group_name = ?, is_knockout = ?, stage = ?, status = ?, home_score = ?, away_score = ?
         WHERE match_num = ?`,
        [f.home_team, f.away_team, f.match_date, f.group_name, f.is_knockout, f.stage, effStatus, effHome, effAway, f.match_num]
      );
      updated++;
    }
  }

  // Eliminar partidos de grupos que ya no existen en el fixture oficial
  const current = await all(`SELECT * FROM matches WHERE stage = 'group'`);
  for (const m of current) {
    if (!fixtureNums.has(m.match_num)) {
      const r = await run('DELETE FROM predictions WHERE match_id = ?', [m.id]);
      predsDeleted += r.changes || 0;
      await run('DELETE FROM matches WHERE id = ?', [m.id]);
      deleted++;
      console.log(`[sync] Partido #${m.match_num} (${m.home_team} vs ${m.away_team}) eliminado: no existe en el fixture oficial.`);
    }
  }

  // Recalcular puntos de TODAS las predicciones (0 si su partido no está finalizado).
  // Usa la lógica compartida en scoring.js (grupos 3/1, eliminatorias 6/2 + extra 12/4 + penales 8).
  const preds = await all(`
    SELECT p.*, m.status, m.is_knockout, m.home_score, m.away_score,
           m.et_home_score, m.et_away_score, m.pen_winner
    FROM predictions p JOIN matches m ON m.id = p.match_id`);
  for (const p of preds) {
    const match = {
      status: p.status, is_knockout: p.is_knockout,
      home_score: p.home_score, away_score: p.away_score,
      et_home_score: p.et_home_score, et_away_score: p.et_away_score, pen_winner: p.pen_winner
    };
    const points = computePoints(match, p);
    if (points !== p.points_earned) {
      await run('UPDATE predictions SET points_earned = ? WHERE id = ?', [points, p.id]);
    }
  }

  await run(`UPDATE users SET points = (SELECT COALESCE(SUM(points_earned), 0) FROM predictions WHERE predictions.user_id = users.id)`);

  if (updated || inserted || deleted || predsDeleted) {
    console.log(`[sync] Fixtures sincronizados: ${updated} actualizados, ${inserted} insertados, ${deleted} eliminados, ${predsDeleted} predicciones borradas.`);
  } else {
    console.log('[sync] Fixtures ya estaban al día.');
  }
}

module.exports = syncFixtures;
