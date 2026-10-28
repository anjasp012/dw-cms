const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

function getJwt() {
  return localStorage.getItem('dw_jwt') || localStorage.getItem('dw_token');
}

function getRefreshToken() {
  return localStorage.getItem('dw_refresh');
}

export function saveTokens(jwt, refreshToken, username) {
  if (jwt) {
    localStorage.setItem('dw_jwt', jwt);
    localStorage.setItem('dw_token', jwt); // backward compatibility
  }
  if (refreshToken) localStorage.setItem('dw_refresh', refreshToken);
  if (username) localStorage.setItem('dw_username', username);
}

export function clearTokens() {
  localStorage.removeItem('dw_jwt');
  localStorage.removeItem('dw_token');
  localStorage.removeItem('dw_refresh');
  localStorage.removeItem('dw_username');
}

function authHeaders() {
  const jwt = getJwt();
  return {
    'Content-Type': 'application/json',
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
  };
}

async function request(url, options = {}) {
  let res = await fetch(url, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  // Auto refresh token if 401 Unauthorized
  if (res.status === 401 && getRefreshToken()) {
    try {
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: getRefreshToken() }),
      });
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newJwt = refreshData.data?.jwt;
        const newRefresh = refreshData.data?.refresh_token;
        saveTokens(newJwt, newRefresh);

        // Retry original request with new token
        res = await fetch(url, {
          ...options,
          headers: {
            ...authHeaders(),
            ...(options.headers || {}),
          },
        });
      } else {
        clearTokens();
      }
    } catch (e) {
      clearTokens();
    }
  }

  if (res.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  if (!res.ok) {
    let errorDetail = 'Permintaan gagal';
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail?.responseMessage || errJson.detail || errJson.responseMessage || 'Terjadi kesalahan pada server';
    } catch (_) { }
    throw new Error(errorDetail);
  }

  return res.json();
}

export async function checkApiHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
    const res = await fetch(`${backendUrl}/`, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res.ok;
  } catch (err) {
    return false;
  }
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    let msg = 'Username atau password salah';
    try {
      const err = await res.json();
      msg = err.detail?.responseMessage || err.detail || msg;
    } catch (_) { }
    throw new Error(msg);
  }
  const data = await res.json();
  const jwt = data.data?.jwt || data.access_token;
  const refreshToken = data.data?.refresh_token || null;
  saveTokens(jwt, refreshToken, username);

  return {
    ...data,
    access_token: jwt,
  };
}

export async function fetchSettings() {
  return request(`${API_BASE}/admin/settings`);
}

export async function saveSettings(frontend_display_limit) {
  return request(`${API_BASE}/admin/settings`, {
    method: 'POST',
    body: JSON.stringify({ frontend_display_limit: parseInt(frontend_display_limit) }),
  });
}

export async function fetchAnalytics() {
  return request(`${API_BASE}/admin/analytics`);
}

export async function fetchWishes({ status, search = '', page = null, pageSize = 20, limit = 20, offset = 0, paginated = false } = {}) {
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (search && search.trim()) params.append('search', search.trim());
  if (page !== null && page !== undefined) {
    params.append('page', String(page));
    params.append('pageSize', String(pageSize));
    params.append('paginated', 'true');
  } else {
    params.append('limit', String(limit));
    params.append('offset', String(offset));
    if (paginated) params.append('paginated', 'true');
  }
  return request(`${API_BASE}/admin/wishes?${params.toString()}`);
}

export async function updateWishStatus(wishId, newStatus) {
  return request(
    `${API_BASE}/admin/wishes/${wishId}/status?status=${newStatus}`,
    { method: 'PATCH' }
  );
}

export async function deleteWish(wishId) {
  return request(`${API_BASE}/admin/wishes/${wishId}`, {
    method: 'DELETE',
  });
}

export async function bulkUpdateWishStatus(ids, status) {
  return request(`${API_BASE}/admin/wishes/bulk-status`, {
    method: 'POST',
    body: JSON.stringify({ ids, status }),
  });
}

export async function bulkDeleteWishes(ids) {
  return request(`${API_BASE}/admin/wishes/bulk-delete`, {
    method: 'POST',
    body: JSON.stringify({ ids }),
  });
}

export function formatDate(isoString) {
  const d = new Date(isoString);
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  const mon = months[d.getMonth()];
  const year = d.getFullYear();
  const hour = d.getHours().toString().padStart(2, '0');
  const min = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${mon} ${year}, ${hour}:${min}`;
}
