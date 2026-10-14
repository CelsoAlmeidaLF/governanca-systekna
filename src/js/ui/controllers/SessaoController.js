/**
 * UI Controller: SessaoController
 * Cofre, login e acesso — mesmo fluxo do painel de feedback:
 * 1. Nada aparece antes do PIN FINANC ou da biometria (kit stk-pkg-security, window.vaultReady).
 * 2. Com e-mail e senha guardados no cofre (secureStorage, AES-GCM), o painel entra sozinho no Firebase.
 *    A sessão do Firebase fica só na memória: fechar ou bloquear derruba o login.
 * 3. O painel só abre depois que o Firestore confirma que a conta governa (regra gestor()).
 *    Login sem acesso sai da conta e mostra e-mail e UID na tela de entrar.
 * 4. Menu ⋮ → Configurações ganha a seção "Conta do painel".
 */
import { CHAVE_CONTA, gravarCredenciais, lerCredenciais, iniciais, saudacao } from '../../domain/ContaCofre.js';
import { notificar } from '../utils/notificar.js';

const $ = (id) => document.getElementById(id);

export class SessaoController {
  constructor({ authService, dataAdapter, authView, appController }) {
    this._auth = authService;
    this._dados = dataAdapter;
    this._view = authView;
    this._app = appController;
    this._saiu = false;        // saiu de propósito: não entra sozinho de novo até pedir
    this._tentouCofre = false; // tenta a conta guardada uma vez por desbloqueio
    this._versao = 0;          // descarta conferências antigas se o login mudar no meio
  }

  get _cofre() { return window.secureStorage; }

  // ═════ Entrar ═════
  async entrar(email, senha, guardar) {
    this._saiu = false;
    await this._auth.login(email, senha);
    if (guardar) {
      this._cofre.setItem(CHAVE_CONTA, gravarCredenciais(email, senha));
      notificar('E-mail e senha guardados no cofre');
    }
  }

  async esqueci(email) {
    await this._auth.solicitarRecuperacaoSenha(email);
  }

  async sair() {
    this._saiu = true;
    await this._auth.logout();
  }

  async _entrarSozinho() {
    const conta = lerCredenciais(this._cofre.getItem(CHAVE_CONTA));
    if (conta) this._view.preencher(conta.email);
    if (!conta || this._saiu || this._tentouCofre) { this._view.focar(conta ? 'senha' : 'email'); return; }
    this._tentouCofre = true;
    this._view.carregando(true, 'Entrando com a conta guardada…');
    try {
      await this._auth.login(conta.email, conta.senha);
      this._view.mensagem('');
    } catch (err) {
      this._view.mensagem(err.code === 'auth/invalid-credential'
        ? 'A senha guardada não funciona mais. Digite a senha atual para entrar e guardar de novo.'
        : err.message, 'err');
      this._view.focar('senha');
    } finally {
      this._view.carregando(false);
    }
  }

  // ═════ Mudança de login ═════
  async aoMudarLogin(user) {
    const versao = ++this._versao;
    // A cada mudança o painel some; só liberar() mostra de novo.
    this._view.mostrarEntrar();
    this._app.limpar();
    this._status(user);
    if (!user) { this._entrarSozinho(); return; }
    this._view.carregando(true, 'Conferindo o acesso de gestor…');
    try {
      await this._dados.conferirAcesso();
      if (versao === this._versao) this._liberar(user);
    } catch (err) {
      if (versao === this._versao) await this._negado(user, err);
    }
  }

  _liberar(user) {
    this._view.carregando(false);
    this._view.mensagem('');
    this._view.mostrarPainel();
    $('avatar').textContent = iniciais(user.email);
    $('avatar').title = user.email;
    $('ola').textContent = saudacao();
    this._app.abrir();
  }

  // Login feito, mas o Firestore não reconhece a conta como gestora: sai da conta e explica.
  async _negado(user, err) {
    const semAcesso = err && err.code === 'permission-denied';
    const texto = semAcesso
      ? `A conta ${user.email} (UID ${user.uid}) entrou, mas o Firestore não a reconhece como gestora. `
        + 'Se esta é a sua conta, publique as regras atuais (função gestor()) ou dê a ela a claim admin. Se não for, entre com a conta certa.'
      : 'Não foi possível conferir o acesso. Verifique a conexão e tente de novo.';
    this._saiu = true;
    await this._auth.logout();
    this._view.carregando(false);
    this._view.mensagem(texto, 'err');
  }

  _status(user) {
    $('statusLogin').classList.toggle('on', !!user);
    $('statusTexto').textContent = user ? 'Conectado como ' + user.email : 'Desconectado';
  }

