import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import EventList from './pages/EventList';
import EventPage from './pages/EventPage';
import WaitingRoom from './pages/WaitingRoom';
import GamePage from './pages/GamePage';
import AdminPanel from './pages/AdminPanel';
import PrivateRoute from './components/PrivateRoute';
import { ThemeProvider } from './context/ThemeContext';
import { ThemeToggle } from './components/UI/ThemeToggle';
import AdminRoute from './components/AdminRoute';
import { DirectorPage } from './pages/DirectorPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ThemeToggle />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/events"
              element={
                <PrivateRoute>
                  <EventList />
                </PrivateRoute>
              }
            />
            <Route
              path="/event/:eventId"
              element={
                <PrivateRoute>
                  <EventPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/event/:eventId/waiting/:roundId"
              element={
                <PrivateRoute>
                  <WaitingRoom />
                </PrivateRoute>
              }
            />
            <Route
              path="/game/:roundId"
              element={
                <PrivateRoute>
                  <GamePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />
            <Route
              path="/director"
              element={
                <AdminRoute>
                  <DirectorPage />
                </AdminRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

