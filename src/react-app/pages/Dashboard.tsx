import { useMemo, useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@getmocha/users-service/react';
import { Clock, Activity, Sparkles } from 'lucide-react';
import AuroraBackground from '@/react-app/components/AuroraBackground';
import GlassCard from '@/react-app/components/GlassCard';
import DatePicker from '@/react-app/components/DatePicker';
import Header from '@/react-app/components/Header';
import PieChart from '@/react-app/components/PieChart';
import EmptyState from '@/react-app/components/EmptyState';

const CATEGORY_COLORS_MAP: Record<string, string> = {
  Work: '#3b82f6',
  Study: '#a855f7',
  Health: '#10b981',
  Sleep: '#6366f1',
  Leisure: '#f59e0b',
  Others: '#6b7280'
};

type ActivityType = {
  id: number;
  name: string;
  category: string;
  duration: number;
  date: string;
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isPending } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dailyActivities, setDailyActivities] = useState<ActivityType[]>([]);
  const [aiText, setAiText] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const selectedDate = searchParams.get('date') || today;

  useEffect(() => {
    if (!isPending && !user) navigate('/login');
  }, [user, isPending, navigate]);

  useEffect(() => {
    loadActivities();
  }, [selectedDate]);

  const loadActivities = async () => {
    setIsLoadingActivities(true);
    try {
      const response = await fetch(`/api/activities?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setDailyActivities(data);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  const totalMinutes = useMemo(
    () => dailyActivities.reduce((sum, activity) => sum + activity.duration, 0),
    [dailyActivities]
  );

  const categoryData = useMemo(() => {
    const categoryMap: Record<string, number> = {};
    dailyActivities.forEach(activity => {
      categoryMap[activity.category] =
        (categoryMap[activity.category] || 0) + activity.duration;
    });
    return Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
      color: CATEGORY_COLORS_MAP[name]
    }));
  }, [dailyActivities]);

  const handleDateChange = (date: string) => {
    setSearchParams({ date });
  };

  const generateAIMood = async () => {
    if (dailyActivities.length === 0) {
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activities: dailyActivities })
      });

      if (response.ok) {
        const data = await response.json();
        setAiText(data.mood);
      } else {
        setAiText("AI could not analyze today. Try again later.");
      }
    } catch {
      setAiText("AI could not analyze today. Try again later.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <AuroraBackground />
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen p-6">
      <AuroraBackground />

      <div className="max-w-6xl mx-auto">
        <Header currentPage="dashboard" />

        <div className="mb-6 flex justify-center">
          <DatePicker value={selectedDate} onChange={handleDateChange} />
        </div>

        {isLoadingActivities ? (
          <GlassCard>
            <div className="flex items-center justify-center py-16">
              <p className="text-white text-xl">Loading...</p>
            </div>
          </GlassCard>
        ) : dailyActivities.length === 0 ? (
          <GlassCard>
            <EmptyState />
          </GlassCard>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <GlassCard className="text-center">
                <Clock className="w-8 h-8 mx-auto text-cyan-400 mb-2" />
                <h3 className="text-gray-400 text-sm">Total Time</h3>
                <p className="text-4xl font-bold text-white">{totalMinutes}</p>
                <p className="text-gray-400 text-sm mt-1">minutes</p>
              </GlassCard>

              <GlassCard className="text-center">
                <Activity className="w-8 h-8 mx-auto text-purple-400 mb-2" />
                <h3 className="text-gray-400 text-sm">Activities</h3>
                <p className="text-4xl font-bold text-white">{dailyActivities.length}</p>
                <p className="text-gray-400 text-sm mt-1">logged</p>
              </GlassCard>

              <GlassCard className="text-center">
                <Sparkles className="w-8 h-8 mx-auto text-pink-400 mb-2" />
                <h3 className="text-gray-400 text-sm">Completion</h3>
                <p className="text-4xl font-bold text-white">
                  {Math.round((totalMinutes / 1440) * 100)}%
                </p>
                <p className="text-gray-400 text-sm mt-1">of day</p>
              </GlassCard>
            </div>

            <GlassCard className="mb-6">
              <h2 className="text-2xl font-semibold text-white mb-6">Activity Breakdown</h2>
              <PieChart data={categoryData} />
            </GlassCard>

            <GlassCard>
              <h2 className="text-2xl font-semibold text-white mb-4">AI Mood of the Day</h2>

              {aiText ? (
                <p className="text-gray-300 leading-relaxed mb-6 whitespace-pre-line">{aiText}</p>
              ) : (
                <p className="text-gray-400 leading-relaxed mb-6">
                  Click the button below and I'll generate a mood summary and suggestions based on today's activities.
                </p>
              )}

              <button
                type="button"
                onClick={generateAIMood}
                disabled={isGenerating}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full text-white font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed neon-glow"
              >
                {isGenerating ? 'Generating...' : '✨ Analyze with AI'}
              </button>
            </GlassCard>
          </>
        )}
      </div>
    </div>
  );
}
