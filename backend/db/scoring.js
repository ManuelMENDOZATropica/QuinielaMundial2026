// Lógica única de puntos, usada por el endpoint de admin (server.js) y por el
// recálculo de arranque (sync_fixtures.js) para que nunca diverjan.
//
// Fase de grupos:        exacto 3 / resultado 1.
// Eliminatorias (is_knockout = 1): valen el doble y se SUMAN los niveles que el
//   partido haya alcanzado:
//     - Tiempo regular (90'):   exacto 6 / resultado 2
//     - Tiempo extra (120'):    exacto 12 / resultado 4   (solo si el regular fue empate)
//     - Penales (quién gana):   8                          (solo si el extra fue empate)
//
// Un jugador solo tiene predicción de tiempo extra si pronosticó empate en regular,
// y de penales si pronosticó empate en tiempo extra (lo controla el front, pero acá
// también se valida con la presencia de los campos).

function sign(d) { return d > 0 ? 1 : (d < 0 ? -1 : 0); }
function notNull(v) { return v !== null && v !== undefined; }

// match: { status, is_knockout, home_score, away_score, et_home_score, et_away_score, pen_winner }
// pred:  { predicted_home_score, predicted_away_score, pred_et_home, pred_et_away, pred_pen_winner }
function computePoints(match, pred) {
  if (match.status !== 'finished' || !notNull(match.home_score) || !notNull(match.away_score)) return 0;

  const exactReg = pred.predicted_home_score === match.home_score && pred.predicted_away_score === match.away_score;
  const sameReg = sign(pred.predicted_home_score - pred.predicted_away_score) === sign(match.home_score - match.away_score);

  if (!match.is_knockout) {
    if (exactReg) return 3;
    if (sameReg) return 1;
    return 0;
  }

  // --- Eliminatorias ---
  let pts = 0;
  if (exactReg) pts += 6; else if (sameReg) pts += 2;

  // Nivel 2: tiempo extra (solo si el partido llegó a ET: regular empatado + marcador ET cargado)
  const regWasDraw = match.home_score === match.away_score;
  const hasActualET = notNull(match.et_home_score) && notNull(match.et_away_score);
  const predHasET = notNull(pred.pred_et_home) && notNull(pred.pred_et_away);
  if (regWasDraw && hasActualET && predHasET) {
    const exactET = pred.pred_et_home === match.et_home_score && pred.pred_et_away === match.et_away_score;
    const sameET = sign(pred.pred_et_home - pred.pred_et_away) === sign(match.et_home_score - match.et_away_score);
    if (exactET) pts += 12; else if (sameET) pts += 4;

    // Nivel 3: penales (solo si el extra también fue empate y hay ganador cargado)
    const etWasDraw = match.et_home_score === match.et_away_score;
    if (etWasDraw && match.pen_winner && pred.pred_pen_winner && pred.pred_pen_winner === match.pen_winner) {
      pts += 8;
    }
  }
  return pts;
}

// Clasifica un pronóstico para la vista de "Árbol de juegos".
// Devuelve el desglose de qué le atinó cada persona en cada partido:
//   hit: 'exact'   -> marcador exacto del tiempo regular
//        'outcome' -> acertó ganador/empate pero no el marcador
//        'miss'    -> falló
//        'none'    -> no hay pronóstico registrado
//   et / pen: mismo criterio para tiempo extra y penales (null si no aplica).
function classifyPrediction(match, pred) {
  const empty = { hit: 'none', points: 0, et: null, pen: null };
  if (!pred || !notNull(pred.predicted_home_score) || !notNull(pred.predicted_away_score)) return empty;
  if (match.status !== 'finished' || !notNull(match.home_score) || !notNull(match.away_score)) {
    return { hit: 'pending', points: 0, et: null, pen: null };
  }

  const exactReg = pred.predicted_home_score === match.home_score && pred.predicted_away_score === match.away_score;
  const sameReg = sign(pred.predicted_home_score - pred.predicted_away_score) === sign(match.home_score - match.away_score);
  const hit = exactReg ? 'exact' : (sameReg ? 'outcome' : 'miss');

  let et = null, pen = null;
  if (match.is_knockout) {
    const regWasDraw = match.home_score === match.away_score;
    const hasActualET = notNull(match.et_home_score) && notNull(match.et_away_score);
    const predHasET = notNull(pred.pred_et_home) && notNull(pred.pred_et_away);
    if (regWasDraw && hasActualET) {
      if (!predHasET) {
        et = 'none';
      } else {
        const exactET = pred.pred_et_home === match.et_home_score && pred.pred_et_away === match.et_away_score;
        const sameET = sign(pred.pred_et_home - pred.pred_et_away) === sign(match.et_home_score - match.et_away_score);
        et = exactET ? 'exact' : (sameET ? 'outcome' : 'miss');
      }
      if (match.et_home_score === match.et_away_score && match.pen_winner) {
        if (!pred.pred_pen_winner) pen = 'none';
        else pen = pred.pred_pen_winner === match.pen_winner ? 'exact' : 'miss';
      }
    }
  }

  return { hit, points: computePoints(match, pred), et, pen };
}

module.exports = { computePoints, classifyPrediction };
