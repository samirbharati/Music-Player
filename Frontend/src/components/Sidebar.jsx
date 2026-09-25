import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { playlistService } from '../services/playlistService';
import { useEffect, useState } from 'react';
import { HiHome, HiSearch, HiCollection, HiHeart, HiClock, HiUser, HiLogout, HiPlus, HiMusicNote } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      const data = await playlistService.getAll();
      setPlaylists(data);
    } catch (_) {}
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const createPlaylist = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await playlistService.create({ name: newName.trim() });
      toast.success('Playlist created!');
      setNewName('');
      setShowNewPlaylist(false);
      loadPlaylists();
    } catch (_) {
      toast.error('Failed to create playlist');
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">🎵</div>
        <h1>GrooveWave</h1>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-section-label">Menu</p>
        <NavLink to="/home" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <HiHome className="nav-icon" /> Home
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <HiSearch className="nav-icon" /> Search
        </NavLink>
        <NavLink to="/library" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <HiCollection className="nav-icon" /> Library
        </NavLink>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-section-label">Collection</p>
        <NavLink to="/liked" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <HiHeart className="nav-icon" /> Liked Songs
        </NavLink>
        <NavLink to="/recent" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <HiClock className="nav-icon" /> Recent
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}>
          <HiUser className="nav-icon" /> Profile
        </NavLink>
      </div>

      <div className="sidebar-section" style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="sidebar-section-label">Playlists</p>
          <button
            className="btn-icon"
            onClick={() => setShowNewPlaylist(v => !v)}
            title="New Playlist"
            style={{ fontSize: 14 }}
          >
            <HiPlus />
          </button>
        </div>

        {showNewPlaylist && (
          <form onSubmit={createPlaylist} style={{ marginBottom: 8, padding: '0 4px' }}>
            <input
              className="form-input"
              style={{ marginBottom: 6, fontSize: 13, padding: '8px 12px' }}
              placeholder="Playlist name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '6px 0', fontSize: 12 }}>
                Create
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setShowNewPlaylist(false)} style={{ padding: '6px 10px', fontSize: 12 }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        {playlists.map(pl => (
          <NavLink
            key={pl.id}
            to={`/playlist/${pl.id}`}
            className="sidebar-playlist-item"
          >
            <div className="playlist-thumb">
              {pl.coverImage
                ? <img src={pl.coverImage} alt={pl.name} />
                : <HiMusicNote style={{ color: 'white', fontSize: 14 }} />
              }
            </div>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pl.name}
            </span>
          </NavLink>
        ))}
      </div>

      <div className="sidebar-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
        <div style={{ padding: '4px 8px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0
          }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Free Plan</p>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Logout">
            <HiLogout style={{ fontSize: 16 }} />
          </button>
        </div>
      </div>
    </aside>
  );
}
