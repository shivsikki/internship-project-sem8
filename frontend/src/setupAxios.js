import axios from 'axios';

let isConfigured = false;

export function setupAxios() {
  if (isConfigured) return;
  isConfigured = true;

  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        const headers = config.headers || {};
        if (!headers.Authorization && !headers.authorization) {
          config.headers = { ...headers, Authorization: `Bearer ${token}` };
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/signin') {
          window.location.assign('/signin');
        }
      }
      return Promise.reject(error);
    }
  );
}

