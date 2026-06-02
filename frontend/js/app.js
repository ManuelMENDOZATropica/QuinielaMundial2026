// ==========================================
// QUINIELA WORLD CUP 2026 - CLIENT CONTROLLER
// ==========================================

// Global Application State
const state = {
  user: null,
  matches: [],
  leaderboard: [],
  currentMatchesFilter: 'pending' // Default filter for predictions page
};

// Toast Notifications Helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // Trigger CSS slide-in
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Remove after 3.5 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3500);
}

// Show Loader inside the app main view
function showLoader() {
  const appContainer = document.getElementById('app');
  if (appContainer) {
    appContainer.innerHTML = `
      <div class="flex items-center justify-center min-h-[300px]">
        <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    `;
  }
}

// API Service Module
const API = {
  async get(url) {
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ocurrió un error");
      return data;
    } catch (err) {
      console.error(`API GET ERROR: ${url}`, err);
      throw err;
    }
  },

  async post(url, body) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ocurrió un error");
      return data;
    } catch (err) {
      console.error(`API POST ERROR: ${url}`, err);
      throw err;
    }
  }
};

// Check User Session
async function checkAuth() {
  try {
    const data = await API.get('/api/auth/me');
    state.user = data.user;
    updateShellUI();
    return state.user;
  } catch (err) {
    state.user = null;
    updateShellUI();
    return null;
  }
}

// Toggle Visibility of Shell elements (Suppression on Login/Register screens)
function updateShellUI() {
  const header = document.getElementById('main-header');
  const sidebar = document.getElementById('main-sidebar');
  const mobileNav = document.getElementById('mobile-nav');
  const mainContainer = document.getElementById('main-container');
  const headerUsername = document.getElementById('header-username');

  // Admin links
  const adminTopLink = document.getElementById('nav-admin-top');
  const adminSideLink = document.getElementById('nav-admin-side');
  const adminMobileLink = document.getElementById('nav-admin-mobile');

  if (state.user) {
    // Show navigation bars
    header.classList.remove('hidden');
    sidebar.classList.remove('hidden');
    sidebar.classList.add('flex'); // Keep it flex on desktop
    mobileNav.classList.remove('hidden');
    
    // Add margin space on desktop to clear side navigation
    mainContainer.classList.add('md:ml-64');
    
    // Set profile name
    headerUsername.textContent = state.user.name.split(' ')[0];

    // Check admin level
    if (state.user.is_admin === 1) {
      adminTopLink?.classList.remove('hidden');
      adminSideLink?.classList.remove('hidden');
      adminMobileLink?.classList.remove('hidden');
    } else {
      adminTopLink?.classList.add('hidden');
      adminSideLink?.classList.add('hidden');
      adminMobileLink?.classList.add('hidden');
    }
  } else {
    // Hide navigation bars (Login/Register screens)
    header.classList.add('hidden');
    sidebar.classList.add('hidden');
    sidebar.classList.remove('flex');
    mobileNav.classList.add('hidden');
    
    // Clear margins
    mainContainer.classList.remove('md:ml-64');
  }
}

// Highlight Active Nav tab/links
function highlightActiveLinks(hash) {
  // 1. Desktop Top Bar Tabs
  document.querySelectorAll('.nav-tab').forEach(link => {
    if (link.getAttribute('href') === hash) {
      link.className = "text-primary font-bold border-b-2 border-primary px-sm h-full flex items-center transition-colors nav-tab";
    } else {
      link.className = "text-on-surface-variant hover:bg-surface-container-low transition-colors px-sm h-full flex items-center nav-tab";
    }
  });

  // 2. Desktop Side Bar Links
  document.querySelectorAll('.sidebar-link').forEach(link => {
    if (link.getAttribute('href') === hash) {
      link.className = "flex items-center gap-md p-md text-primary font-bold bg-primary-container/10 rounded-lg active:scale-95 transition-transform duration-150 sidebar-link";
    } else {
      link.className = "flex items-center gap-md p-md text-on-surface-variant hover:bg-surface-container rounded-lg active:scale-95 transition-transform duration-150 sidebar-link";
    }
  });

  // 3. Mobile Bottom Links
  document.querySelectorAll('.mobile-link').forEach(link => {
    if (link.getAttribute('href') === hash) {
      link.className = "flex flex-col items-center gap-xs text-primary mobile-link";
    } else {
      link.className = "flex flex-col items-center gap-xs text-on-surface-variant mobile-link";
    }
  });
}

