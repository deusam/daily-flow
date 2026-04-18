// Initialize Supabase Client
const SUPABASE_URL = 'https://lsmfubnljqmjcioxapef.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uSzSpSUIPOKwAiH8SRFGfg_WIM2pVCP';

window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

window.auth = {
  user: null,

  async checkSession() {
    const { data, error } = await window.supabaseClient.auth.getSession();
    if (error) {
      console.error('Error checking session:', error);
      return false;
    }
    
    if (data.session) {
      this.user = data.session.user;
      this.hideLoginOverlay();
      return true;
    } else {
      this.showLoginOverlay();
      return false;
    }
  },

  async signIn(email, password) {
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert('Login failed: ' + error.message);
      throw error;
    }

    this.user = data.user;
    this.hideLoginOverlay();
    
    // Notify app to render now that we have a user
    window.dispatchEvent(new CustomEvent('authStateChanged'));
    return true;
  },

  async resetPassword(email) {
    const { data, error } = await window.supabaseClient.auth.resetPasswordForEmail(email);
    if (error) {
      alert('Reset password failed: ' + error.message);
      throw error;
    }
    alert('Password reset email sent! Check your inbox.');
  },

  async logout() {
    const { error } = await window.supabaseClient.auth.signOut();
    if (error) {
      console.error('Logout error:', error);
    }
    this.user = null;
    this.showLoginOverlay();
    
    // Clear the current app view data
    document.getElementById('day-slots-list').innerHTML = '';
    document.getElementById('library-grid').innerHTML = '';
  },

  showLoginOverlay() {
    document.getElementById('login-overlay').classList.remove('hidden-overlay');
  },

  hideLoginOverlay() {
    document.getElementById('login-overlay').classList.add('hidden-overlay');
  }
};

// Bind UI events
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const forgotPasswordBtn = document.getElementById('forgot-password-btn');
  const logoutBtn = document.getElementById('logout-btn');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerText;
      submitBtn.innerText = 'Logging in...';
      submitBtn.disabled = true;

      try {
        await window.auth.signIn(email, password);
      } catch (err) {
        // Error already alerted in signIn
      } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      if (!email) {
        alert('Please enter your email address first.');
        return;
      }
      await window.auth.resetPassword(email);
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await window.auth.logout();
    });
  }
});
