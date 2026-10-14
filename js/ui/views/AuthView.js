import { Icons } from '../icons/Icons.js';

/**
 * UI View: AuthView
 * Controla os elementos do DOM referentes ao login e cadastro de novo usuário no Firebase Auth.
 * REGRA ABSOLUTA: Proibido o uso de emojis como ícones e obrigatório botão de visualizar/ocultar senha.
 */
export class AuthView {
  constructor({ onLogin, onRegister, onLogout, onResetPassword }) {
    this._onLogin = onLogin;
    this._onRegister = onRegister;
    this._onLogout = onLogout;
    this._onResetPassword = onResetPassword;

    this._authWrapper = document.getElementById('auth-wrapper');
    this._appContainer = document.getElementById('app-container');

    // Abas de alternância
    this._tabLoginBtn = document.getElementById('tab-auth-login');
    this._tabRegisterBtn = document.getElementById('tab-auth-register');

    // Formulário
    this._loginForm = document.getElementById('login-form');
    this._nameGroup = document.getElementById('form-group-name');
    this._nameInput = document.getElementById('register-name');
    this._emailInput = document.getElementById('login-email');
    this._passwordInput = document.getElementById('login-password');
    this._toggleLoginPassBtn = document.getElementById('toggle-login-password-btn');

    this._confirmPasswordGroup = document.getElementById('form-group-confirm-password');
    this._confirmPasswordInput = document.getElementById('register-confirm-password');
    this._toggleConfirmPassBtn = document.getElementById('toggle-confirm-password-btn');

    this._loginError = document.getElementById('login-error');
    this._loginBtn = document.getElementById('login-btn');
    this._demoLoginBtn = document.getElementById('demo-login-btn');
    this._resetPasswordBtn = document.getElementById('reset-password-btn');
    this._logoutBtn = document.getElementById('logout-btn');
    this._userEmailDisplay = document.getElementById('user-email-display');
    this._userRoleDisplay = document.getElementById('user-role-display');

    this._isRegisterMode = false;

    this._setupListeners();
  }

  _setupListeners() {
    // Alternar entre modo Entrar e Cadastrar
    if (this._tabLoginBtn && this._tabRegisterBtn) {
      this._tabLoginBtn.addEventListener('click', () => this.setMode(false));
      this._tabRegisterBtn.addEventListener('click', () => this.setMode(true));
    }

    // Configuração obrigatória de Visualizar / Ocultar Senha
    const configurarToggleSenha = (btn, input) => {
      if (!btn || !input) return;
      btn.innerHTML = Icons.svg('eye', { size: 16 });
      btn.addEventListener('click', () => {
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        btn.innerHTML = isPassword ? Icons.svg('eyeOff', { size: 16 }) : Icons.svg('eye', { size: 16 });
        btn.setAttribute('aria-label', isPassword ? 'Ocultar senha' : 'Visualizar senha');
      });
    };

    configurarToggleSenha(this._toggleLoginPassBtn, this._passwordInput);
    configurarToggleSenha(this._toggleConfirmPassBtn, this._confirmPasswordInput);

    if (this._loginForm) {
      this._loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        this._setLoading(true);
        this.clearError();

        const email = this._emailInput.value.trim();
        const password = this._passwordInput.value;

        try {
          if (this._isRegisterMode) {
            const name = this._nameInput?.value.trim() || 'Gestor Systekna';
            const confirmPass = this._confirmPasswordInput?.value;

            if (password !== confirmPass) {
              throw new Error('As senhas digitadas não coincidem.');
            }
            if (password.length < 6) {
              throw new Error('A senha deve conter no mínimo 6 caracteres.');
            }

            if (this._onRegister) {
              await this._onRegister(email, password, name);
            }
          } else {
            await this._onLogin(email, password);
          }
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

  setMode(isRegister) {
    this._isRegisterMode = Boolean(isRegister);
    this.clearError();

    if (this._tabLoginBtn && this._tabRegisterBtn) {
      if (this._isRegisterMode) {
        this._tabRegisterBtn.classList.add('active');
        this._tabLoginBtn.classList.remove('active');
      } else {
        this._tabLoginBtn.classList.add('active');
        this._tabRegisterBtn.classList.remove('active');
      }
    }

    if (this._nameGroup) {
      this._nameGroup.style.display = this._isRegisterMode ? 'flex' : 'none';
      if (this._nameInput) this._nameInput.required = this._isRegisterMode;
    }

    if (this._confirmPasswordGroup) {
      this._confirmPasswordGroup.style.display = this._isRegisterMode ? 'flex' : 'none';
      if (this._confirmPasswordInput) this._confirmPasswordInput.required = this._isRegisterMode;
    }

    if (this._loginBtn) {
      this._loginBtn.textContent = this._isRegisterMode ? 'Cadastrar Novo Usuário no Firebase' : 'Acessar Governança Systekna';
    }

    if (this._resetPasswordBtn) {
      this._resetPasswordBtn.style.display = this._isRegisterMode ? 'none' : 'inline-block';
    }
  }

  _setLoading(loading) {
    if (this._loginBtn) {
      this._loginBtn.disabled = loading;
      if (loading) {
        this._loginBtn.textContent = this._isRegisterMode ? 'Criando conta no Firebase...' : 'Autenticando...';
      } else {
        this._loginBtn.textContent = this._isRegisterMode ? 'Cadastrar Novo Usuário no Firebase' : 'Acessar Governança Systekna';
      }
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
      if (this._userRoleDisplay) this._userRoleDisplay.textContent = user.displayName || 'CEO & Engenheiro Chefe';
    } else {
      if (this._authWrapper) this._authWrapper.style.display = 'flex';
      if (this._appContainer) this._appContainer.style.display = 'none';
      this.clearError();
    }
  }
}
