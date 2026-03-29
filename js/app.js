/**
 * MK Katalog - Main SPA Router & Initialization
 * Stone catalog web application with vanilla JS navigation.
 */

// ---------------------------------------------------------------------------
// App State
// ---------------------------------------------------------------------------
const App = {
  currentScreen: 'home',
  data: {
    stones: [],
    projects: [],
    processing: []
  },
  initialized: false,
  /** Stored PWA install prompt event */
  deferredInstallPrompt: null,
  /** Timestamp when the page started loading */
  loadStart: Date.now()
};

// ---------------------------------------------------------------------------
// Data Loading
// ---------------------------------------------------------------------------

/**
 * Fetch a JSON file and return the parsed result.
 * Returns an empty array on failure so the app can still render.
 */
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: ${response.status}`);
  }
  return response.json();
}

/**
 * Load all required data files in parallel.
 * Populates App.data and returns true on success.
 */
async function loadAppData() {
  const [stones, projects, processing] = await Promise.all([
    fetchJSON('data/stones.json'),
    fetchJSON('data/projects.json'),
    fetchJSON('data/processing.json')
  ]);

  App.data.stones = stones;
  App.data.projects = projects;
  App.data.processing = processing;

  return true;
}

// ---------------------------------------------------------------------------
// Splash Screen
// ---------------------------------------------------------------------------

/**
 * Dismiss the splash screen with a fade-out, ensuring a minimum visible
 * duration of 1.5 seconds from page load so the user sees the branding.
 */
async function dismissSplash() {
  const splash = document.getElementById('splash-screen');
  const appContainer = document.getElementById('app');
  if (!splash) return;

  // Guarantee the splash is shown for at least 1.5 s total
  const elapsed = Date.now() - App.loadStart;
  const remaining = Math.max(0, 1500 - elapsed);
  if (remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, remaining));
  }

  // Fade out splash
  splash.style.transition = 'opacity 0.4s ease';
  splash.style.opacity = '0';

  await new Promise((resolve) => setTimeout(resolve, 400));
  splash.style.display = 'none';

  // Show main app
  if (appContainer) {
    appContainer.classList.add('visible');
  }
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

/**
 * Navigate to a named screen (home, catalog, portfolio, contact).
 * Updates the DOM, nav state, browser history, and triggers animations.
 */
function navigateTo(screenName, { pushState = true } = {}) {
  const screens = document.querySelectorAll('.screen');
  const target = document.getElementById(`${screenName}-screen`);

  if (!target) {
    console.warn(`Screen "${screenName}" not found.`);
    return;
  }

  // Hide all screens and show the target
  screens.forEach((s) => {
    s.classList.remove('active');
    s.style.display = 'none';
  });
  target.style.display = '';
  target.classList.add('active');

  // Update bottom nav active indicator
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item) => {
    if (item.dataset.screen === screenName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // Update internal state
  App.currentScreen = screenName;

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'instant' });

  // Push state for browser history support
  if (pushState) {
    history.pushState({ screen: screenName }, '', `#${screenName}`);
  }

  // Trigger entrance animations
  if (typeof Animations !== 'undefined' && Animations.enterScreen) {
    Animations.enterScreen(screenName);
  }

  // Notify modules that their screen is now visible
  if (screenName === 'catalog' && typeof Catalog !== 'undefined' && Catalog.onShow) {
    Catalog.onShow();
  }
  if (screenName === 'portfolio' && typeof Portfolio !== 'undefined' && Portfolio.onShow) {
    Portfolio.onShow();
  }
}

// Expose globally so inline onclick handlers in HTML can call it
window.navigateTo = navigateTo;

// ---------------------------------------------------------------------------
// History / Back Button
// ---------------------------------------------------------------------------

function setupHistory() {
  // Set initial state
  history.replaceState({ screen: App.currentScreen }, '', `#${App.currentScreen}`);

  window.addEventListener('popstate', (event) => {
    const screenName = (event.state && event.state.screen) || 'home';
    navigateTo(screenName, { pushState: false });
  });
}

// ---------------------------------------------------------------------------
// Bottom Nav & CTA Buttons
// ---------------------------------------------------------------------------

