/**
 * UI View: AuthView
 * Tela "Entrar" (e-mail e senha da conta do painel), igual à do painel de feedback.
 * Não há cadastro: contas são criadas no console do Firebase. O botão de mostrar/ocultar senha vem do kit
 * de segurança (vale para todo campo de senha). Mensagens só por textContent.
 */
const $ = (id) => document.getElementById(id);

export class AuthView {
  constructor({ onEntrar, onEsqueci }) {
    this._tela = $('telaEntrar');
    this._painel = $('telaPainel');
    this._form = $('formEntrar');
    this._email = $('email');
    this._senha = $('senha');
    this._guardar = $('guardar');
    this._btn = $('btnEntrar');
    this._msg = $('msgEntrar');

    this._form.addEventListener('submit', async (e) => {
      e.preventDefault();
      this.carregando(true, 'Entrando…');
      try {
        await onEntrar(this._email.value.trim(), this._senha.value, this._guardar.checked);
        this._senha.value = '';
        this.mensagem('');
      } catch (err) {
        this.mensagem(err.message, 'err');
      } finally {
        this.carregando(false);
      }
    });

    $('btnEsqueci').addEventListener('click', async () => {
      try {
        await onEsqueci(this._email.value.trim());
        this.mensagem('Se o e-mail tiver conta, o link para criar uma nova senha chega em alguns minutos (veja também o spam).', 'ok');
      } catch (err) {
        this.mensagem(err.message, 'err');
        this._email.focus();
      }
    });
  }

  mensagem(texto, tipo = '') {
    this._msg.textContent = texto;
    this._msg.className = 'msg' + (tipo ? ' ' + tipo : '');
  }

  carregando(sim, texto) {
    this._btn.disabled = sim;
    if (sim && texto) this.mensagem(texto);
  }

  preencher(email) {
    if (email) this._email.value = email;
  }

  focar(campo) {
    (campo === 'senha' ? this._senha : this._email).focus();
  }

  mostrarEntrar() {
    this._painel.hidden = true;
    this._tela.hidden = false;
  }

  mostrarPainel() {
    this._tela.hidden = true;
    this._painel.hidden = false;
  }
}
