import { usePlayer } from '../context/PlayerContext';
import { musicService } from '../services/musicService';
import { useState, useRef, useEffect } from 'react';
import {
  HiPlay, HiPause, HiVolumeUp, HiVolumeOff, HiHeart
} from 'react-icons/hi';
import { MdRepeat, MdRepeatOne, MdShuffle, MdSkipNext, MdSkipPrevious } from 'react-icons/md';
import toast from 'react-hot-toast';

function formatTime(secs) {
  if (!secs || isNaN(secs)) return '0:00';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function MusicPlayer() {
  const {
    currentSong, isPlaying, duration, seek, volume,
    isShuffled, repeatMode, isLoading,
    togglePlay, playNext, playPrev, seekTo, changeVolume,
    toggleShuffle, cycleRepeat
  } = usePlayer();

  const [liked, setLiked] = useState(currentSong?.liked || false);
  const progressRef = useRef(null);
  const volumeRef = useRef(null);

  // Keep the like state in sync when the playing song changes
  useEffect(() => {
    setLiked(currentSong?.liked ?? false);
  }, [currentSong?.id, currentSong?.liked]);

  const handleProgressClick = (e) => {
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seekTo(Math.max(0, Math.min(ratio * duration, duration)));
  };

  const handleVolumeClick = (e) => {
    const rect = volumeRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    changeVolume(Math.max(0, Math.min(ratio, 1)));
  };

  const handleLike = async () => {
    if (!currentSong) return;
    try {
      const res = await musicService.toggleLike(currentSong);
      setLiked(res.liked);
      toast.success(res.liked ? '❤️ Added to Liked Songs' : 'Removed from Liked Songs');
    } catch (_) {
      toast.error('Failed to update');
    }
  };

  const progress = duration > 0 ? (seek / duration) * 100 : 0;

  if (!currentSong) {
    return (
      <div className="music-player" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          🎵 Search for a song and start listening
        </p>
      </div>
    );
  }

  return (
    <div className="music-player">
      {/* Song Info */}
      <div className="player-song-info">
        <img
          src={currentSong.imageUrl || '/placeholder.png'}
          alt={currentSong.name}
          className="player-song-img"
          onError={e => { e.target.style.background = 'var(--accent-gradient)'; e.target.style.display = 'none'; }}
        />
        <div className="player-song-details">
          <p className="player-song-name">{currentSong.name}</p>
          <p className="player-song-artist">{currentSong.artistName}</p>
        </div>
        <button
          className={`player-like-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
          title={liked ? 'Unlike' : 'Like'}
        >
          <HiHeart />
        </button>
      </div>

      {/* Controls */}
      <div className="player-controls">
        <div className="player-buttons">
          <button
            className="player-btn"
            onClick={toggleShuffle}
            style={{ color: isShuffled ? 'var(--accent-primary-light)' : undefined }}
            title="Shuffle"
          >
            <MdShuffle />
          </button>

          <button className="player-btn" onClick={playPrev} title="Previous">
            <MdSkipPrevious />
          </button>

          <button
            className="player-btn player-btn-play"
            onClick={togglePlay}
            disabled={isLoading}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading
              ? <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              : isPlaying ? <HiPause /> : <HiPlay style={{ marginLeft: 2 }} />
            }
          </button>

          <button className="player-btn" onClick={playNext} title="Next">
            <MdSkipNext />
          </button>

          <button
            className="player-btn"
            onClick={cycleRepeat}
            style={{ color: repeatMode !== 'none' ? 'var(--accent-primary-light)' : undefined }}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <MdRepeatOne /> : <MdRepeat />}
          </button>
        </div>

        <div className="player-progress">
          <span className="progress-time">{formatTime(seek)}</span>
          <div
            className="progress-bar"
            ref={progressRef}
            onClick={handleProgressClick}
          >
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-time">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="player-volume">
        <button
          className="player-btn"
          onClick={() => changeVolume(volume > 0 ? 0 : 0.8)}
          title={volume === 0 ? 'Unmute' : 'Mute'}
        >
          {volume === 0 ? <HiVolumeOff /> : <HiVolumeUp />}
        </button>
        <div
          className="volume-slider"
          ref={volumeRef}
          onClick={handleVolumeClick}
        >
          <div className="volume-fill" style={{ width: `${volume * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
