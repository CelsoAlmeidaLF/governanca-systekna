/**
 * UI Utility: seletor
 * Segmentado com indicador que desliza (Aero 3.0), igual ao do painel de feedback.
 * Os botões usam aria-selected (abas) ou aria-pressed (filtros); devolve a função que reposiciona o indicador.
 */
export function seletor(seg, aoMudar) {
  const btns = [...seg.querySelectorAll('button')];
  const ind = seg.querySelector('.ind');
  const attr = btns[0].hasAttribute('aria-selected') ? 'aria-selected' : 'aria-pressed';
  const mover = () => {
    const b = btns.find((x) => x.getAttribute(attr) === 'true') || btns[0];
    if (!ind || !b.offsetWidth) return;
    ind.style.width = b.offsetWidth + 'px';
    ind.style.transform = `translateX(${b.offsetLeft - 3}px)`;
  };
  const marcar = (alvo) => { btns.forEach((x) => x.setAttribute(attr, String(x === alvo))); mover(); };
  btns.forEach((b) => b.addEventListener('click', () => { marcar(b); aoMudar(b.dataset.v || b.dataset.tab); }));
  addEventListener('resize', mover);
  requestAnimationFrame(mover);
  return { mover, marcar: (v) => { const b = btns.find((x) => (x.dataset.v || x.dataset.tab) === v); if (b) marcar(b); } };
}
