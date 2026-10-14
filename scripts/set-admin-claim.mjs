#!/usr/bin/env node
/**
 * Concede (ou revoga) a custom claim `admin` a uma conta do Firebase Auth.
 * Só contas com essa claim entram no Painel de Governança e passam pelas regras do Firestore.
 *
 * Uso (máquina da engenharia, nunca no navegador):
 *   npm install --no-save firebase-admin
 *   export GOOGLE_APPLICATION_CREDENTIALS=/caminho/seguro/service-account.json
 *   node scripts/set-admin-claim.mjs ceo@systekna.com          # concede
 *   node scripts/set-admin-claim.mjs ceo@systekna.com --revogar
 *
 * O arquivo de service account é um segredo: não versionar, não colocar em src/.
 */
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const [email, flag] = process.argv.slice(2);
if (!email || !email.includes('@')) {
  console.error('Informe o e-mail da conta: node scripts/set-admin-claim.mjs <email> [--revogar]');
  process.exit(1);
}

const revogar = flag === '--revogar';
initializeApp({ credential: applicationDefault(), projectId: 'systekna-feedback' });

const auth = getAuth();
const user = await auth.getUserByEmail(email);
const claims = { ...(user.customClaims || {}) };
if (revogar) delete claims.admin;
else claims.admin = true;

await auth.setCustomUserClaims(user.uid, claims);
// Revoga tokens atuais para que a mudança valha imediatamente
await auth.revokeRefreshTokens(user.uid);

console.log(`${revogar ? 'Claim admin revogada de' : 'Claim admin concedida a'} ${email} (uid ${user.uid}).`);
