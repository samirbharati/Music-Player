import { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { Howl } from 'howler';
import { musicService } from '../services/musicService';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [currentSong, setCurrentSong] = useState(null);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [seek, setSeek] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState('none'); // none | one | all
  const [isLoading, setIsLoading] = useState(false);

  const howlRef = useRef(null);
  const seekIntervalRef = useRef(null);
  const handleEndRef = useRef(null);

  // Refs mirroring state so timeouts/audio callbacks never read stale values
  const repeatModeRef = useRef('none');
  const isShuffledRef = useRef(false);
  const queueRef = useRef([]);
  const queueIndexRef = useRef(0);
  const seekRef = useRef(0);
  const volumeRef = useRef(0.8);

  const clearSeekInterval = useCallback(() => {
    if (seekIntervalRef.current) clearInterval(seekIntervalRef.current);
  }, []);

  const startSeekInterval = useCallback((howl) => {
    clearSeekInterval();
    seekIntervalRef.current = setInterval(() => {
      const s = howl.seek();
      if (typeof s === 'number') {
        setSeek(s);
        seekRef.current = s;
      }
    }, 500);
  }, [clearSeekInterval]);

  const playSong = useCallback((song, songQueue = [], index = 0) => {
    if (!song?.audioUrl) return;

    // Stop current
    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current.unload();
    }
    clearSeekInterval();

    const q = songQueue.length > 0 ? songQueue : [song];
    queueRef.current = q;
    queueIndexRef.current = index;
    seekRef.current = 0;

    setCurrentSong(song);
    setQueue(q);
    setQueueIndex(index);
    setSeek(0);
    setIsLoading(true);

    const howl = new Howl({
      src: [song.audioUrl],
      html5: true,
      volume: volumeRef.current,
      onload: () => {
        setDuration(howl.duration());
        setIsLoading(false);
      },
      onplay: () => {
        setIsPlaying(true);
        startSeekInterval(howl);
      },
      onpause: () => {
        setIsPlaying(false);
        clearSeekInterval();
      },
      onstop: () => {
        setIsPlaying(false);
        clearSeekInterval();
        setSeek(0);
      },
      onend: () => {
        clearSeekInterval();
        handleEndRef.current?.();
      },
      onloaderror: (id, err) => {
        console.error('Audio load error:', err);
        setIsLoading(false);
        setIsPlaying(false);
      }
    });

    howlRef.current = howl;
    howl.play();

    // Track recently played
    try { musicService.addRecentlyPlayed(song); } catch (_) {}
  }, [clearSeekInterval, startSeekInterval]);

  const handleSongEnd = useCallback(() => {
    if (repeatModeRef.current === 'one') {
      howlRef.current?.seek(0);
      howlRef.current?.play();
      return;
    }
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    const next = isShuffledRef.current
      ? Math.floor(Math.random() * q.length)
      : idx + 1;
    if (next < q.length) {
      playSong(q[next], q, next);
    } else if (repeatModeRef.current === 'all' && q.length > 0) {
      playSong(q[0], q, 0);
    } else {
      setIsPlaying(false);
    }
  }, [playSong]);

  useEffect(() => { handleEndRef.current = handleSongEnd; }, [handleSongEnd]);

  const togglePlay = useCallback(() => {
    if (!howlRef.current) return;
    if (howlRef.current.playing()) {
      howlRef.current.pause();
    } else {
      howlRef.current.play();
    }
  }, []);

  const playNext = useCallback(() => {
    const q = queueRef.current;
    const idx = queueIndexRef.current;
    const next = isShuffledRef.current ? Math.floor(Math.random() * q.length) : idx + 1;
    if (next < q.length) playSong(q[next], q, next);
  }, [playSong]);

  const playPrev = useCallback(() => {
    if (seekRef.current > 3) {
      howlRef.current?.seek(0);
      setSeek(0);
      seekRef.current = 0;
    } else {
      const q = queueRef.current;
      const idx = queueIndexRef.current;
      const prev = idx - 1;
      if (prev >= 0) playSong(q[prev], q, prev);
    }
  }, [playSong]);

  const seekTo = useCallback((val) => {
    if (howlRef.current) {
      howlRef.current.seek(val);
      setSeek(val);
      seekRef.current = val;
    }
  }, []);

  const changeVolume = useCallback((val) => {
    setVolume(val);
    volumeRef.current = val;
    if (howlRef.current) howlRef.current.volume(val);
  }, []);

  const toggleShuffle = useCallback(() => {
    const next = !isShuffledRef.current;
    isShuffledRef.current = next;
    setIsShuffled(next);
  }, []);

  const cycleRepeat = useCallback(() => {
    const next = repeatModeRef.current === 'none' ? 'all'
      : repeatModeRef.current === 'all' ? 'one' : 'none';
    repeatModeRef.current = next;
    setRepeatMode(next);
  }, []);

  // Keep refs in sync with state at all times
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { queueIndexRef.current = queueIndex; }, [queueIndex]);
  useEffect(() => { isShuffledRef.current = isShuffled; }, [isShuffled]);
  useEffect(() => { repeatModeRef.current = repeatMode; }, [repeatMode]);
  useEffect(() => { seekRef.current = seek; }, [seek]);
  useEffect(() => { volumeRef.current = volume; }, [volume]);

  useEffect(() => {
    return () => {
      clearSeekInterval();
      if (howlRef.current) {
        howlRef.current.stop();
        howlRef.current.unload();
      }
    };
  }, [clearSeekInterval]);

  return (
    <PlayerContext.Provider value={{
      currentSong, queue, queueIndex,
      isPlaying, duration, seek, volume,
      isShuffled, repeatMode, isLoading,
      playSong, togglePlay, playNext, playPrev,
      seekTo, changeVolume, toggleShuffle, cycleRepeat
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
};