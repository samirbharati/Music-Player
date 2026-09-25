import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { playlistService } from '../services/playlistService';
import { usePlayer } from '../context/PlayerContext';
import { SongRow } from '../components/SongCard';
import { HiPlay, HiArrowLeft, HiTrash, HiMusicNote } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playSong } = usePlayer();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadPlaylist(); }, [id]);

  const loadPlaylist = async () => {
    try {
      const data = await playlistService.getById(id);
      setPlaylist(data);
    } catch (_) { toast.error('Playlist not found'); navigate('/library'); }
    finally { setLoading(false); }
  };

  const handleRemove = async (songId) => {
    try {
      const updated = await playlistService.removeSong(id, songId);
      setPlaylist(updated);
      toast.success('Song removed');
    } catch (_) { toast.error('Failed to remove song'); }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;
  if (!playlist) return null;

  const songs = playlist.songs || [];

  return (
    <div className="fade-in">
      <button className="btn btn-ghost" style={{ marginBottom: 20, gap: 6 }} onClick={() => navigate(-1)}>
        <HiArrowLeft /> Back
      </button>

      {/* Playlist Header */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', marginBottom: 32 }}>
        <div style={{
          width: 180, height: 180, borderRadius: 'var(--radius-lg)', flexShrink: 0,
          background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
        }}>
          {playlist.coverImage
            ? <img src={playlist.coverImage} alt={playlist.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <HiMusicNote style={{ fontSize: 64, color: 'white', opacity: 0.8 }} />
          }
        </div>
        <div>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Playlist</p>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: -0.5, margin: '8px 0 4px' }}>
            {playlist.name}
          </h1>
          {playlist.description && (
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>{playlist.description}</p>
          )}
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

      {/* Songs */}
      {songs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎵</div>
          <p className="empty-state-title">No songs yet</p>
          <p className="empty-state-text">Search for songs and add them to this playlist</p>
        </div>
      ) : (
        <div>
          {songs.map((song, i) => (
            <div key={song.id} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <SongRow song={song} index={i} queue={songs} showIndex />
              </div>
              <button
                className="btn-icon"
                onClick={() => handleRemove(song.id)}
                title="Remove from playlist"
                style={{ color: 'var(--text-muted)', fontSize: 16, flexShrink: 0 }}
              >
                <HiTrash />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
