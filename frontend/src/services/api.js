import axios from 'axios';

// In production Docker/Nginx, API calls use same-origin relative URLs (/users, /stations, etc.)
// which are reverse-proxied by Nginx directly to http://api-gateway:8080.
// This completely eliminates CORS issues and cross-port restrictions.
const GATEWAY_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : (import.meta.env.DEV ? 'http://localhost:8080' : '');


const apiCall = async (method, path, data = null) => {
  const url = `${GATEWAY_URL}${path}`;
  const headers = {};

  try {
    const saved = localStorage.getItem('ev_user');
    if (saved) {
      const user = JSON.parse(saved);
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }
    }
  } catch (e) {
    // Ignore error reading localStorage
  }

  const response = await axios({
    method,
    url,
    data,
    headers,
    timeout: 10000
  });
  return response.data;
};

export const userService = {
  login: (credentials) => apiCall('post', '/users/login', credentials),
  register: (userData) => apiCall('post', '/users/register', userData),
  getProfile: (id) => apiCall('get', `/users/${id}`),
  getUserVehicles: (userId) => apiCall('get', `/users/${userId}/vehicles`),
  addVehicle: (userId, vehicle) => apiCall('post', `/users/${userId}/vehicles`, vehicle),
  getUserCount: () => apiCall('get', '/users/count')
};

export const stationService = {
  getAllStations: () => apiCall('get', '/stations'),
  getStationById: (id) => apiCall('get', `/stations/${id}`),
  getAvailability: (id) => apiCall('get', `/stations/${id}/availability`),
  createStation: (station) => apiCall('post', '/stations', station),
  updateStation: (id, station) => apiCall('put', `/stations/${id}`, station),
  deleteStation: (id) => apiCall('delete', `/stations/${id}`)
};

export const gridService = {
  getOverallStatus: () => apiCall('get', '/grid/status'),
  getAllZones: () => apiCall('get', '/grid/zones'),
  getZoneLoad: (id) => apiCall('get', `/grid/zones/${id}/load`),
  updateZoneLoad: (id, currentLoadKw) => apiCall('put', `/grid/zones/${id}/load`, { currentLoadKw }),
  addZoneLoad: (id, kw = 50.0) => apiCall('post', `/grid/zones/${id}/add-load`, { kw }),
  removeZoneLoad: (id, kw = 50.0) => apiCall('post', `/grid/zones/${id}/remove-load`, { kw })
};

export const chargingService = {
  startSession: (data) => apiCall('post', '/sessions/start', data),
  stopSession: (data) => apiCall('post', '/sessions/stop', data),
  getUserSessions: (userId) => apiCall('get', `/sessions/user/${userId}`),
  getActiveUserSession: (userId) => apiCall('get', `/sessions/user/${userId}/active`),
  getAllActiveSessions: () => apiCall('get', '/sessions/active'),
  getAllSessions: () => apiCall('get', '/sessions'),
  getChargingStats: () => apiCall('get', '/sessions/stats')
};

export const loadBalancerService = {
  selectStation: (request) => apiCall('post', '/load-balancer/select-station', request),
  allocateStation: (data) => apiCall('post', '/load-balancer/allocate', data),
  getRecommendations: (userId = 1, energyKwh = 25.0) =>
    apiCall('get', `/load-balancer/recommendations?userId=${userId}&energyKwh=${energyKwh}`)
};

export const notificationService = {
  sendNotification: (notif) => apiCall('post', '/notifications/send', notif),
  getUserNotifications: (userId) => apiCall('get', `/notifications/user/${userId}`),
  getAllNotifications: () => apiCall('get', '/notifications/all'),
  markAsRead: (id) => apiCall('put', `/notifications/${id}/read`)
};
