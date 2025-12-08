import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@getmocha/users-service/react';
import { Edit2, Trash2 } from 'lucide-react';
import AuroraBackground from '@/react-app/components/AuroraBackground';
import GlassCard from '@/react-app/components/GlassCard';
import Button from '@/react-app/components/Button';
import Input from '@/react-app/components/Input';
import Select from '@/react-app/components/Select';
import DatePicker from '@/react-app/components/DatePicker';
import Header from '@/react-app/components/Header';
import EmptyState from '@/react-app/components/EmptyState';

const CATEGORIES = [
  { value: 'Work', label: 'Work' },
  { value: 'Study', label: 'Study' },
  { value: 'Health', label: 'Health' },
  { value: 'Sleep', label: 'Sleep' },
  { value: 'Leisure', label: 'Leisure' },
  { value: 'Others', label: 'Others' }
];

const CATEGORY_COLORS: Record<string, string> = {
  Work: 'from-blue-500 to-cyan-500',
  Study: 'from-purple-500 to-pink-500',
  Health: 'from-green-500 to-emerald-500',
  Sleep: 'from-indigo-500 to-purple-500',
  Leisure: 'from-orange-500 to-yellow-500',
  Others: 'from-gray-500 to-slate-500'
};

type Activity = {
  id: number;
  name: string;
  category: string;
  duration: number;
  date: string;
};

export default function AddActivities() {
  const navigate = useNavigate();
  const { user, isPending } = useAuth();
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Work');
  const [duration, setDuration] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [dailyActivities, setDailyActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (!isPending && !user) {
      navigate('/login');
    }
  }, [user, isPending, navigate]);

  useEffect(() => {
    loadActivities();
  }, [selectedDate]);

  const loadActivities = async () => {
    try {
      const response = await fetch(`/api/activities?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setDailyActivities(data);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    }
  };

  const totalMinutes = useMemo(() =>
    dailyActivities.reduce((sum, activity) => sum + activity.duration, 0),
    [dailyActivities]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate total minutes doesn't exceed 1440
    const newTotal = editingId 
      ? totalMinutes - (dailyActivities.find(a => a.id === editingId)?.duration || 0) + Number(duration)
      : totalMinutes + Number(duration);

    if (newTotal > 1440) {
      alert(`Cannot add activity. Total would exceed 1440 minutes (24 hours). Current: ${totalMinutes} minutes, Available: ${1440 - totalMinutes} minutes.`);
      return;
    }

    try {
      if (editingId) {
        await fetch(`/api/activities/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            category,
            duration: Number(duration),
            date: selectedDate
          })
        });
        setEditingId(null);
      } else {
        await fetch('/api/activities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            category,
            duration: Number(duration),
            date: selectedDate
          })
        });
      }

      setName('');
      setCategory('Work');
      setDuration('');
      loadActivities();
    } catch (error) {
      console.error('Failed to save activity:', error);
    }
  };

  const handleEdit = (id: number) => {
    const activity = dailyActivities.find(a => a.id === id);
    if (activity) {
      setName(activity.name);
      setCategory(activity.category);
      setDuration(activity.duration.toString());
      setEditingId(id);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/activities/${id}`, { method: 'DELETE' });
      loadActivities();
    } catch (error) {
      console.error('Failed to delete activity:', error);
    }
  };

  const progressPercent = (totalMinutes / 1440) * 100;

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <AuroraBackground />
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen p-6">
      <AuroraBackground />

      <div className="max-w-5xl mx-auto">
        <Header currentPage="activities" />

        <div className="mb-6 flex justify-center">
          <DatePicker value={selectedDate} onChange={setSelectedDate} />
        </div>

        <GlassCard className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-6">Add Activity</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Activity Name" placeholder="e.g., Morning workout" value={name} onChange={setName} required />
              <Select label="Category" value={category} onChange={setCategory} options={CATEGORIES} required />
              <Input label="Duration (minutes)" type="number" placeholder="60" value={duration} onChange={setDuration} required min={1} />
            </div>

            <Button type="submit" variant="primary" className="w-full md:w-auto">
              {editingId ? 'Update Activity' : 'Add Activity'}
            </Button>

            {editingId && (
              <Button type="button" variant="secondary" className="w-full md:w-auto md:ml-3"
                onClick={() => { setEditingId(null); setName(''); setCategory('Work'); setDuration(''); }}>
                Cancel
              </Button>
            )}
          </form>
        </GlassCard>

        {dailyActivities.length > 0 ? (
          <GlassCard className="mb-6">
            <h2 className="text-2xl font-semibold text-white mb-6">Today's Activities</h2>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-cyan-300 font-medium">Activity</th>
                    <th className="text-left py-3 px-4 text-cyan-300 font-medium">Category</th>
                    <th className="text-left py-3 px-4 text-cyan-300 font-medium">Minutes</th>
                    <th className="text-right py-3 px-4 text-cyan-300 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyActivities.map((activity) => (
                    <tr key={activity.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 text-white">{activity.name}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${CATEGORY_COLORS[activity.category]} text-white`}>
                          {activity.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-white">{activity.duration}</td>
                      <td className="py-4 px-4 text-right">
                        <button onClick={() => handleEdit(activity.id)} className="text-cyan-400 hover:text-cyan-300 p-2 transition-colors">
                          <Edit2 className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(activity.id)} className="text-pink-400 hover:text-pink-300 p-2 ml-2 transition-colors">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        ) : (
          <GlassCard className="mb-6">
            <EmptyState message="No activities logged yet. Add your first activity above to get started!" />
          </GlassCard>
        )}

        <GlassCard>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg text-white font-medium">Daily Progress</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                {totalMinutes} / 1440 min
              </span>
            </div>
            <div className="h-4 glass-dark rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-600 transition-all duration-500 neon-glow"
                style={{ width: `${Math.min(progressPercent, 100)}%` }} />
            </div>
            <p className="text-gray-400 text-sm mt-2 text-center">
              {totalMinutes === 1440 
                ? '🎉 Day complete! View insights on Dashboard' 
                : `${1440 - totalMinutes} minutes remaining`}
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
