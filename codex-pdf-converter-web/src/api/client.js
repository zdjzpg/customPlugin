const API_BASE = '/api';
const AUTH_TOKEN_KEY = 'kids_english_auth_token';

export function getStoredAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function setStoredAuthToken(token) {
  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

async function request(path, options = {}) {
  const token = getStoredAuthToken();
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function fetchHealth() {
  return request('/health');
}

export function login(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function fetchMe() {
  return request('/auth/me');
}

export function logout() {
  return request('/auth/logout', {
    method: 'POST'
  });
}

export function fetchUsers() {
  return request('/users');
}

export function createUser(payload) {
  return request('/users', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function resetUserPassword(userId, password) {
  return request(`/users/${userId}/password`, {
    method: 'PATCH',
    body: JSON.stringify({ password })
  });
}

export function updateUserStatus(userId, status) {
  return request(`/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export function fetchPapers(params = {}) {
  const search = new URLSearchParams();
  if (params.keyword) search.set('keyword', params.keyword);
  if (params.questionType) search.set('questionType', params.questionType);
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  const suffix = search.toString() ? `?${search.toString()}` : '';
  return request(`/papers${suffix}`);
}

export function fetchPaperById(paperId) {
  return request(`/papers/${paperId}`);
}

export function fetchPublicPaperById(paperId) {
  return request(`/public/papers/${paperId}`);
}

export function fetchPublicPaperByShareCode(shareCode) {
  return request(`/public/papers/code/${shareCode}`);
}

export function fetchPublicSubmissionReport(shareCode, reportToken) {
  return request(`/public/papers/code/${shareCode}/reports/${reportToken}`);
}

export function createPaper(payload) {
  return request('/papers', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updatePaper(paperId, payload) {
  return request(`/papers/${paperId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export function removePaperById(paperId) {
  return request(`/papers/${paperId}`, {
    method: 'DELETE'
  });
}

export function copyPaperById(paperId) {
  return request(`/papers/${paperId}/copy`, {
    method: 'POST'
  });
}

export function createSubmission(paperId, payload) {
  return request(`/papers/${paperId}/submissions`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function uploadAnswerAudio(blob, { questionId = '', questionType = '' } = {}) {
  const token = getStoredAuthToken();
  const search = new URLSearchParams();
  if (questionId) search.set('questionId', questionId);
  if (questionType) search.set('questionType', questionType);
  const suffix = search.toString() ? `?${search.toString()}` : '';
  const response = await fetch(`${API_BASE}/uploads/answer-audio${suffix}`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'Content-Type': blob?.type || 'application/octet-stream'
    },
    body: blob
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || `Request failed: ${response.status}`);
  }

  return response.json();
}

export function drawSubmissionReward(submissionId) {
  return request(`/submissions/${submissionId}/reward-draw`, {
    method: 'POST'
  });
}

export function fetchPaperSubmissions(paperId, params = {}) {
  const search = new URLSearchParams();
  if (params.studentKeyword) search.set('studentKeyword', params.studentKeyword);
  const suffix = search.toString() ? `?${search.toString()}` : '';
  return request(`/papers/${paperId}/submissions${suffix}`);
}
