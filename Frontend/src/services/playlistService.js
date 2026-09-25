import api from './api';

export const playlistService = {
  getAll: () => api.get('/playlists').then(r => r.data),
  getById: (id) => api.get(`/playlists/${id}`).then(r => r.data),
  create: (data) => api.post('/playlists', data).then(r => r.data),
  update: (id, data) => api.put(`/playlists/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/playlists/${id}`).then(r => r.data),
  addSong: (id, song) => api.post(`/playlists/${id}/songs`, song).then(r => r.data),
  removeSong: (id, songId) => api.delete(`/playlists/${id}/songs/${songId}`).then(r => r.data),
};
