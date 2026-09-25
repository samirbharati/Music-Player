import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { HiHeart, HiCollection, HiLogout } from 'react-icons/hi';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/user/profile')
      .then(r => setProfile(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) return <div className="loading-container"><div className="spinner" /></div>;

  const stats = [
    { icon: <HiHeart />, label: 'Liked Songs', value: profile?.likedSongsCount ?? 0, color: '#ef4444' },
    { icon: <HiCollection />, label: 'Playlists', value: profile?.playlistsCount ?? 0, color: 'var(--accent-primary)' },
  ];

  return (
    <div className="fade-in">
      <div style={{ maxWidth: 600 }}>
        {/* Profile Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(6,182,212,0.1))',
          border: '1px solid var(--border-active)',
          borderRadius: 'var(--radius-xl)',
          padding: '36px 32px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          gap: 24
        }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 800, color: 'white',
            boxShadow: 'var(--accent-glow)', flexShrink: 0
          }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>
              {profile?.username || user?.username}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 2 }}>
              {profile?.email || user?.email}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Free Plan · Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '—'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          {stats.map(stat => (
            <div key={stat.label} style={{
              background: 'var(--bg-card)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)', padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: 14
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 'var(--radius-sm)',
                background: `${stat.color}20`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 20, color: stat.color, flexShrink: 0
              }}>
                {stat.icon}
              </div>
              <div>
                <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>{stat.value}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '16px 20px', background: 'none', border: 'none',
              display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              color: '#ef4444', fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif',
              transition: 'var(--transition)'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <HiLogout style={{ fontSize: 18 }} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
