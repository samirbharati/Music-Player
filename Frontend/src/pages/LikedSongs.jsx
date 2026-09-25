import { useEffect, useState } from 'react';
import { musicService } from '../services/musicService';
import { usePlayer } from '../context/PlayerContext';
import { SongRow } from '../components/SongCard';
import { HiHeart, HiPlay } from 'react-icons/hi';

export default function LikedSongs() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { playSong } = usePlayer();

  useEffect(() => { loadLiked(); }, []);

  const loadLiked = async () => {
    try {
      const data = await musicService.getLiked();
      setSongs(data);
    } catch (_) {} finally { setLoading(false); }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', marginBottom: 32 }}>
        <div style={{
          width: 160, height: 160, borderRadius: 'var(--radius-lg)', flexShrink: 0,
          background: 'linear-gradient(135deg, #7c3aed, #ef4444)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 32px rgba(124, 58, 237, 0.4)'
        }}>
          <HiHeart style={{ fontSize: 64, color: 'white' }} />
        </div>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Collection</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5, margin: '8px 0 4px' }}>
            Liked Songs
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{songs.length} songs</p>
          {songs.length > 0 && (
            <button
              className="btn btn-primary"
              style={{ marginTop: 16 }}
              onClick={() => playSong(songs[0], songs, 0)}
            >
              <HiPlay /> Play All
            </button>
          )}
        </div>
      </div>

      {songs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">❤️</div>
          <p className="empty-state-title">No liked songs yet</p>
          <p className="empty-state-text">Click the heart icon on any song to add it here</p>
        </div>
      ) : (
        songs.map((song, i) => (
          <SongRow key={song.id} song={song} index={i} queue={songs} onLikeChange={loadLiked} />
        ))
      )}
    </div>
  );
}
