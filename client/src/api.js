import toast from 'react-hot-toast';

const API_BASE = '/api';

let accessToken = localStorage.getItem('accessToken') || '';
let refreshToken = localStorage.getItem('refreshToken') || '';

function reportEvent(event, data) {
  if (window.analytics) window.analytics.track(event, data);
}

async function request(path, options = {}, retry = false) {
  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers, signal: options.signal });
  if (res.status === 401 && !retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return request(path, options, true);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.reload();
    throw new Error('认证失败，请重新登录');
  }
  if (!res.ok) {
    let errBody;
    try { errBody = await res.json(); } catch {
      const text = await res.text().catch(() => '');
      throw new Error(`服务器错误 (${res.status})${text ? ': ' + text.slice(0, 200) : ''}`);
    }
    const detail = errBody.detail ? ` [${errBody.detail}]` : '';
    throw new Error(`${errBody.message || '请求失败'} (${res.status})${detail}`);
  }
  const contentType = res.headers.get('content-type');
  if (contentType && (contentType.includes('text/csv') || contentType.includes('application/json'))) {
    return contentType.includes('text/csv') ? res.blob() : res.json();
  }
  return res.json();
}

async function refreshAccessToken() {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (res.ok) {
      const data = await res.json();
      accessToken = data.accessToken;
      localStorage.setItem('accessToken', accessToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export const apiRequest = request;

export const login = async (email, password) => {
  const data = await request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
  accessToken = data.accessToken;
  refreshToken = data.refreshToken;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  return data.user;
};

export const register = async (email, password) => {
  const data = await request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) });
  accessToken = data.accessToken;
  refreshToken = data.refreshToken;
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  return data.user;
};

export const fetchDiaryMonth = (year, month) => request(`/diary?year=${year}&month=${month}`);

export const fetchRecentEntries = (limit = 100) => request(`/diary/recent?limit=${limit}`).then(d => d.entries);

export const createDiaryEntry = (entry) => {
  reportEvent('diary_created', { valence: entry.valence });
  return request('/diary', { method: 'POST', body: JSON.stringify(entry) });
};

export const updateDiaryEntry = (id, entry) => request(`/diary/${id}`, { method: 'PUT', body: JSON.stringify(entry) });

export const deleteDiaryEntry = (id) => request(`/diary/${id}`, { method: 'DELETE' });


export const fetchEmotionWeather = (type) => request('/emotion-weather', { method: 'POST', body: JSON.stringify({ type }) });

// Admin API
export const fetchAdminStats = () => request('/admin/stats');
export const fetchAdminUsers = () => request('/admin/users');
export const fetchAdminUserEntries = (userId) => request(`/admin/users/${userId}/entries`);
export const deleteAdminUser = (userId) => request(`/admin/users/${userId}`, { method: 'DELETE' });
export const deleteAdminEntry = (entryId) => request(`/admin/entries/${entryId}`, { method: 'DELETE' });

export const exportDiaryCSV = async (year, month) => {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 10000);
  try {
    const blob = await request(`/diary/export?year=${year}&month=${month}`, { signal: controller.signal });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diary_${year}_${String(month).padStart(2, '0')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('导出成功');
  } catch (err) {
    if (err.name === 'AbortError') toast.error('导出超时，请缩小范围');
    else toast.error('导出失败');
  }
};

export const exportAllJSON = async () => {
  const res = await fetch('/api/backup/export-all', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error('导出失败');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'emotion_backup.json';
  a.click();
  URL.revokeObjectURL(url);
};

export const importFromJSON = async (file) => {
  const text = await file.text();
  const data = JSON.parse(text);
  return request('/backup/import', { method: 'POST', body: JSON.stringify(data) });
};
