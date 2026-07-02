const BASE = "/api";

export function assetUrl(path) {
  if (!path) return "";
  return `${BASE}/${path}`;
}

export async function loginUser(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function registerUser(name, email, password, role, enterpriseCode = '') {
  const body = { name, email, password, role };
  if (enterpriseCode) body.enterprise_code = enterpriseCode;

  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function fetchProtected(token) {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function updateProfile(token, payload) {
  const res = await fetch(`${BASE}/auth/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updatePassword(token, payload) {
  const res = await fetch(`${BASE}/auth/password`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}


export async function fetchAllUsers(token) {
  const res = await fetch(`${BASE}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function approveUser(token, userId) {
  const res = await fetch(`${BASE}/admin/users/approve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId }),
  });
  return res.json();
}

export async function rejectUser(token, userId) {
  const res = await fetch(`${BASE}/admin/users/reject`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ user_id: userId }),
  });
  return res.json();
}

export async function fetchFullProfile(token) {
  const res = await fetch(`${BASE}/auth/profile/full`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function updateFullProfile(token, payload) {
  const res = await fetch(`${BASE}/auth/profile/full`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function uploadProfilePicture(token, file) {
  const formData = new FormData();
  formData.append("picture", file);
  const res = await fetch(`${BASE}/auth/profile/picture`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return res.json();
}

export async function fetchDesks(token) {
  const res = await fetch(`${BASE}/desks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function createDesk(token, payload) {
  const res = await fetch(`${BASE}/desks/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function updateDesk(token, payload) {
  const res = await fetch(`${BASE}/desks/update`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function adminCreateUser(token, payload) {
  const res = await fetch(`${BASE}/admin/users/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}
