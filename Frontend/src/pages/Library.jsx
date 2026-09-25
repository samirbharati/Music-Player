import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { playlistService } from '../services/playlistService';
import { HiMusicNote, HiPlus, HiTrash, HiPlay } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { usePlayer } from '../context/PlayerContext';

export default function Library() {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const { playSong } = usePlayer();
  const navigate = useNavigate();

  useEffect(() => { loadPlaylists(); }, []);

  const loadPlaylists = async () => {
    try {
      const data = await playlistService.getAll();
      setPlaylists(data);
    } catch (_) {} finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await playlistService.create({ name: newName.trim() });
      toast.success('Playlist created!');
      setNewName(''); setShowCreate(false);
      loadPlaylists();
    } catch (_) { toast.error('Failed to create playlist'); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this playlist?')) return;
    try {
      await playlistService.delete(id);
      toast.success('Playlist deleted');
      loadPlaylists();
    } catch (_) { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="section-title">Your Library</h1>
          <p className="section-subtitle">{playlists.length} playlists</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(v => !v)}>
          <HiPlus /> New Playlist
        </button>
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} style={{ marginBottom: 24, maxWidth: 400, background: 'var(--bg-card)', padding: 20, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>Create Playlist</p>
          <input
            className="form-input"
            placeholder="Playlist name..."
            value={newName}
            onChange={e => setNewName(e.target.value)}
            style={{ marginBottom: 12 }}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary">Create</button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </form>
      )}

      {playlists.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-title">No playlists yet</p>
          <p className="empty-state-text">Create your first playlist to organize your music</p>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={() => setShowCreate(true)}>
            <HiPlus /> Create Playlist
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {playlists.map(pl => (
            <div key={pl.id} className="playlist-card" onClick={() => navigate(`/playlist/${pl.id}`)}>
              <div className="playlist-card-img">
                {pl.coverImage
                  ? <img src={pl.coverImage} alt={pl.name} />
                  : <HiMusicNote style={{ color: 'white', fontSize: 22 }} />
                }
              </div>
              <div className="playlist-card-info">
                <p className="playlist-card-name">{pl.name}</p>
                <p className="playlist-card-count">{pl.songCount} songs</p>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {pl.songs?.length > 0 && (
                  <button
                    className="btn-icon"
                    onClick={e => { e.stopPropagation(); playSong(pl.songs[0], pl.songs, 0); }}
                    title="Play playlist"
                    style={{ fontSize: 18, color: 'var(--accent-primary)' }}
                  >
                    <HiPlay />
                  </button>
                )}
                <button
                  className="btn-icon"
                  onClick={e => handleDelete(pl.id, e)}
                  title="Delete"
                  style={{ fontSize: 16, color: 'var(--text-muted)' }}
                >
                  <HiTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
