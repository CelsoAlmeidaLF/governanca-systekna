/**
 * UI Utility: notificar
 * Aviso curto no topo (toast Aero 3.0, o mesmo do painel de feedback). Usado também para expor
 * ao operador falhas de leitura/escrita no Firestore em vez de silenciá-las.
 */
let timer = null;

export function notificar(mensagem, tipo = 'info', duracaoMs = 2600) {
  const toast = document.getElementById('toast');
  const texto = document.getElementById('toastT');
  if (!toast || !texto) { console.log(mensagem); return; }
  texto.textContent = mensagem;
  toast.classList.toggle('err', tipo === 'erro');
  toast.setAttribute('role', tipo === 'erro' ? 'alert' : 'status');
  toast.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => toast.classList.remove('show'), duracaoMs);
}

export function notificarErro(err) {
  console.error(err);
  notificar(err?.message || 'Operação não concluída.', 'erro', 7000);
}
