/**
 * UI View: AuthView
 * Controla os elementos do DOM referentes ao login e autenticação com Firebase.
 */
export class AuthView {
  constructor({ onLogin, onLogout, onResetPassword }) {
    this._onLogin = onLogin;
    this._onLogout = onLogout;
    this._onResetPassword = onResetPassword;

    this._authWrapper = document.getElementById('auth-wrapper');
    this._appContainer = document.getElementById('app-container');
    this._loginForm = document.getElementById('login-form');
    this._emailInput = document.getElementById('login-email');
    this._passwordInput = document.getElementById('login-password');
    this._loginError = document.getElementById('login-error');
    this._loginBtn = document.getElementById('login-btn');
    this._demoLoginBtn = document.getElementById('demo-login-btn');
    this._resetPasswordBtn = document.getElementById('reset-password-btn');
    this._logoutBtn = document.getElementById('logout-btn');
    this._userEmailDisplay = document.getElementById('user-email-display');
    this._userRoleDisplay = document.getElementById('user-role-display');

    this._setupListeners();
  }

  _setupListeners() {
    if (this._loginForm) {
      this._loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        this._setLoading(true);
        this.clearError();
        try {
          await this._onLogin(this._emailInput.value, this._passwordInput.value);
        } catch (err) {
          this.showError(err.message);
        } finally {
          this._setLoading(false);
        }
      });
    }

    if (this._demoLoginBtn) {
      this._demoLoginBtn.addEventListener('click', async () => {
        this._setLoading(true);
        this.clearError();
        try {
          await this._onLogin('ceo@systekna.com', 'demo-systekna-gov-2026');
        } catch (err) {
          this.showError(err.message);
        } finally {
          this._setLoading(false);
        }
      });
    }

    if (this._resetPasswordBtn) {
      this._resetPasswordBtn.addEventListener('click', async () => {
        const email = this._emailInput.value.trim();
        if (!email) {
          this.showError('Preencha seu e-mail no campo acima para redefinir a senha.');
          return;
        }
        try {
          await this._onResetPassword(email);
          alert(`Link de redefinição de senha enviado para ${email}.`);
        } catch (err) {
          this.showError(err.message);
        }
      });
    }

    if (this._logoutBtn) {
      this._logoutBtn.addEventListener('click', () => {
        if (confirm('Deseja realmente encerrar a sessão de Governança?')) {
          this._onLogout();
        }
      });
    }
  }

  _setLoading(loading) {
    if (this._loginBtn) {
      this._loginBtn.disabled = loading;
      this._loginBtn.textContent = loading ? 'Autenticando...' : 'Acessar Governança Systekna';
    }
  }

  showError(msg) {
    if (this._loginError) {
      this._loginError.textContent = msg;
      this._loginError.style.display = 'block';
    }
  }

  clearError() {
    if (this._loginError) {
      this._loginError.textContent = '';
      this._loginError.style.display = 'none';
    }
  }

  renderUserState(user) {
    if (user) {
      if (this._authWrapper) this._authWrapper.style.display = 'none';
      if (this._appContainer) this._appContainer.style.display = 'grid';
      if (this._userEmailDisplay) this._userEmailDisplay.textContent = user.email || 'ceo@systekna.com';
      if (this._userRoleDisplay) this._userRoleDisplay.textContent = 'CEO & Engenheiro Chefe';
    } else {
      if (this._authWrapper) this._authWrapper.style.display = 'flex';
      if (this._appContainer) this._appContainer.style.display = 'none';
      this.clearError();
    }
  }
}