function setupNavigation() {
  // Bottom navigation bar items
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const screen = item.dataset.screen;
      if (screen) {
        navigateTo(screen);
      }
    });
  });

  // Home-screen CTA buttons (e.g. "View Catalog", "Our Work", "Contact Us")
  const ctaButtons = document.querySelectorAll('[data-navigate]');
  ctaButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const screen = btn.dataset.navigate;
      if (screen) {
        navigateTo(screen);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// PWA Install Prompt
// ---------------------------------------------------------------------------

function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Prevent the default mini-infobar
    event.preventDefault();
    App.deferredInstallPrompt = event;

    // Show the custom install button only on second (or later) visit
    const visitCount = parseInt(localStorage.getItem('mk_visit_count') || '0', 10) + 1;
    localStorage.setItem('mk_visit_count', String(visitCount));

    if (visitCount >= 2) {
      showInstallButton();
    }
  });
}

function showInstallButton() {
  const installBtn = document.getElementById('install-btn');
  if (!installBtn) return;

  installBtn.style.display = '';
  installBtn.addEventListener('click', async () => {
    if (!App.deferredInstallPrompt) return;

    App.deferredInstallPrompt.prompt();
    const { outcome } = await App.deferredInstallPrompt.userChoice;

    if (outcome === 'accepted') {
      installBtn.style.display = 'none';
    }
    App.deferredInstallPrompt = null;
  }, { once: true });
}

// ---------------------------------------------------------------------------
// Service Worker
// ---------------------------------------------------------------------------

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Service Worker registered with scope:', registration.scope);
      })
      .catch((error) => {
        console.warn('Service Worker registration failed:', error);
      });
  }
}

// ---------------------------------------------------------------------------
// Error UI
// ---------------------------------------------------------------------------

function showRetryMessage() {
  const splash = document.getElementById('splash-screen');
  if (!splash) return;

  // Inject a retry prompt into the splash screen
  const retryEl = document.createElement('div');
  retryEl.className = 'splash-retry';
  retryEl.innerHTML = `
    <p>Greška pri učitavanju podataka. Provjerite internet vezu.</p>
    <button onclick="location.reload()">Pokušaj ponovo</button>
  `;
  splash.appendChild(retryEl);
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Load all JSON data in parallel
    await loadAppData();

    // 2. Initialize feature modules (if available)
    if (typeof Catalog !== 'undefined' && Catalog.init) {
      Catalog.init(App.data.stones, App.data.processing);
    }
    if (typeof Portfolio !== 'undefined' && Portfolio.init) {
      Portfolio.init(App.data.projects);
    }
    if (typeof Animations !== 'undefined' && Animations.init) {
      Animations.init();
    }

    // 3. Set up navigation (bottom nav + CTA buttons)
    setupNavigation();

    // 4. Handle browser history (back/forward)
    setupHistory();

    // 5. Resolve initial screen from URL hash (if any)
    const initialScreen = location.hash.replace('#', '') || 'home';
    navigateTo(initialScreen, { pushState: false });

    // 6. Dismiss the splash screen (respecting minimum display time)
    await dismissSplash();

    // 7. PWA install prompt
    setupInstallPrompt();

    // 8. Register service worker
    registerServiceWorker();

    // 9. Wire up close buttons for overlays
    const threeCloseBtn = document.querySelector('#three-viewer .viewer-close');
    if (threeCloseBtn) {
      threeCloseBtn.addEventListener('click', () => {
        if (typeof ThreeViewer !== 'undefined') ThreeViewer.hide();
      });
    }
    // 10. Contact form → WhatsApp
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = (document.getElementById('contact-name').value || '').trim();
        const phone = (document.getElementById('contact-phone').value || '').trim();
        const message = (document.getElementById('contact-message').value || '').trim();
        let text = 'Poštovani';
        if (name) text += ', moje ime je ' + name + '.';
        if (phone) text += ' Moj telefon: ' + phone + '.';
        if (message) text += ' ' + message;
        window.open('https://wa.me/387603114305?text=' + encodeURIComponent(text), '_blank');
      });
    }

    // 11. Obrada screen filters
    const obradaTabs = document.querySelectorAll('#obrada-screen .category-tab');
    const obradaCards = document.querySelectorAll('#obrada-grid .obrada-card');
    obradaTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        obradaTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filter = tab.dataset.obradaFilter;
        obradaCards.forEach(card => {
          card.style.display = (filter === 'sve' || card.dataset.obradaCategory === filter) ? '' : 'none';
        });
      });
    });

    App.initialized = true;
  } catch (error) {
    console.error('App initialization failed:', error);
    showRetryMessage();
  }
});
