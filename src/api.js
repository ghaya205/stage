// Project is at C:\xampp\htdocs\dxc\project
// So Apache serves PHP at http://localhost/dxc/project/src/dxcphp/
const BASE = 'http://localhost/dxc/project/src/dxcphp';

export async function loginUser(email, password) {
  const res = await fetch(`${BASE}/login.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function registerUser(name, email, password, role) {
  const res = await fetch(`${BASE}/register.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, role }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function fetchProtected(token) {
  const res = await fetch(`${BASE}/protected.php`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}