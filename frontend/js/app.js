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

// Determine API Base URL dynamically
const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? (window.location.port === '3005' ? '' : 'http://localhost:3005')
  : 'https://quinielamundial2026-qrbj.onrender.com';

// API Service Module
const API = {
  async get(url) {
    try {
      const res = await fetch(`${API_BASE}${url}`, {
        credentials: 'include'
      });
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
      const res = await fetch(`${API_BASE}${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include'
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
      bindMatchesPageEvents();
    } 
    else if (hash === '#matches') {
      const data = await API.get('/api/matches');
      state.matches = data.matches;

      appContainer.innerHTML = MatchesComponent(state, state.currentMatchesFilter);
      bindMatchesPageEvents();

      // Trigger onboarding tutorial automatically for first-time entries
      if (!localStorage.getItem('quiniela_tour_completed')) {
        setTimeout(() => {
          startTutorialTour(false);
        }, 600);
      }
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
  // Google Login click event (Real Google OAuth redirect)
  const googleBtn = document.getElementById('btn-google-oauth');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      googleBtn.classList.add('opacity-80', 'pointer-events-none');
      googleBtn.innerHTML = `
        <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="font-label-lg text-label-lg">Redirigiendo a Google...</span>
      `;
      // Redirect to backend Google OAuth route
      window.location.href = `${API_BASE}/api/auth/google`;
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

  // Dev debug fill my predictions listener
  const devFillBtn = document.getElementById('btn-dev-fill-my-predictions');
  if (devFillBtn) {
    devFillBtn.addEventListener('click', async () => {
      devFillBtn.disabled = true;
      devFillBtn.innerHTML = `
        <svg class="animate-spin h-4 w-4 text-white mr-1 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Llenando...
      `;

      try {
        const data = await API.post('/api/dev/fill-my-predictions');
        showToast(data.message);
        
        // Refetch matches from backend to update state and re-render
        const matchesData = await API.get('/api/matches');
        state.matches = matchesData.matches;
        
        safeReRender();
      } catch (err) {
        showToast(err.message, 'error');
        devFillBtn.disabled = false;
        devFillBtn.innerHTML = `
          <span class="material-symbols-outlined text-[16px]">bug_report</span>
          Autollenar Grupos (Dev)
        `;
      }
    });
  }

  // Tutorial trigger button listener
  const startTutorialBtn = document.getElementById('btn-start-tutorial');
  if (startTutorialBtn) {
    startTutorialBtn.addEventListener('click', () => {
      startTutorialTour(true);
    });
  }
}

// Safe Re-render preserving focus and current typed values
function safeReRender() {
  const activeEl = document.activeElement;
  let activeMatchId = null;
  let activeTeam = null;
  let activeValue = null;

  if (activeEl && activeEl.classList.contains('prediction-input')) {
    activeMatchId = activeEl.getAttribute('data-match-id');
    activeTeam = activeEl.getAttribute('data-team');
    activeValue = activeEl.value;
  }

  const appContainer = document.getElementById('app');
  if (window.location.hash === '#matches') {
    appContainer.innerHTML = MatchesComponent(state, state.currentMatchesFilter);
    bindMatchesPageEvents();
  } else if (window.location.hash === '#dashboard') {
    appContainer.innerHTML = DashboardComponent(state);
    bindMatchesPageEvents();
  }

  if (activeMatchId && activeTeam) {
    const newActiveEl = document.querySelector(`.prediction-input[data-match-id="${activeMatchId}"][data-team="${activeTeam}"]`);
    if (newActiveEl) {
      newActiveEl.value = activeValue;
      newActiveEl.focus();
    }
  }
}

// Onboarding Interactive Tutorial Tour
let tutorialActiveTimeouts = [];

function startTutorialTour(isManual = false) {
  // If not manual, and already completed, skip
  if (!isManual && localStorage.getItem('quiniela_tour_completed') === 'true') {
    return;
  }

  // Clear any existing active timeouts
  tutorialActiveTimeouts.forEach(t => clearTimeout(t));
  tutorialActiveTimeouts = [];

  // Remove any existing tutorial elements to start clean
  const existingBackdrop = document.getElementById('tutorial-backdrop');
  const existingGuide = document.getElementById('tutorial-guide');
  const existingStyles = document.getElementById('tutorial-styles');
  if (existingBackdrop) existingBackdrop.remove();
  if (existingGuide) existingGuide.remove();
  if (existingStyles) existingStyles.remove();

  // Find the target card (first match card with class 'group' and starts with match-row-)
  const firstCard = document.querySelector('.group[id^="match-row-"]');
  if (!firstCard) {
    // If not matches list page or no cards visible, let's redirect to #matches or skip
    if (window.location.hash !== '#matches') {
      window.location.hash = '#matches';
      setTimeout(() => startTutorialTour(isManual), 600);
    }
    return;
  }

  // Check if inputs exist
  const inputs = firstCard.querySelectorAll('.prediction-input');
  if (inputs.length < 2) return;

  const homeInput = inputs[0];
  const awayInput = inputs[1];
  const originalHome = homeInput.value;
  const originalAway = awayInput.value;

  // Store step status
  let currentStep = 1;

  // 1. Inject styles dynamically
  const styleEl = document.createElement('style');
  styleEl.id = 'tutorial-styles';
  styleEl.textContent = `
    .tutorial-overlay-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: transparent;
      z-index: 9999;
      pointer-events: auto;
    }
    .tutorial-spotlight-active {
      position: relative !important;
      z-index: 10000 !important;
      background-color: white !important;
      box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65) !important;
      pointer-events: none;
    }
    .tutorial-guide-card {
      position: absolute;
      z-index: 10001;
      background-color: white;
      border: 1px solid #DBDBDB;
      border-radius: 12px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
      padding: 20px;
      width: 320px;
      transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
    }
    /* Typing indicator cursor simulation */
    .typing-simulated {
      border-right: 2px solid var(--primary);
      animation: blink-cursor 0.7s step-end infinite;
    }
    @keyframes blink-cursor {
      from, to { border-color: transparent }
      50% { border-color: var(--primary); }
    }
  `;
  document.head.appendChild(styleEl);

  // 2. Add full screen backdrop to block standard page interaction
  const backdrop = document.createElement('div');
  backdrop.id = 'tutorial-backdrop';
  backdrop.className = 'tutorial-overlay-backdrop';
  document.body.appendChild(backdrop);

  // Lock scrolling
  document.body.style.overflow = 'hidden';

  // 3. Highlight the first card
  firstCard.classList.add('tutorial-spotlight-active');

  // Scroll card to center
  firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // 4. Create and append guide card
  const guideCard = document.createElement('div');
  guideCard.id = 'tutorial-guide';
  guideCard.className = 'tutorial-guide-card font-body-md text-on-surface opacity-0 scale-95';
  guideCard.innerHTML = `
    <div class="flex items-center justify-between mb-sm">
      <div class="flex items-center gap-xs text-primary font-bold">
        <span class="material-symbols-outlined text-[20px]">sports_soccer</span>
        <span class="font-headline-sm text-xs uppercase tracking-wider">Tutorial <span id="tutorial-step-num">1</span>/3</span>
      </div>
      <button class="text-on-surface-variant hover:text-red-500 font-semibold text-xs transition-colors" id="btn-tutorial-skip">Saltar</button>
    </div>
    
    <h4 class="font-headline-sm text-base font-bold text-on-surface mb-xs" id="tutorial-step-title">1. Escribe tu Pronóstico</h4>
    <p class="text-sm text-on-surface-variant mb-md leading-relaxed" id="tutorial-step-text">
      Ingresa los goles estimados para cada equipo en los campos correspondientes.
    </p>
    
    <div class="flex items-center justify-between pt-sm border-t border-border-light">
      <div class="flex gap-xs">
        <span class="w-2.5 h-2.5 rounded-full bg-primary" id="tutorial-dot-1"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-border-light" id="tutorial-dot-2"></span>
        <span class="w-2.5 h-2.5 rounded-full bg-border-light" id="tutorial-dot-3"></span>
      </div>
      
      <button class="bg-primary text-on-primary font-label-md text-xs px-md py-sm rounded-lg hover:opacity-90 transition-all font-semibold active:scale-95 flex items-center gap-xs shadow-sm" id="btn-tutorial-next">
        <span>Siguiente</span>
        <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
      </button>
    </div>
  `;
  document.body.appendChild(guideCard);

  // Position guide card correctly
  function updatePosition() {
    const rect = firstCard.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let top = rect.bottom + window.scrollY + 16;
    let left = rect.left + window.scrollX;
    
    if (viewportWidth > 768) {
      if (rect.right + 340 < viewportWidth) {
        top = rect.top + window.scrollY;
        left = rect.right + 20;
      } else if (rect.left - 340 > 0) {
        top = rect.top + window.scrollY;
        left = rect.left - 340;
      }
    } else {
      left = (viewportWidth - 320) / 2;
      if (rect.bottom + 250 > viewportHeight) {
        top = Math.max(10, rect.top + window.scrollY - 220);
      }
    }
    
    guideCard.style.top = `${top}px`;
    guideCard.style.left = `${left}px`;
  }

  // Trigger position update after layout settles
  setTimeout(() => {
    updatePosition();
    guideCard.classList.remove('opacity-0', 'scale-95');
    guideCard.classList.add('opacity-100', 'scale-100');
  }, 400);

  // Resize and scroll listener
  window.addEventListener('resize', updatePosition);
  window.addEventListener('scroll', updatePosition);

  // Clean-up function to restore layout and values
  function endTutorial() {
    window.removeEventListener('resize', updatePosition);
    window.removeEventListener('scroll', updatePosition);
    document.body.style.overflow = '';
    
    firstCard.classList.remove('tutorial-spotlight-active');
    
    backdrop.remove();
    guideCard.remove();
    styleEl.remove();
    
    localStorage.setItem('quiniela_tour_completed', 'true');
    
    // Clear simulated values and safely re-render
    homeInput.value = originalHome;
    awayInput.value = originalAway;
    safeReRender();
  }

  // Skip button click
  document.getElementById('btn-tutorial-skip').addEventListener('click', endTutorial);

  // Typing animation timeouts
  let typingTimeout1, typingTimeout2;

  // Step state machine logic
  function runStep(step) {
    currentStep = step;
    
    // Reset inputs
    homeInput.value = originalHome;
    awayInput.value = originalAway;
    homeInput.classList.remove('typing-simulated');
    awayInput.classList.remove('typing-simulated');

    // Reset button states inside the card
    const saveBtn = document.getElementById(`save-btn-${firstCard.id.replace('match-row-', '')}`);
    const statusText = document.getElementById(`status-text-${firstCard.id.replace('match-row-', '')}`);
    if (saveBtn) {
      saveBtn.style.backgroundColor = '';
      saveBtn.style.color = '';
      saveBtn.textContent = 'Predecir';
    }
    if (statusText) {
      statusText.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-coral mr-1"></span> Pendiente`;
    }

    // Update dots indicator
    for (let i = 1; i <= 3; i++) {
      const dot = document.getElementById(`tutorial-dot-${i}`);
      if (dot) {
        if (i === step) {
          dot.className = 'w-2.5 h-2.5 rounded-full bg-primary';
        } else {
          dot.className = 'w-2.5 h-2.5 rounded-full bg-border-light';
        }
      }
    }

    const stepNum = document.getElementById('tutorial-step-num');
    const stepTitle = document.getElementById('tutorial-step-title');
    const stepText = document.getElementById('tutorial-step-text');
    const nextBtn = document.getElementById('btn-tutorial-next');

    if (step === 1) {
      stepNum.textContent = '1';
      stepTitle.textContent = '1. Escribe tu Pronóstico';
      stepText.innerHTML = `
        Ingresa los goles estimados para cada equipo en los campos correspondientes.<br><br>
        <span class="text-xs text-on-surface-variant italic font-semibold">Observa la simulación:</span>
      `;
      nextBtn.innerHTML = `<span>Siguiente</span><span class="material-symbols-outlined text-[14px]">arrow_forward</span>`;

      // Simulating typing home score
      typingTimeout1 = setTimeout(() => {
        homeInput.focus();
        homeInput.classList.add('typing-simulated');
        
        typingTimeout2 = setTimeout(() => {
          homeInput.value = '2';
          homeInput.classList.remove('typing-simulated');
          homeInput.classList.add('scale-110');
          setTimeout(() => homeInput.classList.remove('scale-110'), 150);
          
          // Simulate update state
          if (saveBtn) {
            saveBtn.style.backgroundColor = 'var(--primary)';
            saveBtn.style.color = 'var(--on-primary)';
            saveBtn.textContent = 'Guardar';
          }

          // Simulate typing away score
          typingTimeout1 = setTimeout(() => {
            awayInput.focus();
            awayInput.classList.add('typing-simulated');
            
            typingTimeout2 = setTimeout(() => {
              awayInput.value = '1';
              awayInput.classList.remove('typing-simulated');
              awayInput.classList.add('scale-110');
              setTimeout(() => awayInput.classList.remove('scale-110'), 150);
            }, 800);
          }, 800);

        }, 800);
      }, 1000);

      tutorialActiveTimeouts.push(typingTimeout1, typingTimeout2);

    } else if (step === 2) {
      stepNum.textContent = '2';
      stepTitle.textContent = '2. Guardado Automático';
      stepText.innerHTML = `
        ¡Olvídate de dar clic en guardar! Al quitar el cursor del campo o pasar al siguiente partido, tu predicción se guardará al instante.<br><br>
        El botón cambiará a <span class="bg-[#6f7a70] text-white px-1.5 py-0.5 rounded text-xs font-semibold">Guardado</span> y verás un aviso de confirmación.
      `;
      nextBtn.innerHTML = `<span>Siguiente</span><span class="material-symbols-outlined text-[14px]">arrow_forward</span>`;

      // Simulate the blur action
      homeInput.value = '2';
      awayInput.value = '1';
      
      typingTimeout1 = setTimeout(() => {
        // Blur inputs
        document.activeElement.blur();
        
        // Show simulated saved state on the button
        if (saveBtn) {
          saveBtn.style.backgroundColor = '#6f7a70';
          saveBtn.style.color = 'white';
          saveBtn.textContent = 'Guardado';
        }
        if (statusText) {
          statusText.innerHTML = `<span class="inline-block w-1.5 h-1.5 rounded-full bg-success-green mr-1"></span> Pronosticado`;
        }
        
        // Show a brief simulated toast
        showToast("Predicción guardada (Demostración)", "success");
      }, 500);

      tutorialActiveTimeouts.push(typingTimeout1);

    } else if (step === 3) {
      stepNum.textContent = '3';
      stepTitle.textContent = '3. Avanza en el Torneo';
      stepText.innerHTML = `
        Completa toda la fase de grupos. A medida que pronostiques los partidos, la siguiente fase de eliminatorias (Dieciseisavos, Octavos, etc.) se autogenerará con tus clasificados.<br><br>
        ¡Pronostica con cuidado para ganar más puntos!
      `;
      nextBtn.innerHTML = `<span>Entendido 🎉</span>`;
    }
  }

  // Next button click event
  document.getElementById('btn-tutorial-next').addEventListener('click', () => {
    // Clear timeouts before starting next step
    tutorialActiveTimeouts.forEach(t => clearTimeout(t));
    tutorialActiveTimeouts = [];

    if (currentStep < 3) {
      runStep(currentStep + 1);
    } else {
      endTutorial();
    }
  });

  // Run the first step
  runStep(1);
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

    // Re-render current page to update bracket propagation safely preserving focus/value
    safeReRender();
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