// Router
async function router() {
  const hash = window.location.hash || '#matches';
  const appContainer = document.getElementById('app');

  const publicRoutes = ['#login', '#register'];
  const isPublic = publicRoutes.includes(hash);

  await checkAuth();

  if (!state.user && !isPublic) {
    window.location.hash = '#login';
    return;
  }

  if (state.user && isPublic) {
    window.location.hash = '#matches';
    return;
  }

  highlightActiveLinks(hash);
  showLoader();

  try {
    if (hash === '#login') {
      appContainer.innerHTML = LoginRegisterComponent(false);
      bindAuthPageEvents(false);
    } 
    else if (hash === '#register') {
      appContainer.innerHTML = LoginRegisterComponent(true);
      bindAuthPageEvents(true);
    } 
    else if (hash === '#dashboard') {
      const [matchesData, leaderboardData] = await Promise.all([
        API.get('/api/matches'),
        API.get('/api/leaderboard')
      ]);
      state.matches = matchesData.matches;
      state.leaderboard = leaderboardData.leaderboard;

      appContainer.innerHTML = DashboardComponent(state);
    } 
    else if (hash === '#matches') {
      const data = await API.get('/api/matches');
      state.matches = data.matches;

      appContainer.innerHTML = MatchesComponent(state, state.currentMatchesFilter);
      bindMatchesPageEvents();
    } 
    else if (hash === '#leaderboard') {
      const data = await API.get('/api/leaderboard');
      state.leaderboard = data.leaderboard;

      appContainer.innerHTML = LeaderboardComponent(state);
    } 
    else if (hash === '#admin') {
      if (!state.user || state.user.is_admin !== 1) {
        window.location.hash = '#matches';
        return;
      }
      const data = await API.get('/api/matches');
      state.matches = data.matches;

      appContainer.innerHTML = AdminComponent(state);
      bindAdminPageEvents();
    }
  } catch (err) {
    appContainer.innerHTML = `
      <div class="bg-white border border-border-light rounded-xl p-lg card-shadow text-center text-red-500 max-w-lg mx-auto">
        <h2 class="font-headline-sm text-headline-sm font-bold">Error al cargar la página</h2>
        <p class="font-body-sm text-body-sm text-on-surface-variant mt-sm">${err.message}</p>
        <button class="bg-primary text-on-primary py-sm px-md rounded mt-md font-label-md" onclick="router()">Reintentar</button>
      </div>
    `;
  }
}

// BIND EVENTS FOR LOGIN/REGISTER
function bindAuthPageEvents(isRegister) {
  // Google Login click event (Simulated login using OAuth trigger for Carlos R.)
  const googleBtn = document.getElementById('btn-google-oauth');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      googleBtn.classList.add('opacity-80', 'pointer-events-none');
      googleBtn.innerHTML = `
        <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="font-label-lg text-label-lg">Verificando...</span>
      `;

      try {
        // Log in as Carlos R. (Registers/Logs in via OAuth mock)
        // First try to register Carlos R, then login
        try {
          await API.post('/api/auth/register', {
            name: "Carlos Rodriguez",
            email: "carlos@tropica.me",
            password: "carlosquiniela"
          });
        } catch (e) {
          // If already registered, ignore and proceed to login
        }
        
        const data = await API.post('/api/auth/login', {
          email: "carlos@tropica.me",
          password: "carlosquiniela"
        });
        state.user = data.user;
        
        showToast("Sesión iniciada con Google (carlos@tropica.me)");
        window.location.hash = '#matches';
      } catch (err) {
        showToast("Error en simulación OAuth: " + err.message, 'error');
        googleBtn.innerHTML = `
          <span class="font-label-lg text-label-lg text-on-surface">Iniciar sesión con Google (Demo)</span>
        `;
        googleBtn.classList.remove('opacity-80', 'pointer-events-none');
      }
    });
  }

  // Password Login / Register Form submit
  const form = document.getElementById('auth-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      const submitBtn = document.getElementById('btn-auth-submit');
      
      let name = '';
      if (isRegister) {
        name = document.getElementById('reg-name').value;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Procesando...';

      try {
        const url = isRegister ? '/api/auth/register' : '/api/auth/login';
        const body = isRegister ? { name, email, password } : { email, password };
        
        const data = await API.post(url, body);
        state.user = data.user;
        
        showToast(isRegister ? "¡Registro completado! Bienvenido." : "Sesión iniciada.");
        window.location.hash = '#matches';
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = isRegister ? 'Registrarse' : 'Iniciar Sesión';
      }
    });
  }
}

