// ==========================================
// QUINIELA WORLD CUP 2026 - FRONTEND COMPONENTS
// ==========================================

const countryCodes = {
  "Mexico": "mx", "South Korea": "kr", "South Africa": "za", "Czechia": "cz",
  "Canada": "ca", "Switzerland": "ch", "Qatar": "qa", "Bosnia-Herzegovina": "ba",
  "Brazil": "br", "Morocco": "ma", "Scotland": "gb-sct", "Haiti": "ht",
  "USA": "us", "Paraguay": "py", "Australia": "au", "Turkiye": "tr",
  "Germany": "de", "Ecuador": "ec", "Ivory Coast": "ci", "Curacao": "cw",
  "Netherlands": "nl", "Japan": "jp", "Tunisia": "tn", "Sweden": "se",
  "Belgium": "be", "Iran": "ir", "Egypt": "eg", "New Zealand": "nz",
  "Spain": "es", "Uruguay": "uy", "Saudi Arabia": "sa", "Cape Verde": "cv",
  "France": "fr", "Senegal": "sn", "Norway": "no", "Iraq": "iq",
  "Argentina": "ar", "Austria": "at", "Algeria": "dz", "Jordan": "jo",
  "Portugal": "pt", "Colombia": "co", "Uzbekistan": "uz", "DR Congo": "cd",
  "England": "gb-eng", "Croatia": "hr", "Panama": "pa", "Ghana": "gh"
};

function getFlagUrl(teamName) {
  const code = countryCodes[teamName];
  if (code) {
    return `https://flagcdn.com/w80/${code}.png`;
  }
  return 'https://flagcdn.com/w80/un.png'; // Fallback flag
}

function getTeamCode(teamName) {
  // Return first 3 letters capitalized as country code representation (e.g. Mexico -> MEX)
  if (teamName === "South Africa") return "RSA";
  if (teamName === "South Korea") return "KOR";
  if (teamName === "Saudi Arabia") return "KSA";
  if (teamName === "Ivory Coast") return "CIV";
  if (teamName === "Bosnia-Herzegovina") return "BIH";
  if (teamName === "Czechia") return "CZE";
  if (teamName === "Netherlands") return "NED";
  if (teamName === "New Zealand") return "NZL";
  if (teamName === "Cape Verde") return "CPV";
  return teamName.substring(0, 3).toUpperCase();
}

function formatDate(dateStr) {
  const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return new Date(dateStr.replace(' ', 'T')).toLocaleDateString('es-ES', options);
}

