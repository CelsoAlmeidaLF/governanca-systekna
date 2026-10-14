/**
 * Impressão digital (UID) do cadastro no mesmo formato que o BarGestão mostra ao usuário:
 * grupos de 4 em maiúsculas (3F2A-9C01-...). Cadastros antigos (UUID) aparecem como estão.
 */
export function formatarUid(id) {
  const v = String(id || '');
  if (!/^[0-9a-f]{32}$/.test(v)) return v;
  return v.toUpperCase().match(/.{4}/g).join('-');
}