// BIND EVENTS FOR MATCHES PAGE
function bindMatchesPageEvents() {
  const appContainer = document.getElementById('app');
  
  // Filter tabs delegation
  const filterBtns = appContainer.querySelectorAll('.filter-tab-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      state.currentMatchesFilter = btn.getAttribute('data-filter');
      appContainer.innerHTML = MatchesComponent(state, state.currentMatchesFilter);
      bindMatchesPageEvents(); // Rebind events
    });
  });

  // Group selector filter listener
  const groupSelect = document.getElementById('group-filter-select');
  if (groupSelect) {
    groupSelect.addEventListener('change', (e) => {
      if (e.target.value !== undefined) {
        state.currentMatchesFilter = e.target.value;
        appContainer.innerHTML = MatchesComponent(state, state.currentMatchesFilter);
        bindMatchesPageEvents();
      }
    });
  }

  // Auto-Save prediction on input blur
  const scoreInputs = appContainer.querySelectorAll('.prediction-input');
  scoreInputs.forEach(input => {
    input.addEventListener('blur', () => {
      triggerAutoSave(input.getAttribute('data-match-id'));
    });
    
    // Scale highlight micro-interaction on input changes
    input.addEventListener('change', function() {
      this.classList.add('scale-110');
      setTimeout(() => this.classList.remove('scale-110'), 150);
    });

    // Make the save button active on input
    input.addEventListener('input', () => {
      const matchId = input.getAttribute('data-match-id');
      const saveBtn = document.getElementById(`save-btn-${matchId}`);
      if (saveBtn) {
        saveBtn.style.backgroundColor = 'var(--primary)';
        saveBtn.style.color = 'var(--on-primary)';
        saveBtn.textContent = 'Guardar';
      }
    });
  });

  // Save prediction on button click
  const saveBtns = appContainer.querySelectorAll('.btn-save-prediction');
  saveBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const matchId = btn.getAttribute('data-match-id');
      triggerSave(matchId);
    });
  });
}

// Save Prediction logic
async function triggerSave(matchId) {
  const inputs = document.querySelectorAll(`.prediction-input[data-match-id="${matchId}"]`);
  let homeVal, awayVal;

  inputs.forEach(input => {
    if (input.getAttribute('data-team') === 'home') homeVal = input.value;
    if (input.getAttribute('data-team') === 'away') awayVal = input.value;
  });

  if (homeVal === '' || awayVal === '') {
    showToast("Completa los marcadores oficiales", "error");
    return;
  }

  const homeScore = parseInt(homeVal);
  const awayScore = parseInt(awayVal);

  const saveBtn = document.getElementById(`save-btn-${matchId}`);
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.textContent = 'Guardando...';
  }

  try {
    await API.post(`/api/matches/${matchId}/predict`, {
      home_score: homeScore,
      away_score: awayScore
    });

    showToast("Predicción guardada");
    
    // Update local state
    const localMatch = state.matches.find(m => m.id == matchId);
    if (localMatch) {
      localMatch.predicted_home_score = homeScore;
      localMatch.predicted_away_score = awayScore;
    }

    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.style.backgroundColor = '#6f7a70'; // Muted color
      saveBtn.textContent = 'Guardado';
    }

    // Border highlights
    const row = document.getElementById(`match-row-${matchId}`);
    if (row) {
      row.classList.remove('border-border-light', 'bg-surface-gray');
      row.classList.add('border-primary/40', 'bg-primary/5');
    }
  } catch (err) {
    showToast(err.message, 'error');
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Predecir';
    }
  }
}

