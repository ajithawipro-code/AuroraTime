import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export default function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div className={`glass rounded-3xl p-6 shadow-2xl ${className}`}>
      {children}
    </div>
  );
}
