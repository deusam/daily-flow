// Main App logic
window.app = {
  currentView: 'planner',
  activeDateString: window.utils.getLocalDateString(new Date()),

  openModal(id) {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById(id).classList.remove('hidden');
  },

  closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    // check if all modals are hidden
    const anyModalOpen = [...document.querySelectorAll('.modal')].some(m => !m.classList.contains('hidden'));
    if (!anyModalOpen) {
      document.getElementById('modal-overlay').classList.add('hidden');
    }
  },

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
    document.getElementById('modal-overlay').classList.add('hidden');
  },

  switchView(viewId) {
    this.currentView = viewId;
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById(`view-${viewId}`).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`.nav-btn[data-view="${viewId}"]`).classList.add('active');

    this.renderCurrentView();
  },

  changeDate(offsetDays) {
    const d = new Date(this.activeDateString + 'T12:00:00'); // set to noon to avoid timezone drifts
    d.setDate(d.getDate() + offsetDays);
    this.activeDateString = window.utils.getLocalDateString(d);
    this.renderCurrentView();
  },

  goToToday() {
    this.activeDateString = window.utils.getLocalDateString(new Date());
    this.renderCurrentView();
  },

  async renderCurrentView() {
    // Dexie requires DB to be ready, our state.js ensures defaults but let's just await the render safely.
    if (this.currentView === 'planner') {
      document.getElementById('current-date-display').innerText = window.utils.friendlyDate(this.activeDateString);
      await window.planner.render(this.activeDateString);
    } else if (this.currentView === 'library') {
      await window.library.render();
    }
  }
};

// Global Event Listeners
document.addEventListener('DOMContentLoaded', () => {

  // Theme Toggle
  const themeToggle = document.getElementById('theme-toggle');
  const sunIcon = document.querySelector('.sun-icon');
  const moonIcon = document.querySelector('.moon-icon');

  function applyTheme(isDark) {
    if (isDark) {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
      sunIcon.classList.add('hidden');
      moonIcon.classList.remove('hidden');
    }
  }

  // Load saved theme
  const savedTheme = localStorage.getItem('dailyFlowTheme');
  const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
  applyTheme(isDark);

  themeToggle.addEventListener('click', () => {
    const willBeDark = !document.body.classList.contains('dark-mode');
    applyTheme(willBeDark);
    localStorage.setItem('dailyFlowTheme', willBeDark ? 'dark' : 'light');
  });

  // Live Clock
  const liveClockEl = document.getElementById('live-clock');
  function updateClock() {
    const now = new Date();
    const h = window.utils.padTime(now.getHours());
    const m = window.utils.padTime(now.getMinutes());
    if (liveClockEl) liveClockEl.innerText = `${h}:${m}`;
  }
  setInterval(updateClock, 1000);
  updateClock();

  // Navigation
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      window.app.switchView(e.target.dataset.view);
    });
  });

  // Date controls
  document.getElementById('prev-day-btn').addEventListener('click', () => window.app.changeDate(-1));
  document.getElementById('next-day-btn').addEventListener('click', () => window.app.changeDate(1));
  document.getElementById('today-btn').addEventListener('click', () => window.app.goToToday());

  // Modal close buttons
  document.querySelectorAll('.close-modal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault(); // prevent form submit if it's a button inside form
      window.app.closeAllModals();
    });
  });

  // Color Pickers Setup
  document.querySelectorAll('.color-picker').forEach(picker => {
    picker.addEventListener('click', e => {
      const option = e.target.closest('.color-option');
      if (option) {
        // remove selected from siblings
        picker.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        // update hidden input
        const hiddenInput = picker.nextElementSibling;
        if (hiddenInput && hiddenInput.tagName === 'INPUT') {
          hiddenInput.value = option.dataset.color;
        }
      }
    });
  });

  // Listen for state changes to re-render
  window.addEventListener('stateChanged', () => {
    window.app.renderCurrentView();
  });

  // Listen for auth state changes
  window.addEventListener('authStateChanged', () => {
    window.app.renderCurrentView();
  });

  // Initialize Auth Check (this will trigger rendering if logged in, or show overlay)
  window.auth.checkSession().then(loggedIn => {
    if (loggedIn) {
      window.app.renderCurrentView();
    }
  });
});