function formatDateHeader(dateStr) {
  const dateObj = new Date(dateStr.replace(' ', 'T'));
  const options = { weekday: 'long', day: 'numeric', month: 'long' };
  const formatted = dateObj.toLocaleDateString('es-ES', options);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatTimeOnly(dateStr) {
  const dateObj = new Date(dateStr.replace(' ', 'T'));
  return dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function resolveMatchesTeams(matches) {
  const groupTeams = {
    A: ["Mexico", "South Korea", "South Africa", "Czechia"],
    B: ["Canada", "Switzerland", "Qatar", "Bosnia-Herzegovina"],
    C: ["Brazil", "Morocco", "Scotland", "Haiti"],
    D: ["USA", "Paraguay", "Australia", "Turkiye"],
    E: ["Germany", "Ecuador", "Ivory Coast", "Curacao"],
    F: ["Netherlands", "Japan", "Tunisia", "Sweden"],
    G: ["Belgium", "Iran", "Egypt", "New Zealand"],
    H: ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"],
    I: ["France", "Senegal", "Norway", "Iraq"],
    J: ["Argentina", "Austria", "Algeria", "Jordan"],
    K: ["Portugal", "Colombia", "Uzbekistan", "DR Congo"],
    L: ["England", "Croatia", "Panama", "Ghana"]
  };

  const standings = {};
  for (const group in groupTeams) {
    standings[group] = groupTeams[group].map(name => ({
      name, points: 0, gd: 0, gs: 0
    }));
  }

  function getTeamRef(group, name) {
    return standings[group] ? standings[group].find(t => t.name === name) : null;
  }

  matches.forEach(m => {
    if (m.stage === 'group') {
      const homeRef = getTeamRef(m.group_name, m.home_team);
      const awayRef = getTeamRef(m.group_name, m.away_team);
      if (!homeRef || !awayRef) return;

      const hasPred = m.predicted_home_score !== null && m.predicted_away_score !== null;
      const isFin = m.status === 'finished';
      
      let hs, as;
      if (isFin) {
        hs = m.home_score;
        as = m.away_score;
      } else if (hasPred) {
        hs = m.predicted_home_score;
        as = m.predicted_away_score;
      }

      if (hs !== undefined && as !== undefined) {
        homeRef.gs += hs;
        awayRef.gs += as;
        homeRef.gd += (hs - as);
        awayRef.gd += (as - hs);
        
        if (hs > as) {
          homeRef.points += 3;
        } else if (hs < as) {
          awayRef.points += 3;
        } else {
          homeRef.points += 1;
          awayRef.points += 1;
        }
      }
    }
  });

  for (const group in standings) {
    standings[group].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gs !== a.gs) return b.gs - a.gs;
      return a.name.localeCompare(b.name);
    });
  }

  const getGroupTeam = (group, rank) => {
    return standings[group] && standings[group][rank] ? standings[group][rank].name : `Grupo ${group} #${rank+1}`;
  };

  const r32Mapping = {
    "Ganador R32 - P1": getGroupTeam('A', 0),
    "Ganador R32 - Q1": getGroupTeam('C', 2),
    "Ganador R32 - P2": getGroupTeam('B', 0),
    "Ganador R32 - Q2": getGroupTeam('D', 2),
    "Ganador R32 - P3": getGroupTeam('C', 0),
    "Ganador R32 - Q3": getGroupTeam('A', 1),
    "Ganador R32 - P4": getGroupTeam('D', 0),
    "Ganador R32 - Q4": getGroupTeam('B', 1),
    "Ganador R32 - P5": getGroupTeam('E', 0),
    "Ganador R32 - Q5": getGroupTeam('A', 2),
    "Ganador R32 - P6": getGroupTeam('F', 0),
    "Ganador R32 - Q6": getGroupTeam('B', 2),
    "Ganador R32 - P7": getGroupTeam('G', 0),
    "Ganador R32 - Q7": getGroupTeam('C', 1),
    "Ganador R32 - P8": getGroupTeam('H', 0),
    "Ganador R32 - Q8": getGroupTeam('D', 1),
    "Ganador R32 - P9": getGroupTeam('I', 0),
    "Ganador R32 - Q9": getGroupTeam('E', 2),
    "Ganador R32 - P10": getGroupTeam('J', 0),
    "Ganador R32 - Q10": getGroupTeam('F', 2),
    "Ganador R32 - P11": getGroupTeam('K', 0),
    "Ganador R32 - Q11": getGroupTeam('E', 1),
    "Ganador R32 - P12": getGroupTeam('L', 0),
    "Ganador R32 - Q12": getGroupTeam('F', 1),
    "Ganador R32 - P13": getGroupTeam('G', 1),
    "Ganador R32 - Q13": getGroupTeam('I', 1),
    "Ganador R32 - P14": getGroupTeam('H', 1),
    "Ganador R32 - Q14": getGroupTeam('J', 1),
    "Ganador R32 - P15": getGroupTeam('K', 1),
    "Ganador R32 - Q15": getGroupTeam('G', 2),
    "Ganador R32 - P16": getGroupTeam('L', 1),
    "Ganador R32 - Q16": getGroupTeam('H', 2)
  };

  function getMatchResult(matchNum) {
    const m = matches.find(x => x.match_num == matchNum);
    if (!m) return { winner: `Ganador M${matchNum}`, loser: `Perdedor M${matchNum}` };

    const resolvedHome = getResolvedTeam(m.home_team);
    const resolvedAway = getResolvedTeam(m.away_team);

    const hasPred = m.predicted_home_score !== null && m.predicted_away_score !== null;
    const isFin = m.status === 'finished';
    
    let hs, as;
    if (isFin) {
      hs = m.home_score;
      as = m.away_score;
    } else if (hasPred) {
      hs = m.predicted_home_score;
      as = m.predicted_away_score;
    }

    if (hs !== undefined && as !== undefined) {
      if (hs >= as) {
        return { winner: resolvedHome, loser: resolvedAway };
      } else {
        return { winner: resolvedAway, loser: resolvedHome };
      }
    }
    return { winner: `Ganador M${matchNum}`, loser: `Perdedor M${matchNum}` };
  }

  function getResolvedTeam(teamName) {
    if (!teamName) return 'TBD';
    if (!teamName.startsWith('Ganador R') && !teamName.startsWith('Ganador Q') && !teamName.startsWith('Ganador S') && !teamName.startsWith('Perdedor') && !teamName.startsWith('Ganador M')) {
      return teamName;
    }

    if (r32Mapping[teamName]) {
      return r32Mapping[teamName];
    }

    if (teamName.startsWith('Ganador R16 - ')) {
      const parts = teamName.replace('Ganador R16 - P', '').replace('Ganador R16 - Q', '');
      const matchIndex = parseInt(parts) - 1;
      const isHome = teamName.includes('- P');
      const baseMatchNum = 73 + matchIndex * 2 + (isHome ? 0 : 1);
      return getMatchResult(baseMatchNum).winner;
    }

    if (teamName.startsWith('Ganador QF - ')) {
      const parts = teamName.replace('Ganador QF - P', '').replace('Ganador QF - Q', '');
      const matchIndex = parseInt(parts) - 1;
      const isHome = teamName.includes('- P');
      const baseMatchNum = 89 + matchIndex * 2 + (isHome ? 0 : 1);
      return getMatchResult(baseMatchNum).winner;
    }

    if (teamName.startsWith('Ganador SF - ')) {
      const parts = teamName.replace('Ganador SF - P', '').replace('Ganador SF - Q', '');
      const matchIndex = parseInt(parts) - 1;
      const isHome = teamName.includes('- P');
      const baseMatchNum = 97 + matchIndex * 2 + (isHome ? 0 : 1);
      return getMatchResult(baseMatchNum).winner;
    }

    if (teamName === 'Ganador SF1') return getMatchResult(101).winner;
    if (teamName === 'Ganador SF2') return getMatchResult(102).winner;
    if (teamName === 'Perdedor SF1') return getMatchResult(101).loser;
    if (teamName === 'Perdedor SF2') return getMatchResult(102).loser;

    return teamName;
  }

  return matches.map(m => ({
    ...m,
    home_team: getResolvedTeam(m.home_team),
    away_team: getResolvedTeam(m.away_team)
  }));
}

