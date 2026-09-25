import { useState, useCallback, useRef } from 'react';
import { musicService } from '../services/musicService';
import { SongRow } from '../components/SongCard';
import { HiSearch } from 'react-icons/hi';

const LANGUAGE_TABS = [
  { key: 'all', label: '🌐 All' },
  { key: 'hindi', label: '🇮🇳 Hindi' },
  { key: 'english', label: '🌍 English' },
  { key: 'punjabi', label: '🎶 Punjabi' },
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState('all');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef(null);
  const requestIdRef = useRef(0);

  const doSearch = useCallback(async (q, lang) => {
    if (!q.trim()) { setResults([]); setSearched(false); return; }
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setSearched(true);
    try {
      const data = await musicService.search(q, lang);
      if (requestId !== requestIdRef.current) return; // stale response, ignore
      setResults(data || []);
    } catch (_) {
      if (requestId === requestIdRef.current) setResults([]);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, []);

  const handleInput = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val, language), 600);
  };

  const handleLangChange = (lang) => {
    setLanguage(lang);
    if (query.trim()) doSearch(query, lang);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    doSearch(query, language);
  };

  return (
    <div className="fade-in">
      <div className="section-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="section-title">Search</h1>
          <p className="section-subtitle">Find your favorite songs</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="search-bar">
          <HiSearch className="search-icon" />
          <input
            id="search-input"
            type="text"
            className="search-input"
            placeholder="Search songs, artists, albums..."
            value={query}
            onChange={handleInput}
            autoFocus
          />
        </div>
      </form>

      <div className="filter-tabs">
        {LANGUAGE_TABS.map(tab => (
          <button
            key={tab.key}
            className={`filter-tab ${language === tab.key ? 'active' : ''}`}
            onClick={() => handleLangChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="loading-container"><div className="spinner" /></div>}

      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <p className="empty-state-title">No results found</p>
          <p className="empty-state-text">Try a different search term or language filter</p>
        </div>
      )}

      {!loading && !searched && (
        <div className="empty-state">
          <div className="empty-state-icon">🎵</div>
          <p className="empty-state-title">Search for music</p>
          <p className="empty-state-text">Try searching for "Tum Hi Ho", "Kesariya", or "Shape of You"</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
            {results.length} results for "{query}"
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {results.map((song, i) => (
              <SongRow
                key={song.id}
                song={song}
                index={i}
                queue={results}
                showIndex={true}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