  // ═════ Configurações → Conta do painel ═════
  secoesConfiguracoes() {
    window.FinancSettings.addSection({ title: 'Conta do painel', rows: [
      { icon: 'user', label: 'Entrar de novo com e-mail e senha', description: 'Faz o login de novo e guarda no cofre para entrar só com o PIN.', onClick: () => this._abrirConta() },
      { icon: 'key', label: 'Trocar a senha da conta', description: 'Muda a senha de login do painel no Firebase.', onClick: () => this._abrirSenha() },
      { icon: 'trash', label: 'Esquecer e-mail e senha', description: 'Apaga só deste aparelho. A conta continua igual.', danger: true, onClick: () => this._esquecer() },
      { icon: 'arrow-left', label: 'Sair da conta', description: 'Volta para a tela de entrar até o próximo desbloqueio.', onClick: () => this.sair() }
    ] });

    $('formConta').addEventListener('submit', (e) => { e.preventDefault(); this._salvarConta(); });
    $('formSenha').addEventListener('submit', (e) => { e.preventDefault(); this._salvarSenha(); });
  }

  _msg(id, texto, tipo = '') {
    $(id).textContent = texto;
    $(id).className = 'msg' + (tipo ? ' ' + tipo : '');
  }

  _abrirDialogo(d) {
    d.querySelector('form').reset();
    d.querySelectorAll('.msg').forEach((m) => { m.textContent = ''; m.className = 'msg'; });
    d.showModal();
  }

  _abrirConta() {
    this._abrirDialogo($('dlgConta'));
    const conta = lerCredenciais(this._cofre.getItem(CHAVE_CONTA));
    const u = this._auth.getCurrentUser();
    $('contaEmail').value = conta ? conta.email : (u ? u.email : '');
    this._msg('msgConta', (u ? 'Conectado agora como ' + u.email + '. ' : 'Desconectado agora. ')
      + (conta ? 'Guardado no cofre: ' + conta.email + '.' : 'Nada guardado no cofre ainda.'));
    (conta ? $('contaSenha') : $('contaEmail')).focus();
  }

  async _salvarConta() {
    const email = $('contaEmail').value.trim(), senha = $('contaSenha').value;
    let texto;
    try { texto = gravarCredenciais(email, senha); } catch (err) { this._msg('msgConta', err.message, 'err'); return; }
    const b = $('btnSalvarConta');
    b.disabled = true; this._msg('msgConta', 'Testando o login…');
    try {
      this._saiu = false;
      await this._auth.login(email, senha); // só guarda o que funciona
      this._cofre.setItem(CHAVE_CONTA, texto);
      $('dlgConta').close();
      notificar('Conectado e guardado no cofre');
    } catch (err) {
      this._msg('msgConta', err.message, 'err');
    } finally {
      b.disabled = false; $('contaSenha').value = '';
    }
  }

  _abrirSenha() {
    if (!this._auth.getCurrentUser()) { notificar('Entre na conta primeiro'); return; }
    this._abrirDialogo($('dlgSenha'));
    const conta = lerCredenciais(this._cofre.getItem(CHAVE_CONTA));
    $('senhaAtualCampo').hidden = !!conta; // com a senha no cofre, não precisa digitar a atual
    (conta ? $('senhaNova') : $('senhaAtual')).focus();
  }

  async _salvarSenha() {
    const conta = lerCredenciais(this._cofre.getItem(CHAVE_CONTA));
    const atual = conta ? conta.senha : $('senhaAtual').value;
    const nova = $('senhaNova').value;
    const b = $('btnSalvarSenha');
    b.disabled = true; this._msg('msgSenha', 'Trocando…');
    try {
      await this._auth.trocarSenha(atual, nova, $('senhaNova2').value);
      if (conta) this._cofre.setItem(CHAVE_CONTA, gravarCredenciais(conta.email, nova));
      $('dlgSenha').close();
      notificar(conta ? 'Senha trocada e atualizada no cofre' : 'Senha trocada');
    } catch (err) {
      this._msg('msgSenha', err.code === 'auth/invalid-credential' && conta
        ? 'A senha guardada no cofre não confere. Atualize em "Entrar de novo com e-mail e senha".'
        : err.message, 'err');
    } finally {
      b.disabled = false;
      ['senhaAtual', 'senhaNova', 'senhaNova2'].forEach((id) => { $(id).value = ''; });
    }
  }

  _esquecer() {
    if (!this._cofre.getItem(CHAVE_CONTA)) { notificar('Nada guardado neste aparelho'); return; }
    this._cofre.removeItem(CHAVE_CONTA);
    notificar('E-mail e senha apagados deste aparelho');
  }
}
