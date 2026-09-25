import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { musicService } from '../services/musicService';
import { playlistService } from '../services/playlistService';
import { usePlayer } from '../context/PlayerContext';
import { SongCard } from '../components/SongCard';

export default function Home() {
  const { user } = useAuth();
  const { playSong } = usePlayer();
  const [trendingHindi, setTrendingHindi] = useState([]);
  const [trendingEnglish, setTrendingEnglish] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [hindi, english, recent, pls] = await Promise.allSettled([
        musicService.getTrending('hindi'),
        musicService.getTrending('english'),
        musicService.getRecentlyPlayed(),
        playlistService.getAll(),
      ]);
      setTrendingHindi(hindi.value || []);
      setTrendingEnglish(english.value || []);
      setRecentlyPlayed(recent.value || []);
      setPlaylists(pls.value || []);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="loading-container"><div className="spinner" /></div>
  );

  return (
    <div className="fade-in">
      {/* Hero */}
      <div className="hero-section">
        <p className="hero-greeting">🌟 {greeting}</p>
        <h1 className="hero-title">{user?.username} 👋</h1>
        <p className="hero-subtitle">What do you want to listen to today?</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => trendingHindi.length && playSong(trendingHindi[0], trendingHindi, 0)}
          >
            ▶ Play Hindi Hits
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => trendingEnglish.length && playSong(trendingEnglish[0], trendingEnglish, 0)}
          >
            ▶ Play English Hits
          </button>
        </div>
      </div>

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <div className="section-header">
            <div>
              <h2 className="section-title">Recently Played</h2>
              <p className="section-subtitle">Pick up where you left off</p>
            </div>
          </div>
          <div className="songs-grid">
            {recentlyPlayed.slice(0, 6).map((song, i) => (
              <SongCard key={song.id} song={song} queue={recentlyPlayed} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Trending Hindi */}
      <section style={{ marginBottom: 36 }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">🇮🇳 Trending in Hindi</h2>
            <p className="section-subtitle">Top Bollywood & Punjabi hits</p>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => trendingHindi.length && playSong(trendingHindi[0], trendingHindi, 0)}
            style={{ fontSize: 13 }}
          >
            Play All
          </button>
        </div>
        <div className="songs-grid">
          {trendingHindi.slice(0, 8).map((song, i) => (
            <SongCard key={song.id} song={song} queue={trendingHindi} index={i} />
          ))}
        </div>
      </section>

      {/* Trending English */}
      <section style={{ marginBottom: 36 }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">🌍 Trending in English</h2>
            <p className="section-subtitle">Best international hits</p>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => trendingEnglish.length && playSong(trendingEnglish[0], trendingEnglish, 0)}
            style={{ fontSize: 13 }}
          >
            Play All
          </button>
        </div>
        <div className="songs-grid">
          {trendingEnglish.slice(0, 8).map((song, i) => (
            <SongCard key={song.id} song={song} queue={trendingEnglish} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
