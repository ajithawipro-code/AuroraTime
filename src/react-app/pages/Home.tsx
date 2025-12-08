import { createContext, useContext, useState, ReactNode } from "react";

// Type for single activity
export type Activity = {
  id: string;
  date: string;
  name: string;
  category: string;
  duration: number;
};

// Type for Context functions
type ActivityContextType = {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, "id">) => void;
  updateActivity: (id: string, updated: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  getActivitiesForDate: (date: string) => Activity[];
};

// Create Context
const ActivityContext = createContext<ActivityContextType | undefined>(
  undefined
);

// Provider component
export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([]);

  const addActivity = (activity: Omit<Activity, "id">) => {
    setActivities((prev) => [
      ...prev,
      { ...activity, id: crypto.randomUUID() },
    ]);
  };

  const updateActivity = (id: string, updated: Partial<Activity>) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updated } : a))
    );
  };

  const deleteActivity = (id: string) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
  };

  const getActivitiesForDate = (date: string) =>
    activities.filter((a) => a.date === date);

  return (
    <ActivityContext.Provider
      value={{
        activities,
        addActivity,
        updateActivity,
        deleteActivity,
        getActivitiesForDate,
      }}
    >
      {children}
    </ActivityContext.Provider>
  );
}

// Custom Hook
export function useActivities() {
  const context = useContext(ActivityContext);
  if (!context) {
    throw new Error("useActivities must be used inside ActivityProvider");
  }
  return context;
}
