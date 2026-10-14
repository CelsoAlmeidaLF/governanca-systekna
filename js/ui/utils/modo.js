/**
 * UI Utility: modo
 * Claro → escuro → luz ambiente (segue a hora: amanhecer, dia, entardecer, noite), como no painel de feedback.
 * A escolha fica salva neste navegador (governanca-modo). Só preferência visual: nada sensível.
 */
import { notificar } from './notificar.js';

const CHAVE = 'governanca-modo';
const root = document.documentElement;
let pref = 'ambient';
try { pref = localStorage.getItem(CHAVE) || 'ambient'; } catch (_) {}

export function ceu(data = new Date()) {
  const h = data.getHours();
  return h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 19 ? 'dusk' : 'night';
}

function aplicar() {
  let mode = pref, sky = '';
  if (pref === 'ambient') { const k = ceu(); mode = k === 'night' ? 'dark' : 'light'; sky = k === 'dawn' || k === 'dusk' ? k : ''; }
  root.dataset.mode = mode;
  if (sky) root.dataset.sky = sky; else delete root.dataset.sky;
  const meta = document.getElementById('metaTheme');
  if (meta) meta.content = mode === 'dark' ? '#0B1B33' : sky === 'dawn' ? '#F6DCCB' : sky === 'dusk' ? '#EBD3E6' : '#DCEBFA';
  const icone = window.FinancIcons.svg(pref === 'light' ? 'sun' : pref === 'dark' ? 'moon' : 'clock', { size: 20, stroke: 1.9 });
  document.querySelectorAll('#btnModo, #btnModoEntrar').forEach((b) => { b.innerHTML = icone; });
}

function trocar() {
  pref = pref === 'light' ? 'dark' : pref === 'dark' ? 'ambient' : 'light';
  try { localStorage.setItem(CHAVE, pref); } catch (_) {}
  aplicar();
  notificar({ light: 'Modo claro', dark: 'Modo escuro', ambient: 'Luz ambiente' }[pref]);
}

export function iniciarModo() {
  aplicar();
  setInterval(() => { if (pref === 'ambient') aplicar(); }, 60000);
  document.querySelectorAll('#btnModo, #btnModoEntrar').forEach((b) => b.addEventListener('click', trocar));
}