// 1. Auth Page Component (Login / Register)
function LoginRegisterComponent() {
  return `
    <main class="relative min-h-[80vh] w-full flex items-center justify-center lg:justify-start px-margin-mobile md:px-margin-desktop py-lg">
      <!-- Background Decoration -->
      <div class="fixed right-0 top-0 h-full w-1/3 opacity-20 pointer-events-none hidden lg:block overflow-hidden side-decoration">
        <img alt="" class="h-full w-auto object-cover object-right" src="https://lh3.googleusercontent.com/aida/AP1WRLtrbu7m4iI3iqjp0EffAgZGbA3FB9pCrgAGsw0N5i8IRBBJx9yNS5EBvWUfXBFfFpyTXCPJePgePRfZ-Ek0vJqB-BqEFkAOLu2Lm8pjbL3cgpVantvAUcYDHVcJK7N0ibfrq7ndVZo6_SV-7NRXIaqGrtSVfF7ZEG5r91zlGsHceuw4q6mNKyaaqTLv7S7tcybzWp4JMaOvvw8j8hE6V4bztEeUHjlFuOb7ePRHePlXkkDNwSS3ThqXZ-eG"/>
      </div>
      
      <!-- Login Card Container -->
      <div class="relative z-10 w-full max-w-[480px] bg-surface-container-lowest lg:ml-12">
        <div class="space-y-lg">
          <!-- Branding -->
          <div class="flex flex-col gap-md">
            <div class="space-y-xs">
              <h1 class="font-headline-lg text-headline-lg text-primary font-bold">
                TRÓPICA Quiniela 2026
              </h1>
              <p class="font-body-lg text-body-lg text-on-surface-variant">
                Portal de Colaboradores TRÓPICA
              </p>
            </div>
          </div>
          
          <!-- Main Action Area -->
          <div class="bg-surface-gray border border-border-light rounded-xl p-xl space-y-lg shadow-sm">
            <div class="space-y-sm">
              <p class="font-label-lg text-label-lg uppercase tracking-wider text-on-surface-variant">
                Acceso Corporativo
              </p>
              <h2 class="font-headline-sm text-headline-sm text-on-surface font-semibold">
                Accede para gestionar tus predicciones
              </h2>
            </div>
            
            <div class="space-y-md">
              <!-- Google Login CTA -->
              <button type="button" class="group w-full h-14 flex items-center justify-center gap-md bg-surface-container-lowest border border-border-light hover:border-primary-container hover:bg-primary-container/5 rounded-lg transition-all duration-200 active:scale-[0.98]" id="btn-google-oauth">
                <svg class="w-6 h-6" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"></path>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
                </svg>
                <span class="font-label-lg text-label-lg text-on-surface">
                  Iniciar sesión con Google
                </span>
              </button>
              
              <p class="text-center font-body-sm text-body-sm text-on-surface-variant mt-sm">
                Acceso restringido únicamente para dominios <span class="text-primary font-semibold">tropica.me</span>
              </p>
            </div>
            
            <div class="pt-md border-t border-border-light flex items-center justify-between">
              <div class="flex items-center gap-xs">
                <span class="material-symbols-outlined text-success-green" style="font-size: 18px;">verified_user</span>
                <span class="font-label-md text-label-md text-on-surface-variant">Acceso Seguro Único</span>
              </div>
            </div>
          </div>
          
          <!-- Footer Links -->
          <div class="flex gap-lg font-label-md text-label-md text-on-surface-variant">
            <a class="hover:text-primary transition-colors" href="#">Términos y Condiciones</a>
            <a class="hover:text-primary transition-colors" href="#">Privacidad</a>
            <a class="hover:text-primary transition-colors" href="#">FIFA WC 2026</a>
          </div>
        </div>
      </div>
    </main>
  `;
}

