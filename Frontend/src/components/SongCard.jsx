import { usePlayer } from '../context/PlayerContext';
import { musicService } from '../services/musicService';
import { useState } from 'react';
import { HiHeart, HiPlusCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';

export function SongCard({ song, queue = [], index = 0, onLikeChange }) {
  const { playSong, currentSong, isPlaying } = usePlayer();
  const isActive = currentSong?.id === song.id;

  const handlePlay = () => playSong(song, queue.length > 0 ? queue : [song], index);

  return (
    <div className={`song-card ${isActive ? 'active' : ''}`} onClick={handlePlay}>
      <div className="song-card-img">
        <img
          src={song.imageUrl}
          alt={song.name}
          loading="lazy"
          onError={e => { e.target.src = `https://placehold.co/300x300/1a1a2e/7c3aed?text=${encodeURIComponent(song.name?.[0] || '🎵')}`; }}
        />
        <button className="song-card-play-btn" onClick={e => { e.stopPropagation(); handlePlay(); }}>
          {isActive && isPlaying ? '⏸' : '▶'}
        </button>
        {isActive && isPlaying && (
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            <div className="playing-bars">
              <span/><span/><span/>
            </div>
          </div>
        )}
      </div>
      <p className="song-card-title">{song.name}</p>
      <p className="song-card-artist">{song.artistName}</p>
    </div>
  );
}

export function SongRow({ song, index, queue = [], showIndex = true, onLikeChange, onAddToPlaylist }) {
  const { playSong, currentSong, isPlaying } = usePlayer();
  const isActive = currentSong?.id === song.id;
  const [liked, setLiked] = useState(song.liked || false);

  const handlePlay = () => playSong(song, queue.length > 0 ? queue : [song], index);

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      const res = await musicService.toggleLike(song);
      setLiked(res.liked);
      toast.success(res.liked ? '❤️ Added to Liked Songs' : 'Removed');
      onLikeChange?.();
    } catch (_) {
      toast.error('Failed to update');
    }
  };

  function formatDuration(secs) {
    if (!secs) return '--:--';
    const n = parseInt(secs);
    return `${Math.floor(n / 60)}:${(n % 60).toString().padStart(2, '0')}`;
  }

  return (
    <div className={`song-row ${isActive ? 'active' : ''}`} onClick={handlePlay}>
      <div className="song-row-num">
        {isActive && isPlaying
          ? <div className="playing-bars"><span/><span/><span/></div>
          : showIndex ? (index + 1) : null
        }
      </div>
      <img
        src={song.imageUrl}
        alt={song.name}
        className="song-row-img"
        onError={e => { e.target.src = `https://placehold.co/50x50/1a1a2e/7c3aed?text=${encodeURIComponent(song.name?.[0] || '♪')}`; }}
      />
      <div className="song-row-info">
        <p className="song-row-name">{song.name}</p>
        <p className="song-row-artist">{song.artistName}</p>
      </div>
      <div className="song-row-actions">
        <button
          className="btn-icon"
          onClick={handleLike}
          title={liked ? 'Unlike' : 'Like'}
          style={{ color: liked ? 'var(--accent-primary-light)' : undefined, fontSize: 18 }}
        >
          <HiHeart />
        </button>
        {onAddToPlaylist && (
          <button
            className="btn-icon"
            onClick={e => { e.stopPropagation(); onAddToPlaylist(song); }}
            title="Add to Playlist"
            style={{ fontSize: 18 }}
          >
            <HiPlusCircle />
          </button>
        )}
      </div>
      <span className="song-row-duration">{formatDuration(song.duration)}</span>
    </div>
  );
}
