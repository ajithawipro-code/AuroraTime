import { Calendar } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message = "No data available. Please start logging for the day." }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="glass-dark p-8 rounded-full mb-6 animate-float">
        <Calendar className="w-16 h-16 text-cyan-400" />
      </div>
      <h3 className="text-2xl font-semibold text-white mb-2">No Activities Yet</h3>
      <p className="text-gray-400 text-center max-w-md">{message}</p>
    </div>
  );
}
