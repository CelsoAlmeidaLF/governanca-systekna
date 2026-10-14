/**
 * UI Utility: dialogo
 * Confirmação e pedido de motivo em <dialog> Aero, no lugar de confirm()/prompt() do navegador
 * (que travam a página e fogem do design system).
 */
const $ = (id) => document.getElementById(id);
let pendente = null;

function abrir({ titulo, texto, ok = 'Confirmar', perigo = false, campo = null }) {
  const d = $('dlgConfirmar');
  if (pendente) pendente(null);
  $('dlgConfirmarT').textContent = titulo;
  $('dlgConfirmarTexto').textContent = texto;
  $('dlgConfirmarOk').textContent = ok;
  $('dlgConfirmarAcoes').classList.toggle('perigo', perigo);
  $('dlgConfirmarCampo').hidden = !campo;
  if (campo) { $('dlgConfirmarRotulo').textContent = campo.rotulo; $('dlgConfirmarValor').value = campo.valor || ''; }
  return new Promise((resolve) => {
    pendente = (v) => { pendente = null; resolve(v); };
    d.showModal();
    (campo ? $('dlgConfirmarValor') : $('dlgConfirmarOk')).focus();
  });
}

export function iniciarDialogos() {
  const d = $('dlgConfirmar');
  $('formConfirmar').addEventListener('submit', (e) => {
    e.preventDefault();
    const campo = !$('dlgConfirmarCampo').hidden;
    const valor = campo ? $('dlgConfirmarValor').value.trim() : true;
    if (campo && !valor) { $('dlgConfirmarValor').focus(); return; }
    d.close();
    if (pendente) pendente(valor);
  });
  d.addEventListener('close', () => { if (pendente) pendente(null); });
  // Botões "Cancelar" de todas as janelas
  document.querySelectorAll('dialog [data-fechar]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));
}

/** Resolve true se confirmado, false se cancelado. */
export async function confirmar(texto, { titulo = 'Confirmar', ok = 'Confirmar', perigo = false } = {}) {
  return (await abrir({ titulo, texto, ok, perigo })) === true;
}

/** Resolve o texto digitado, ou null se cancelado. */
export function pedirTexto(texto, { titulo = 'Informar', rotulo = 'Motivo', valor = '', ok = 'Confirmar', perigo = false } = {}) {
  return abrir({ titulo, texto, ok, perigo, campo: { rotulo, valor } });
}