// 2. Dashboard Component
function DashboardComponent(state) {
  const user = state.user;
  const matches = resolveMatchesTeams(state.matches || []);
  const leaderboard = state.leaderboard || [];

  // Calculate statistics
  const userRankIdx = leaderboard.findIndex(item => item.id === user.id);
  const userRank = userRankIdx !== -1 ? userRankIdx + 1 : '--';
  const predictedCount = matches.filter(m => m.predicted_home_score !== null).length;
  const totalPoints = leaderboard[userRankIdx]?.points || 0;

  // Filter pending predictions for matches starting soon
  const now = Date.now();
  const pendingMatches = matches
    .filter(m => m.predicted_home_score === null && new Date(m.match_date).getTime() > now)
    .slice(0, 3);

  // Time remaining to World Cup 2026 Opening Match
  const kickoffDate = new Date("2026-06-11 18:00").getTime();
  const daysToKickoff = Math.max(0, Math.ceil((kickoffDate - now) / (1000 * 60 * 60 * 24)));

  return `
    <!-- Welcome Header -->
    <header class="mb-xl">
      <h1 class="font-headline-lg text-headline-lg text-on-surface mb-xs">Bienvenido de nuevo, ${user.name}</h1>
      <p class="font-body-md text-body-md text-on-surface-variant">Faltan <strong>${daysToKickoff} días</strong> para el inicio del Mundial 2026. ¡Sigue así!</p>
    </header>

    <!-- Bento Grid Layout -->
    <div class="bento-grid">
      <!-- Quick Stats Column -->
      <div class="col-span-12 md:col-span-4 flex flex-col gap-lg">
        <!-- Points Summary Card -->
        <div class="bg-white border border-border-light rounded-xl p-lg card-shadow">
          <div class="flex justify-between items-center mb-md">
            <span class="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Puntos Totales</span>
            <span class="material-symbols-outlined text-primary">analytics</span>
          </div>
          <div class="flex items-baseline gap-xs">
            <span class="font-display-lg text-display-lg text-primary font-bold" id="dash-pts-val">${totalPoints}</span>
            <span class="font-label-lg text-label-lg text-success-green flex items-center">
              <span class="material-symbols-outlined text-sm">arrow_upward</span>
              Activo
            </span>
          </div>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-sm">Puntos sumados por aciertos oficiales</p>
        </div>

        <!-- Ranking Card -->
        <div class="bg-white border border-border-light rounded-xl p-lg card-shadow relative overflow-hidden">
          <div class="flex justify-between items-center mb-md">
            <span class="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider">Posición Actual</span>
            <span class="material-symbols-outlined text-accent-gold" style="font-variation-settings: 'FILL' 1;">workspace_premium</span>
          </div>
          <div class="flex items-baseline gap-xs">
            <span class="font-display-lg text-display-lg text-on-surface font-bold">#${userRank}</span>
            <span class="font-headline-sm text-headline-sm text-on-surface-variant">/ ${leaderboard.length}</span>
          </div>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-sm">En 'TRÓPICA League'</p>
          <div class="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
            <span class="material-symbols-outlined text-9xl text-primary">emoji_events</span>
          </div>
        </div>

        <!-- Completed Predictions -->
        <div class="bg-primary text-on-primary rounded-xl p-lg card-shadow">
          <div class="flex justify-between items-center mb-md">
            <span class="font-label-lg text-label-lg uppercase tracking-wider opacity-90">Predicciones</span>
            <span class="material-symbols-outlined">task_alt</span>
          </div>
          <div class="flex items-baseline gap-xs">
            <span class="font-display-lg text-display-lg font-bold">${predictedCount}</span>
            <span class="font-headline-sm text-headline-sm opacity-80">completadas</span>
          </div>
          <div class="mt-md w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div class="bg-white h-full" style="width: ${Math.min(100, Math.round((predictedCount / 72) * 100))}%"></div>
          </div>
          <p class="font-body-sm text-body-sm mt-sm opacity-90">${72 - predictedCount} partidos restantes para predecir</p>
        </div>
      </div>

      <!-- Matches Section -->
      <div class="col-span-12 md:col-span-8">
        <div class="bg-white border border-border-light rounded-xl p-lg card-shadow h-full flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-center mb-xl">
              <h2 class="font-headline-md text-headline-md text-on-surface font-bold">Próximos Encuentros</h2>
              <a class="text-primary font-label-lg text-label-lg flex items-center gap-xs hover:underline" href="#matches">
                Ver calendario completo <span class="material-symbols-outlined text-sm">chevron_right</span>
              </a>
            </div>
            
            ${pendingMatches.length === 0 ? `
              <div class="flex flex-col items-center justify-center p-xl text-center">
                <span class="material-symbols-outlined text-success-green text-5xl mb-sm">task_alt</span>
                <p class="font-body-lg text-body-lg text-on-surface">¡Todo al día!</p>
                <p class="font-body-sm text-body-sm text-on-surface-variant">No tienes predicciones pendientes por hacer en este momento.</p>
              </div>
            ` : `
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-md">
                ${pendingMatches.map(m => {
                  const hasPrediction = m.predicted_home_score !== null;
                  const homeVal = hasPrediction ? m.predicted_home_score : '';
                  const awayVal = hasPrediction ? m.predicted_away_score : '';
                  const statusLabel = hasPrediction ? 'Pronosticado' : 'Pendiente';
                  const btnLabel = hasPrediction ? 'Guardado' : 'Predecir';
                  const statusColorClass = hasPrediction ? 'bg-success-green' : 'bg-coral';
                  const btnColorStyle = hasPrediction ? 'background-color:#6f7a70' : '';

                  return `
                    <!-- Dynamic Match Card -->
                    <div class="bg-surface-gray border border-border-light rounded-xl overflow-hidden flex flex-col justify-between hover:border-primary transition-all duration-200 card-shadow cursor-pointer group" onclick="if(event.target.tagName !== 'INPUT' && event.target.tagName !== 'BUTTON') window.location.hash='#matches'" id="match-row-dash-${m.id}">
                      <!-- Stadium Image Header -->
                      <div class="w-full h-24 overflow-hidden relative">
                        <img alt="Estadio" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnbTCYAi3Ely4vxtUR6W1rHw9_ycDDpy199QBsGZMum5I18t2Fcla3iY2l21x9PpmP4ZrFkGlqZWUq0mRsEhv4Y_jj1flHqkymbmVxlZK8WPCai_NluxVOwuRKAWZneJm-nTLfMRCemwRVMHslt114XhMPEzGCXFAINL6i8iUfNRtLdjhDIVFHbg7gn_didIUP7vwpdGR2x4ccYBuZDKtP9ZC7_blPdc_VlDUZZZNF6ss0Q6In9LN53gc67dLx7mJXcMrv8rPEA2kp"/>
                        <div class="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"></div>
                        <div class="absolute bottom-xs left-md text-white flex justify-between w-[calc(100%-1.5rem)] items-center">
                          <span class="font-semibold text-xs uppercase tracking-wider text-white opacity-90">Grupo ${m.group_name}</span>
                          <span class="font-medium text-[11px] text-white opacity-90">${formatDate(m.match_date)}</span>
                        </div>
                      </div>

                      <div class="p-md flex flex-col justify-between flex-1">
                        <!-- Middle: Flags & Inputs directly below flags -->
                        <div class="flex items-center justify-between my-sm">
                          <!-- Team Home -->
                          <div class="flex flex-col items-center flex-1">
                            <div class="w-10 h-10 rounded-full overflow-hidden border border-border-light bg-white flex items-center justify-center">
                              <img alt="${m.home_team}" class="w-full h-full object-cover" src="${getFlagUrl(m.home_team)}" onerror="this.src='https://flagcdn.com/w80/un.png'"/>
                            </div>
                            <input class="w-12 text-center border border-border-light rounded-lg focus:ring-1 focus:ring-primary focus:border-primary p-0.5 font-headline-sm text-headline-sm text-primary mt-sm prediction-input" 
                                   type="number" min="0" max="99" placeholder="-"
                                   data-match-id="${m.id}" data-team="home" value="${homeVal}"/>
                            <span class="font-label-md text-label-md mt-xs text-on-surface font-semibold truncate max-w-[80px]" title="${m.home_team}">${getTeamCode(m.home_team)}</span>
                            <span class="text-[10px] text-on-surface-variant opacity-80 truncate max-w-[90px] text-center font-medium" title="${m.home_team}">${m.home_team}</span>
                          </div>

                          <!-- VS -->
                          <span class="font-label-md text-label-md text-on-surface-variant font-bold px-sm">VS</span>

                          <!-- Team Away -->
                          <div class="flex flex-col items-center flex-1">
                            <div class="w-10 h-10 rounded-full overflow-hidden border border-border-light bg-white flex items-center justify-center">
                              <img alt="${m.away_team}" class="w-full h-full object-cover" src="${getFlagUrl(m.away_team)}" onerror="this.src='https://flagcdn.com/w80/un.png'"/>
                            </div>
                            <input class="w-12 text-center border border-border-light rounded-lg focus:ring-1 focus:ring-primary focus:border-primary p-0.5 font-headline-sm text-headline-sm text-primary mt-sm prediction-input" 
                                   type="number" min="0" max="99" placeholder="-"
                                   data-match-id="${m.id}" data-team="away" value="${awayVal}"/>
                            <span class="font-label-md text-label-md mt-xs text-on-surface font-semibold truncate max-w-[80px]" title="${m.away_team}">${getTeamCode(m.away_team)}</span>
                            <span class="text-[10px] text-on-surface-variant opacity-80 truncate max-w-[90px] text-center font-medium" title="${m.away_team}">${m.away_team}</span>
                          </div>
                        </div>

                        <!-- Bottom Action -->
                        <div class="flex justify-between items-center mt-sm pt-xs border-t border-border-light">
                          <span class="text-xs text-coral" id="status-text-${m.id}">
                            <span class="inline-block w-1.5 h-1.5 rounded-full ${statusColorClass} mr-1"></span> ${statusLabel}
                          </span>
                          <button class="bg-primary text-on-primary px-sm py-0.5 rounded font-label-md text-xs btn-save-prediction" data-match-id="${m.id}" id="save-btn-${m.id}" style="${btnColorStyle}">${btnLabel}</button>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          </div>
          
          <!-- Mini Leaderboard inside the bento -->
          <div class="mt-xl pt-xl border-t border-border-light">
            <h3 class="font-label-lg text-label-lg text-on-surface-variant uppercase tracking-wider mb-md">Top Empleados</h3>
            <div class="flex flex-col gap-sm">
              ${leaderboard.slice(0, 3).map((row, idx) => {
                const isMe = row.id === user.id;
                return `
                  <div class="flex items-center justify-between p-sm rounded-lg ${isMe ? 'bg-accent-gold/10 border border-accent-gold/20' : 'hover:bg-surface-gray'}">
                    <div class="flex items-center gap-md">
                      <span class="font-label-lg text-label-lg text-on-surface-variant w-4">${idx + 1}</span>
                      <div class="w-8 h-8 rounded-full ${idx === 0 ? 'bg-accent-gold/20' : 'bg-primary/10'} flex items-center justify-center">
                        <span class="material-symbols-outlined ${idx === 0 ? 'text-accent-gold' : 'text-primary'} text-lg">
                          ${idx === 0 ? 'workspace_premium' : 'person'}
                        </span>
                      </div>
                      <span class="font-body-md text-body-md ${isMe ? 'font-semibold' : ''}">
                        ${row.name} ${isMe ? '(Tú)' : ''}
                      </span>
                    </div>
                    <span class="font-label-lg text-label-lg text-primary ${isMe ? 'font-bold' : ''}">${row.points} pts</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// 3. Matches Predictor Component
function MatchesComponent(state, filterType = 'pending') {
  const matches = resolveMatchesTeams(state.matches || []);
  const now = Date.now();

  // Apply filters
  let filteredMatches = [];
  if (filterType === 'pending') {
    filteredMatches = matches.filter(m => m.predicted_home_score === null && new Date(m.match_date).getTime() > now);
  } else if (filterType === 'completed') {
    filteredMatches = matches.filter(m => m.predicted_home_score !== null);
  } else if (filterType === 'finished') {
    filteredMatches = matches.filter(m => m.status === 'finished');
  } else if (filterType.startsWith('group-')) {
    const groupName = filterType.replace('group-', '');
    filteredMatches = matches.filter(m => m.group_name === groupName && m.stage === 'group');
  } else if (filterType === 'r32') {
    filteredMatches = matches.filter(m => m.stage === 'r32');
  } else {
    filteredMatches = matches; // All
  }

  const groupsList = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];

  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return `
    <div class="bg-white border border-border-light rounded-xl p-lg card-shadow">
      <div class="flex justify-between items-center mb-lg flex-wrap gap-md">
        <div class="flex items-center gap-md flex-wrap">
          <div>
            <h2 class="font-headline-md text-headline-md text-on-surface font-bold">Pronosticar Partidos</h2>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Registra tus marcadores. Los partidos se bloquean en el horario de inicio.</p>
          </div>
          ${isLocal ? `
            <button id="btn-dev-fill-my-predictions" class="bg-[#EA4335] text-white font-label-md text-xs px-md py-sm rounded-lg hover:opacity-90 active:scale-95 transition-all flex items-center gap-xs ml-sm md:ml-md shadow-sm border border-red-500 animate-pulse" title="Rellenar predicciones aleatorias para fase de grupos (Sólo Local/Dev)">
              <span class="material-symbols-outlined text-[16px]">bug_report</span>
              Autollenar Grupos (Dev)
            </button>
          ` : ''}
          <button id="btn-start-tutorial" class="bg-primary/10 text-primary font-label-md text-xs px-md py-sm rounded-lg hover:bg-primary/20 active:scale-95 transition-all flex items-center gap-xs ml-sm md:ml-md border border-primary/20" title="Ver tutorial de cómo jugar">
            <span class="material-symbols-outlined text-[16px]">help</span>
            Cómo Jugar
          </button>
        </div>
        
        <!-- Filter Selector tabs -->
        <div class="flex flex-wrap gap-xs bg-surface-gray border border-border-light p-1 rounded-lg">
          <button class="px-md py-sm rounded-lg font-label-md text-label-md transition-colors filter-tab-btn ${filterType === 'pending' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}" data-filter="pending">Pendientes</button>
          <button class="px-md py-sm rounded-lg font-label-md text-label-md transition-colors filter-tab-btn ${filterType === 'completed' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}" data-filter="completed">Pronosticados</button>
          <button class="px-md py-sm rounded-lg font-label-md text-label-md transition-colors filter-tab-btn ${filterType === 'finished' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}" data-filter="finished">Resultados</button>
          <button class="px-md py-sm rounded-lg font-label-md text-label-md transition-colors filter-tab-btn ${filterType === 'all' ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}" data-filter="all">Todos</button>
        </div>
      </div>

      <!-- Advanced Group Selector -->
      <div class="mb-lg border-b border-border-light pb-md flex items-center justify-between flex-wrap gap-sm">
        <span class="font-label-md text-label-md text-on-surface-variant">Filtrar Fase:</span>
        <div class="flex gap-sm">
          <select id="group-filter-select" class="border border-border-light rounded-lg px-md py-sm focus:ring-1 focus:ring-primary focus:border-primary text-body-sm bg-white">
            <option value="">Todos los Grupos / Eliminatorias</option>
            ${groupsList.map(g => `<option value="group-${g}" ${filterType === `group-${g}` ? 'selected' : ''}>Grupo ${g}</option>`).join('')}
            <option value="r32" ${filterType === 'r32' ? 'selected' : ''}>Ronda de 32 (Dieciseisavos)</option>
          </select>
        </div>
      </div>

      <!-- Matches list container -->
      ${filteredMatches.length === 0 ? `
        <div class="flex flex-col items-center justify-center p-xl text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-4xl mb-sm">sports_soccer</span>
          <p class="font-body-md text-body-md">No se encontraron encuentros con este filtro.</p>
        </div>
      ` : (() => {
        // Group matches by date key (YYYY-MM-DD)
        const groups = {};
        filteredMatches.forEach(m => {
          const dateKey = m.match_date.split(' ')[0];
          if (!groups[dateKey]) {
            groups[dateKey] = [];
          }
          groups[dateKey].push(m);
        });

        // Get sorted date keys
        const sortedDates = Object.keys(groups).sort();

        return sortedDates.map(dateKey => {
          const matchesInDate = groups[dateKey];
          return `
            <div class="mb-xl">
              <!-- Date Header -->
              <div class="flex items-center gap-md mb-md">
                <h3 class="font-headline-sm text-headline-sm text-primary font-bold">
                  ${formatDateHeader(matchesInDate[0].match_date)}
                </h3>
                <div class="flex-grow border-t border-border-light"></div>
              </div>
              
              <!-- Cards Grid for this date -->
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-md">
                ${matchesInDate.map(m => {
                  const isLocked = new Date(m.match_date).getTime() <= now;
                  const isFinished = m.status === 'finished';
                  const hasPrediction = m.predicted_home_score !== null;
                  const homeScoreVal = hasPrediction ? m.predicted_home_score : '';
                  const awayScoreVal = hasPrediction ? m.predicted_away_score : '';
                  const stageLabel = m.stage === 'group' ? `Grupo ${m.group_name}` : (m.stage === 'r32' ? 'Dieciseisavos' : m.stage.toUpperCase());

                  return `
                    <div class="bg-surface-gray border ${hasPrediction ? 'border-primary/40 bg-primary/5' : 'border-border-light'} rounded-xl overflow-hidden flex flex-col justify-between hover:border-primary transition-all duration-200 card-shadow cursor-pointer group" id="match-row-${m.id}">
                      <!-- Stadium Image Header -->
                      <div class="w-full h-24 overflow-hidden relative">
                        <img alt="Estadio" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnbTCYAi3Ely4vxtUR6W1rHw9_ycDDpy199QBsGZMum5I18t2Fcla3iY2l21x9PpmP4ZrFkGlqZWUq0mRsEhv4Y_jj1flHqkymbmVxlZK8WPCai_NluxVOwuRKAWZneJm-nTLfMRCemwRVMHslt114XhMPEzGCXFAINL6i8iUfNRtLdjhDIVFHbg7gn_didIUP7vwpdGR2x4ccYBuZDKtP9ZC7_blPdc_VlDUZZZNF6ss0Q6In9LN53gc67dLx7mJXcMrv8rPEA2kp"/>
                        <div class="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"></div>
                        <div class="absolute bottom-xs left-md text-white flex justify-between w-[calc(100%-1.5rem)] items-center">
                          <span class="font-semibold text-xs uppercase tracking-wider text-white opacity-90">${stageLabel}</span>
                          <span class="font-bold text-[12px] flex items-center gap-xs text-white">
                            <span class="material-symbols-outlined text-[14px]">schedule</span>
                            ${formatTimeOnly(m.match_date)}
                          </span>
                        </div>
                      </div>

                      <!-- Card Body -->
                      <div class="p-md flex flex-col justify-between flex-1">
                        <!-- Middle: Flags & Inputs directly below flags -->
                        <div class="flex items-center justify-between my-sm">
                          <!-- Team Home -->
                          <div class="flex flex-col items-center flex-1">
                            <div class="w-10 h-10 rounded-full overflow-hidden border border-border-light bg-white flex items-center justify-center">
                              <img alt="${m.home_team}" class="w-full h-full object-cover" src="${getFlagUrl(m.home_team)}" onerror="this.src='https://flagcdn.com/w80/un.png'"/>
                            </div>
                            <input class="w-12 text-center border border-border-light rounded-lg focus:ring-1 focus:ring-primary focus:border-primary p-0.5 font-headline-sm text-headline-sm text-primary mt-sm prediction-input" 
                                   type="number" min="0" max="99" placeholder="-"
                                   data-match-id="${m.id}" data-team="home" value="${homeScoreVal}" ${isLocked ? 'disabled' : ''}/>
                            <span class="font-label-md text-label-md mt-xs text-on-surface font-semibold truncate max-w-[80px]" title="${m.home_team}">${getTeamCode(m.home_team)}</span>
                            <span class="text-[10px] text-on-surface-variant opacity-80 truncate max-w-[90px] text-center font-medium" title="${m.home_team}">${m.home_team}</span>
                          </div>

                          <!-- VS -->
                          <span class="font-label-md text-label-md text-on-surface-variant font-bold px-sm">VS</span>

                          <!-- Team Away -->
                          <div class="flex flex-col items-center flex-1">
                            <div class="w-10 h-10 rounded-full overflow-hidden border border-border-light bg-white flex items-center justify-center">
                              <img alt="${m.away_team}" class="w-full h-full object-cover" src="${getFlagUrl(m.away_team)}" onerror="this.src='https://flagcdn.com/w80/un.png'"/>
                            </div>
                            <input class="w-12 text-center border border-border-light rounded-lg focus:ring-1 focus:ring-primary focus:border-primary p-0.5 font-headline-sm text-headline-sm text-primary mt-sm prediction-input" 
                                   type="number" min="0" max="99" placeholder="-"
                                   data-match-id="${m.id}" data-team="away" value="${awayScoreVal}" ${isLocked ? 'disabled' : ''}/>
                            <span class="font-label-md text-label-md mt-xs text-on-surface font-semibold truncate max-w-[80px]" title="${m.away_team}">${getTeamCode(m.away_team)}</span>
                            <span class="text-[10px] text-on-surface-variant opacity-80 truncate max-w-[90px] text-center font-medium" title="${m.away_team}">${m.away_team}</span>
                          </div>
                        </div>

                        <!-- Bottom Action -->
                        <div class="flex justify-between items-center mt-sm pt-xs border-t border-border-light">
                          <div class="flex flex-col">
                            ${isFinished ? `
                              <span class="font-label-md text-xs text-success-green font-bold">
                                Oficial: ${m.home_score}-${m.away_score}
                              </span>
                              <span class="text-[11px] font-bold text-primary">+${m.points_earned} pts</span>
                            ` : (isLocked ? `
                              <span class="text-xs text-on-surface-variant italic">Bloqueado</span>
                            ` : `
                              <span class="text-xs text-coral" id="status-text-${m.id}">
                                <span class="inline-block w-1.5 h-1.5 rounded-full ${hasPrediction ? 'bg-success-green' : 'bg-coral'} mr-1"></span>
                                ${hasPrediction ? 'Pronosticado' : 'Pendiente'}
                              </span>
                            `)}
                          </div>
                          <div>
                            ${!isLocked && !isFinished ? `
                              <button class="bg-primary text-on-primary px-sm py-0.5 rounded font-label-md text-xs btn-save-prediction hover:opacity-90 transition-opacity" 
                                      data-match-id="${m.id}" id="save-btn-${m.id}" style="${hasPrediction ? 'background-color:#6f7a70' : ''}">
                                ${hasPrediction ? 'Guardado' : 'Predecir'}
                              </button>
                            ` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('');
      })()}
    </div>
  `;
}

// 4. Leaderboard Component
function LeaderboardComponent(state) {
  const leaderboard = state.leaderboard || [];
  const currentUserId = state.user?.id;

  return `
    <div class="bg-white border border-border-light rounded-xl p-lg card-shadow">
      <div>
        <h2 class="font-headline-md text-headline-md text-on-surface font-bold">Tabla de Clasificación</h2>
        <p class="font-body-sm text-body-sm text-on-surface-variant">Competencia oficial interna del equipo de TRÓPICA. Los empates se resuelven por aciertos exactos.</p>
      </div>

      <div class="overflow-x-auto mt-xl">
        <table class="w-full border-collapse text-left text-body-md">
          <thead>
            <tr class="border-b border-border-light">
              <th class="py-md px-lg font-label-lg text-label-lg text-on-surface-variant uppercase w-16">Pos</th>
              <th class="py-md px-lg font-label-lg text-label-lg text-on-surface-variant uppercase">Usuario</th>
              <th class="py-md px-lg font-label-lg text-label-lg text-on-surface-variant uppercase text-center">Exacto (3pts)</th>
              <th class="py-md px-lg font-label-lg text-label-lg text-on-surface-variant uppercase text-center">Resultado (1pt)</th>
              <th class="py-md px-lg font-label-lg text-label-lg text-on-surface-variant uppercase text-center">Errado (0pts)</th>
              <th class="py-md px-lg font-label-lg text-label-lg text-on-surface-variant uppercase text-right">Puntos</th>
            </tr>
          </thead>
          <tbody>
            ${leaderboard.length === 0 ? `
              <tr>
                <td colspan="6" class="py-xl text-center text-on-surface-variant">Aún no hay usuarios registrados.</td>
              </tr>
            ` : leaderboard.map((row, idx) => {
              const isMe = row.id === currentUserId;
              const rank = idx + 1;
              return `
                <tr class="border-b border-border-light transition-colors hover:bg-surface-gray ${isMe ? 'bg-accent-gold/10 border-l-4 border-l-primary' : ''}">
                  <td class="py-md px-lg font-bold">
                    <span class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${rank === 1 ? 'bg-accent-gold text-on-secondary-container' : (rank === 2 ? 'bg-border-light text-on-surface' : (rank === 3 ? 'bg-orange-200 text-orange-800' : 'bg-surface-container text-on-surface-variant'))}">
                      ${rank}
                    </span>
                  </td>
                  <td class="py-md px-lg font-semibold text-on-surface">
                    ${row.name} ${isMe ? '<span class="ml-2 text-xs bg-primary text-on-primary px-sm py-xs rounded">Tú</span>' : ''}
                  </td>
                  <td class="py-md px-lg text-center font-bold text-primary">${row.exact_count || 0}</td>
                  <td class="py-md px-lg text-center text-on-surface-variant">${row.outcome_count || 0}</td>
                  <td class="py-md px-lg text-center text-red-500">${row.wrong_count || 0}</td>
                  <td class="py-md px-lg text-right font-bold text-primary text-lg">${row.points} pts</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 5. Admin Panel Component
function AdminComponent(state) {
  const matches = resolveMatchesTeams(state.matches || []);
  const activeMatches = matches.filter(m => m.stage === 'group' || m.is_knockout === 1);
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return `
    <div class="bento-grid">
      <!-- Fixture Results Manager -->
      <div class="col-span-12 md:col-span-8 bg-white border border-border-light rounded-xl p-lg card-shadow">
        <div class="mb-lg">
          <h2 class="font-headline-md text-headline-md text-on-surface font-bold">Administrar Resultados</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant">Introduce resultados oficiales y finaliza los partidos para actualizar los puntos generales.</p>
        </div>

        <div class="flex flex-col gap-md max-h-[600px] overflow-y-auto pr-sm custom-scrollbar">
          ${activeMatches.map(m => {
            const hasScore = m.home_score !== null;
            const homeScoreVal = hasScore ? m.home_score : '';
            const awayScoreVal = hasScore ? m.away_score : '';
            const isFinished = m.status === 'finished';

            return `
              <div class="p-md bg-surface-gray border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-md" id="admin-match-card-${m.id}">
                <div>
                  <span class="text-xs bg-surface-container text-on-surface-variant px-sm py-xs rounded uppercase font-bold">Partido #${m.match_num}</span>
                  <span class="text-xs ${isFinished ? 'text-success-green font-bold' : 'text-coral font-bold'} ml-sm uppercase">
                    ${isFinished ? 'FINALIZADO' : 'PENDIENTE'}
                  </span>
                  <div class="font-label-lg text-label-lg mt-xs text-on-surface-variant">${formatDate(m.match_date)}</div>
                </div>

                <div class="flex items-center gap-sm">
                  <span class="font-semibold text-body-sm w-24 text-right truncate">${m.home_team}</span>
                  
                  <input type="number" min="0" class="w-12 text-center border border-border-light rounded focus:ring-1 focus:ring-primary focus:border-primary p-1 admin-home-score" 
                         data-match-id="${m.id}" value="${homeScoreVal}">
                  
                  <span class="font-bold text-on-surface-variant">-</span>
                  
                  <input type="number" min="0" class="w-12 text-center border border-border-light rounded focus:ring-1 focus:ring-primary focus:border-primary p-1 admin-away-score" 
                         data-match-id="${m.id}" value="${awayScoreVal}">
                  
                  <span class="font-semibold text-body-sm w-24 text-left truncate">${m.away_team}</span>
                </div>

                <div>
                  <button class="bg-primary hover:bg-primary-container text-on-primary px-lg py-sm rounded-lg font-label-lg text-label-lg transition-colors btn-admin-save-score" 
                          data-match-id="${m.id}">
                    ${isFinished ? 'Modificar' : 'Finalizar'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Developer Simulation Panel / Production Info -->
      ${isLocal ? `
      <div class="col-span-12 md:col-span-4 bg-white border border-border-light rounded-xl p-lg card-shadow">
        <h2 class="font-headline-sm text-headline-sm text-on-surface font-bold mb-md">Simulador de Quiniela</h2>
        <p class="font-body-sm text-body-sm text-on-surface-variant mb-lg">Puebla la plataforma con predicciones ficticias para realizar pruebas inmediatas de clasificaciones y tablas.</p>

        <div class="space-y-lg">
          <div class="bg-surface-gray border border-border-light p-md rounded-lg space-y-md">
            <h3 class="font-label-lg text-label-lg text-primary font-bold">Generar Competidores</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant">Crea 10 perfiles corporativos (Benjamín, Eugenio, Lucas, etc.) y rellena predicciones de forma aleatoria.</p>
            <button id="btn-admin-fill-random" class="w-full bg-primary hover:bg-primary-container text-on-primary py-md rounded-lg font-label-lg text-label-lg transition-colors active:scale-95 duration-100">
              Poblar Base de Datos (Demo)
            </button>
          </div>

          <div class="bg-primary/5 border border-primary/20 p-md rounded-lg">
            <h3 class="font-label-lg text-label-lg text-primary font-bold">¿Cómo probar?</h3>
            <ol class="list-decimal pl-md font-body-sm text-body-sm text-on-surface-variant mt-sm space-y-sm">
              <li>Haz clic en "Poblar Base de Datos"</li>
              <li>Simula resultados de algún partido en el panel de la izquierda de esta interfaz.</li>
              <li>Revisa la pestaña "Leaderboards" para ver los puntos.</li>
            </ol>
          </div>
        </div>
      </div>
      ` : `
      <div class="col-span-12 md:col-span-4 bg-white border border-border-light rounded-xl p-lg card-shadow">
        <h2 class="font-headline-sm text-headline-sm text-on-surface font-bold mb-md">Información de Producción</h2>
        <p class="font-body-sm text-body-sm text-on-surface-variant mb-lg">Te encuentras en la interfaz de administración en vivo del portal corporativo de TRÓPICA.</p>
        <div class="bg-primary/5 border border-primary/20 p-md rounded-lg space-y-sm">
          <h3 class="font-label-lg text-label-lg text-primary font-bold">Cálculo en Tiempo Real</h3>
          <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Las predicciones de los usuarios reales se procesan en tiempo real. Cuando registres y finalices el marcador oficial de un partido en el panel de la izquierda, se actualizarán los puntajes globales de todos los participantes de forma automática.
          </p>
        </div>
      </div>
      `}
    </div>
  `;
}
