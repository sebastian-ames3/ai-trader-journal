"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MentorDashboard, MenteeCardSkeleton } from "@/components/sharing/MentorDashboard";

interface MenteeStats {
  totalEntries: number;
  currentStreak: number;
  topBias: string | null;
  moodTrend: "improving" | "declining" | "stable";
  lastWeekEntries: number;
}

interface Mentee {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  lastActiveAt: Date | string;
  stats: MenteeStats;
  isInactive: boolean;
  sharedEntriesCount: number;
}

// Mock data for demonstration
const MOCK_MENTEES: Mentee[] = [
  {
    id: "1",
    name: "Alex Chen",
    email: "alex@example.com",
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    stats: {
      totalEntries: 47,
      currentStreak: 12,
      topBias: "Confirmation Bias",
      moodTrend: "improving",
      lastWeekEntries: 5,
    },
    isInactive: false,
    sharedEntriesCount: 8,
  },
  {
    id: "2",
    name: "Sam Williams",
    email: "sam@example.com",
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 8), // 8 days ago
    stats: {
      totalEntries: 23,
      currentStreak: 0,
      topBias: "Loss Aversion",
      moodTrend: "declining",
      lastWeekEntries: 0,
    },
    isInactive: true,
    sharedEntriesCount: 3,
  },
  {
    id: "3",
    name: "Jordan Lee",
    email: "jordan@example.com",
    lastActiveAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    stats: {
      totalEntries: 89,
      currentStreak: 34,
      topBias: "Overconfidence",
      moodTrend: "stable",
      lastWeekEntries: 7,
    },
    isInactive: false,
    sharedEntriesCount: 15,
  },
];

export default function MentorDashboardPage() {
  const router = useRouter();
  const [mentees, setMentees] = React.useState<Mentee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Simulate fetching mentees
  React.useEffect(() => {
    const fetchMentees = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMentees(MOCK_MENTEES);
      setLoading(false);
    };

    fetchMentees();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setMentees(MOCK_MENTEES);
    setIsRefreshing(false);
  };

  const handleViewShared = (menteeId: string) => {
    // Navigate to mentee's shared entries view
    router.push(`/sharing/mentor/${menteeId}/entries`);
  };

  const handleCheckIn = (menteeId: string) => {
    // Open check-in modal or navigate to messaging
    const mentee = mentees.find((m) => m.id === menteeId);
    if (mentee) {
      // In a real app, this would open a messaging interface
      console.log(`Checking in with ${mentee.name}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                Mentor Dashboard
              </h1>
            </div>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing || loading}
              className="min-h-[44px]"
            >
              <RefreshCw
                className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="space-y-6">
            {/* Stats skeleton */}
            <div className="grid grid-cols-3 gap-3">
              <div className="h-24 skeleton rounded-2xl" />
              <div className="h-24 skeleton rounded-2xl" />
              <div className="h-24 skeleton rounded-2xl" />
            </div>
            {/* Cards skeleton */}
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <MenteeCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <MentorDashboard
            mentees={mentees}
            onViewShared={handleViewShared}
            onCheckIn={handleCheckIn}
          />
        )}
      </div>
    </div>
  );
}
