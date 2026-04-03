import axios from 'axios'

const API_BASE = 'http://localhost:5000'

function authHeader() {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function register(payload) {
  const resp = await axios.post(`${API_BASE}/register`, payload)
  return resp.data
}

export async function login(payload) {
  const resp = await axios.post(`${API_BASE}/login`, payload)
  return resp.data
}

export async function startSession(role) {
  const resp = await axios.post(`${API_BASE}/start`, { role }, { headers: authHeader() })
  return resp.data
}

export async function sendAnswer(role, question, answer) {
  const resp = await axios.post(`${API_BASE}/answer`, { role, question, answer }, { headers: authHeader() })
  return resp.data
}

export async function getResult() {
  const resp = await axios.get(`${API_BASE}/result`, { headers: authHeader() })
  return resp.data
}

export async function getProfileResults() {
  const resp = await axios.get(`${API_BASE}/profile-results`, { headers: authHeader() })
  return resp.data
}

export async function getChartData() {
  const resp = await axios.get(`${API_BASE}/chart-data`, { headers: authHeader() })
  return resp.data
}

export async function getResultById(id) {
  const resp = await axios.get(`${API_BASE}/result/${id}`, { headers: authHeader() })
  return resp.data
}

export async function finishSession() {
  const resp = await axios.post(`${API_BASE}/finish`, {}, { headers: authHeader() })
  return resp.data
}

export async function logInfraction(type) {
  const resp = await axios.post(`${API_BASE}/log-infraction`, { type }, { headers: authHeader() })
  return resp.data
}

export async function submitSkillTest(test_type, raw_data, infractions) {
  const resp = await axios.post(`${API_BASE}/submit-skill-test`, { test_type, raw_data, infractions }, { headers: authHeader() })
  return resp.data
}

export async function getSkillResults() {
  const resp = await axios.get(`${API_BASE}/skill-results`, { headers: authHeader() })
  return resp.data
}

export async function getSkillResult(id) {
  const resp = await axios.get(`${API_BASE}/skill-result/${id}`, { headers: authHeader() })
  return resp.data
}

export async function uploadProfilePhoto(formData) {
  const resp = await axios.post(`${API_BASE}/upload-profile-photo`, formData, {
    headers: {
      ...authHeader(),
      'Content-Type': 'multipart/form-data'
    }
  })
  return resp.data
}
