import { useEffect, useState } from 'react';
import { musicService } from '../services/musicService';
import { SongRow } from '../components/SongCard';
import { HiClock } from 'react-icons/hi';

export default function RecentlyPlayed() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    musicService.getRecentlyPlayed()
      .then(setSongs)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', marginBottom: 32 }}>
        <div style={{
          width: 160, height: 160, borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, #06b6d4, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(6, 182, 212, 0.3)', flexShrink: 0
        }}>
          <HiClock style={{ fontSize: 64, color: 'white' }} />
        </div>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5, marginBottom: 4 }}>
            Recently Played
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{songs.length} songs</p>
        </div>
      </div>

      {songs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🕐</div>
          <p className="empty-state-title">No history yet</p>
          <p className="empty-state-text">Start listening to track your history</p>
        </div>
      ) : (
        songs.map((song, i) => (
          <SongRow key={`${song.id}-${i}`} song={song} index={i} queue={songs} />
        ))
      )}
    </div>
  );
}
