import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactElement;
}

export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.disqualified) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Hesabınız Diskalifiye Edildi</h2>
        <p>Etkinliklerden çıkarıldınız.</p>
      </div>
    );
  }

  return children;
}

