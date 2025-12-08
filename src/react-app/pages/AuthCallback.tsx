import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@getmocha/users-service/react';
import AuroraBackground from '@/react-app/components/AuroraBackground';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { exchangeCodeForSessionToken } = useAuth();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        await exchangeCodeForSessionToken();
        navigate('/dashboard');
      } catch (error) {
        console.error('Auth failed:', error);
        navigate('/login');
      }
    };

    handleAuth();
  }, [exchangeCodeForSessionToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <AuroraBackground />
      <div className="text-white text-xl">Completing login...</div>
    </div>
  );
}
