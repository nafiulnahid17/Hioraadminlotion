// Lightweight, dependency-free Supabase REST + Auth adapter.
// Uses the anon/publishable key with user JWT; row-level security is enforced server-side.
const cfg = window.HIORA_CONFIG || {};
const base = String(cfg.SUPABASE_URL || '').trim().replace(/\/+$/, '');
const anon = String(cfg.SUPABASE_ANON_KEY || '').trim();
export const isConfigured = /^https:\/\/[a-z0-9.-]+$/i.test(base) && anon.length > 20;
const sessionKey = 'hiora_admin_session_v1';
let authSession = null;

const encode = (s) => encodeURIComponent(String(s));
const headers = (session, extra = {}) => ({
  apikey: anon,
  Authorization: `Bearer ${session?.access_token || anon}`,
  ...extra,
});
async function jsonResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || data?.msg || data?.error_description || data?.error || `Request failed (${res.status})`);
  return data;
}

export function getStoredSession() {
  try { return JSON.parse(sessionStorage.getItem(sessionKey) || 'null'); } catch { return null; }
}
export function clearSession() { authSession = null; sessionStorage.removeItem(sessionKey); }
export async function signIn(email, password) {
  if (!isConfigured) throw new Error('Supabase is not configured.');
  const res = await fetch(`${base}/auth/v1/token?grant_type=password`, {
    method: 'POST', headers: { apikey: anon, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await jsonResponse(res);
  data.expires_at = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
  authSession = data;
  sessionStorage.setItem(sessionKey, JSON.stringify(data));
  return data;
}
export async function signOut() {
  try {
    if (authSession?.access_token) await fetch(`${base}/auth/v1/logout`, { method: 'POST', headers: headers(authSession) });
  } finally { clearSession(); }
}
export async function readySession() {
  if (!isConfigured) return null;
  const s = authSession || getStoredSession();
  if (!s?.access_token) return null;
  if (s.expires_at && (s.expires_at * 1000) > (Date.now() + 60000)) { authSession = s; return s; }
  if (s.expires_in && !s.expires_at && s.created_at && (s.created_at * 1000 + s.expires_in * 1000) > (Date.now() + 60000)) { authSession = s; return s; }
  if (!s.refresh_token) { clearSession(); return null; }
  try {
    const res = await fetch(`${base}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: { apikey: anon, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token }),
    });
    const next = await jsonResponse(res);
    next.expires_at = Math.floor(Date.now() / 1000) + (next.expires_in || 3600);
    authSession = next;
    sessionStorage.setItem(sessionKey, JSON.stringify(next));
    return next;
  } catch { clearSession(); return null; }
}
async function rest(path, options = {}) {
  const session = await readySession();
  if (!session) throw new Error('Your session has expired. Please sign in again.');
  const url = `${base}/rest/v1/${path}`;
  const res = await fetch(url, { ...options, headers: headers(session, { 'Content-Type': 'application/json', ...options.headers }) });
  return jsonResponse(res);
}
export async function verifyAdmin() {
  const session = await readySession();
  if (!session?.user?.id) return null;
  const data = await rest(`hiora_admins?user_id=eq.${encode(session.user.id)}&select=user_id,name,role&limit=1`);
  return Array.isArray(data) ? data[0] || null : null;
}
export async function loadWorkspace() {
  const [customers, orders, interactions] = await Promise.all([
    rest('hiora_customers?select=*&order=created_at.desc&limit=2000'),
    rest('hiora_orders?select=*&order=created_at.desc&limit=3000'),
    rest('hiora_interactions?select=*&order=created_at.desc&limit=3000'),
  ]);
  return { customers, orders, interactions };
}
const uuidFilter = (id) => `eq.${encode(id)}`;
export async function createRow(table, data) {
  const result = await rest(`${table}?select=*`, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(data) });
  return result[0];
}
export async function updateRow(table, id, data) {
  const result = await rest(`${table}?id=${uuidFilter(id)}&select=*`, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(data) });
  if (!result?.length) throw new Error('Record not found or update not permitted.');
  return result[0];
}
