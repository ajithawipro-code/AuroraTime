import { useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, ListPlus } from 'lucide-react';
import { useAuth } from '@getmocha/users-service/react';

interface HeaderProps {
  currentPage: 'dashboard' | 'activities';
}

export default function Header({ currentPage }: HeaderProps) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await fetch('/api/logout');
      navigate('/login');
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="mb-8">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div className="text-center flex-1">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2 neon-text">
            AuroraTime
          </h1>
          <p className="text-gray-300 text-lg">
            {currentPage === 'dashboard' ? 'Your daily insights' : 'Design your day'}
          </p>
        </div>
        
        <div className="absolute right-6 top-6 flex gap-3">
          {currentPage === 'dashboard' ? (
            <button
              onClick={() => navigate('/add-activities')}
              className="glass-dark px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-all flex items-center gap-2 border border-white/20"
              title="Add Activities"
            >
              <ListPlus className="w-5 h-5" />
              <span className="hidden md:inline">Add Activities</span>
            </button>
          ) : (
            <button
              onClick={() => navigate('/dashboard')}
              className="glass-dark px-4 py-2 rounded-xl text-white hover:bg-white/10 transition-all flex items-center gap-2 border border-white/20"
              title="Dashboard"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="hidden md:inline">Dashboard</span>
            </button>
          )}
          
          <button
            onClick={handleLogout}
            className="glass-dark px-4 py-2 rounded-xl text-white hover:bg-red-500/20 transition-all flex items-center gap-2 border border-white/20 hover:border-red-400/50"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
      
      {user && (
        <div className="text-center mt-4">
          <p className="text-gray-400 text-sm">Welcome, {user.google_user_data.name || user.email}</p>
        </div>
      )}
    </div>
  );
}
