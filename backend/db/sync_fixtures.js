// Sincroniza la tabla `matches` con db/fixtures.json (fuente de verdad).
// Idempotente: se ejecuta en cada arranque del servidor (SQLite local y Postgres en Render).
// - Partidos con equipos/fecha cambiados: se actualizan y sus predicciones se eliminan (sin otorgar puntos).
// - Partidos sin cambios (p. ej. México vs Sudáfrica): predicciones y puntos intactos.
// - Partidos extra que no están en fixtures.json: se eliminan junto con sus predicciones.
// - Al final recalcula points_earned de partidos finalizados y el total de cada usuario (misma lógica 3/1/0 de server.js).

const db = require('./db');
const fixtures = require('./fixtures.json');

function get(sql, params = []) {
  return new Promise((resolve, reject) => db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));
}
function all(sql, params = []) {
  return new Promise((resolve, reject) => db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));
}
function run(sql, params = []) {
  return new Promise((resolve, reject) => db.run(sql, params, function (err) { err ? reject(err) : resolve(this); }));
}

async function syncFixtures() {
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
    const detailsChanged = m.group_name !== f.group_name || m.status !== status ||
      m.home_score !== homeScore || m.away_score !== awayScore;

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
        [f.home_team, f.away_team, f.match_date, f.group_name, f.is_knockout, f.stage, status, homeScore, awayScore, f.match_num]
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

  // Recalcular puntos de partidos finalizados (3 exacto, 1 resultado, 0 fallo)
  const finished = await all(`SELECT * FROM matches WHERE status = 'finished'`);
  for (const fm of finished) {
    const actualDiff = fm.home_score - fm.away_score;
    const actualWinner = actualDiff > 0 ? 1 : (actualDiff < 0 ? -1 : 0);
    const preds = await all('SELECT * FROM predictions WHERE match_id = ?', [fm.id]);
    for (const p of preds) {
      const predDiff = p.predicted_home_score - p.predicted_away_score;
      const predWinner = predDiff > 0 ? 1 : (predDiff < 0 ? -1 : 0);
      let points = 0;
      if (p.predicted_home_score === fm.home_score && p.predicted_away_score === fm.away_score) points = 3;
      else if (predWinner === actualWinner) points = 1;
      if (points !== p.points_earned) {
        await run('UPDATE predictions SET points_earned = ? WHERE id = ?', [points, p.id]);
      }
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
