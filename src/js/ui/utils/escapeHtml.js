/**
 * UI Utility: escapeHtml
 * Escapa texto para interpolação segura em innerHTML, inclusive dentro de atributos.
 * Todo dado vindo do Firestore (telemetria, feedbacks e cadastros são gravados por apps públicos)
 * deve passar por aqui antes de ir para o DOM.
 */
const MAPA = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' };

export function escapeHtml(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor).replace(/[&<>"'`]/g, (c) => MAPA[c]);
}
