import api from './api';

export const musicService = {
  search: (q, language = 'all', page = 1) =>
    api.get('/music/search', { params: { q, language, page, limit: 20 } }).then(r => r.data),

  getTrending: (language = 'hindi') =>
    api.get('/music/trending', { params: { language } }).then(r => r.data),

  getSong: (id) =>
    api.get(`/music/song/${id}`).then(r => r.data),

  toggleLike: (song) =>
    api.post('/music/like', song).then(r => r.data),

  getLiked: () =>
    api.get('/music/liked').then(r => r.data),

  addRecentlyPlayed: (song) =>
    api.post('/music/recently-played', song).then(r => r.data),

  getRecentlyPlayed: () =>
    api.get('/music/recently-played').then(r => r.data),
};
