import axios from 'axios';

// API Gateway base URL
const GATEWAY_URL = 'http://localhost:8080';

// Service direct URLs for fallback
const SERVICE_URLS = {
  user: 'http://localhost:8081',
  station: 'http://localhost:8082',
  charging: 'http://localhost:8083',
  grid: 'http://localhost:8084',
  loadBalancer: 'http://localhost:8085',
  notification: 'http://localhost:8086'
};

const apiCall = async (method, path, data = null, serviceName = null) => {
  const url = `${GATEWAY_URL}${path}`;
  try {
    const response = await axios({
      method,
      url,
      data,
      timeout: 3000
    });
    return response.data;
  } catch (err) {
    // Fallback to direct service port if Gateway is down/starting up
    if (serviceName && SERVICE_URLS[serviceName]) {
      try {
        const fallbackUrl = `${SERVICE_URLS[serviceName]}${path}`;
        const fallbackRes = await axios({
          method,
          url: fallbackUrl,
          data,
          timeout: 3000
        });
        return fallbackRes.data;
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    }
    throw err;
  }
};

export const userService = {
  login: (credentials) => apiCall('post', '/users/login', credentials, 'user'),
  register: (userData) => apiCall('post', '/users/register', userData, 'user'),
  getProfile: (id) => apiCall('get', `/users/${id}`, null, 'user'),
  getUserVehicles: (userId) => apiCall('get', `/users/${userId}/vehicles`, null, 'user'),
  addVehicle: (userId, vehicle) => apiCall('post', `/users/${userId}/vehicles`, vehicle, 'user'),
  getUserCount: () => apiCall('get', '/users/count', null, 'user')
};

export const stationService = {
  getAllStations: () => apiCall('get', '/stations', null, 'station'),
  getStationById: (id) => apiCall('get', `/stations/${id}`, null, 'station'),
  getAvailability: (id) => apiCall('get', `/stations/${id}/availability`, null, 'station'),
  createStation: (station) => apiCall('post', '/stations', station, 'station'),
  updateStation: (id, station) => apiCall('put', `/stations/${id}`, station, 'station'),
  deleteStation: (id) => apiCall('delete', `/stations/${id}`, null, 'station')
};

export const gridService = {
  getOverallStatus: () => apiCall('get', '/grid/status', null, 'grid'),
  getAllZones: () => apiCall('get', '/grid/zones', null, 'grid'),
  getZoneLoad: (id) => apiCall('get', `/grid/zones/${id}/load`, null, 'grid'),
  updateZoneLoad: (id, currentLoadKw) => apiCall('put', `/grid/zones/${id}/load`, { currentLoadKw }, 'grid'),
  addZoneLoad: (id, kw = 50.0) => apiCall('post', `/grid/zones/${id}/add-load`, { kw }, 'grid'),
  removeZoneLoad: (id, kw = 50.0) => apiCall('post', `/grid/zones/${id}/remove-load`, { kw }, 'grid')
};

export const chargingService = {
  startSession: (data) => apiCall('post', '/sessions/start', data, 'charging'),
  stopSession: (data) => apiCall('post', '/sessions/stop', data, 'charging'),
  getUserSessions: (userId) => apiCall('get', `/sessions/user/${userId}`, null, 'charging'),
  getActiveUserSession: (userId) => apiCall('get', `/sessions/user/${userId}/active`, null, 'charging'),
  getAllActiveSessions: () => apiCall('get', '/sessions/active', null, 'charging'),
  getAllSessions: () => apiCall('get', '/sessions', null, 'charging'),
  getChargingStats: () => apiCall('get', '/sessions/stats', null, 'charging')
};

export const loadBalancerService = {
  selectStation: (request) => apiCall('post', '/load-balancer/select-station', request, 'loadBalancer'),
  allocateStation: (data) => apiCall('post', '/load-balancer/allocate', data, 'loadBalancer'),
  getRecommendations: (userId = 1, energyKwh = 25.0) => 
    apiCall('get', `/load-balancer/recommendations?userId=${userId}&energyKwh=${energyKwh}`, null, 'loadBalancer')
};

export const notificationService = {
  sendNotification: (notif) => apiCall('post', '/notifications/send', notif, 'notification'),
  getUserNotifications: (userId) => apiCall('get', `/notifications/user/${userId}`, null, 'notification'),
  getAllNotifications: () => apiCall('get', '/notifications/all', null, 'notification'),
  markAsRead: (id) => apiCall('put', `/notifications/${id}/read`, null, 'notification')
};
