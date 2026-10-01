import axios from 'axios';

const api = axios.create({
  baseURL: 'http://127.0.0.1:5004/api',
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kravings_token');

    console.log('Token exists:', !!token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.log('API Error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.log('Unauthorized');
    }

    return Promise.reject(error);
  }
);

export default api;