// Auto-Save prediction checks
function triggerAutoSave(matchId) {
  const inputs = document.querySelectorAll(`.prediction-input[data-match-id="${matchId}"]`);
  let homeVal = '', awayVal = '';

  inputs.forEach(input => {
    if (input.getAttribute('data-team') === 'home') homeVal = input.value;
    if (input.getAttribute('data-team') === 'away') awayVal = input.value;
  });

  if (homeVal !== '' && awayVal !== '') {
    const localMatch = state.matches.find(m => m.id == matchId);
    if (localMatch && 
        (localMatch.predicted_home_score !== parseInt(homeVal) || 
         localMatch.predicted_away_score !== parseInt(awayVal))) {
      triggerSave(matchId);
    }
  }
}

// BIND EVENTS FOR ADMIN PANEL
function bindAdminPageEvents() {
  const appContainer = document.getElementById('app');

  // Admin save official scores
  const saveScoreBtns = appContainer.querySelectorAll('.btn-admin-save-score');
  saveScoreBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const matchId = btn.getAttribute('data-match-id');
      const inputs = appContainer.querySelectorAll(`.score-input[data-match-id="${matchId}"]`);
      let homeVal = '', awayVal = '';

      inputs.forEach(input => {
        if (input.classList.contains('admin-home-score')) homeVal = input.value;
        if (input.classList.contains('admin-away-score')) awayVal = input.value;
      });

      if (homeVal === '' || awayVal === '') {
        showToast("Ingresa marcadores oficiales", "error");
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Calculando...';

      try {
        await API.post(`/api/admin/matches/${matchId}/score`, {
          home_score: parseInt(homeVal),
          away_score: parseInt(awayVal),
          status: 'finished'
        });

        showToast("Marcador oficial finalizado. Puntos actualizados.");
        
        // Refetch matches
        const data = await API.get('/api/matches');
        state.matches = data.matches;
        appContainer.innerHTML = AdminComponent(state);
        bindAdminPageEvents();
      } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = 'Finalizar';
      }
    });
  });

  // Admin fill random predictions for demo
  const fillRandomBtn = document.getElementById('btn-admin-fill-random');
  if (fillRandomBtn) {
    fillRandomBtn.addEventListener('click', async () => {
      fillRandomBtn.disabled = true;
      fillRandomBtn.textContent = 'Poblando base de datos...';

      try {
        const data = await API.post('/api/admin/system/fill-random');
        showToast(data.message);
        
        setTimeout(() => {
          window.location.hash = '#leaderboard';
        }, 1200);
      } catch (err) {
        showToast(err.message, 'error');
        fillRandomBtn.disabled = false;
        fillRandomBtn.textContent = 'Poblar Base de Datos (Demo)';
      }
    });
  }
}

// Global Logouts handlers
async function handleLogout() {
  try {
    await API.post('/api/auth/logout');
    state.user = null;
    showToast("Sesión cerrada");
    window.location.hash = '#login';
  } catch (err) {
    showToast("Error al cerrar sesión", "error");
  }
}

const logoutBtnHeader = document.getElementById('btn-logout-header');
if (logoutBtnHeader) logoutBtnHeader.addEventListener('click', handleLogout);

const logoutBtnSidebar = document.getElementById('btn-logout-sidebar');
if (logoutBtnSidebar) logoutBtnSidebar.addEventListener('click', handleLogout);

// Page Event Listeners
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
