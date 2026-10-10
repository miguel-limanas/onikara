// Cria um usuário jogador no Supabase local para testar o app.
// Uso: node scripts/create-dev-player.mjs <email> <senha>
// Usa apenas a chave anon/publishable (a mesma do navegador), nunca service_role.
import { readFileSync } from 'node:fs';

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error('Uso: node scripts/create-dev-player.mjs <email> <senha>');
  process.exit(1);
}

const config = readFileSync(new URL('../src/config/supabase.js', import.meta.url), 'utf8');
const anonKey = config.match(/'(sb_publishable_[^']+)'/)?.[1];
const baseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
if (!anonKey) {
  console.error('Chave anon não encontrada em src/config/supabase.js.');
  process.exit(1);
}

const response = await fetch(`${baseUrl}/auth/v1/signup`, {
  method: 'POST',
  headers: { apikey: anonKey, 'content-type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const body = await response.json();
if (!response.ok) {
  console.error('Falha ao criar usuário:', body.msg || body.error_description || JSON.stringify(body));
  process.exit(1);
}
console.log(`Jogador criado: ${body.user?.email || body.email} (papel: ${body.user?.app_metadata?.app_role || 'player'})`);
