import api from './api';

export const authService = {
  login: (data) => api.post('/auth/login', data).then(r => r.data),
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  sendOtp: (email) => api.post('/auth/send-otp', { email }).then(r => r.data),
};
