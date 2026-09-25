import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import MusicPlayer from './components/MusicPlayer';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Search from './pages/Search';
import Library from './pages/Library';
import PlaylistDetail from './pages/PlaylistDetail';
import LikedSongs from './pages/LikedSongs';
import RecentlyPlayed from './pages/RecentlyPlayed';
import Profile from './pages/Profile';

function AppLayout({ children }) {
  return (
    <>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
      <MusicPlayer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PlayerProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/home" replace />} />

            <Route path="/home" element={
              <ProtectedRoute>
                <AppLayout><Home /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/search" element={
              <ProtectedRoute>
                <AppLayout><Search /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/library" element={
              <ProtectedRoute>
                <AppLayout><Library /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/playlist/:id" element={
              <ProtectedRoute>
                <AppLayout><PlaylistDetail /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/liked" element={
              <ProtectedRoute>
                <AppLayout><LikedSongs /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/recent" element={
              <ProtectedRoute>
                <AppLayout><RecentlyPlayed /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <AppLayout><Profile /></AppLayout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/home" replace />} />
          </Routes>
        </PlayerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
