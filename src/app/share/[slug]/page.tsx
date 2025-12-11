"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Lock, Eye, Calendar, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

type EntryType = "TRADE_IDEA" | "TRADE" | "REFLECTION" | "OBSERVATION";

interface SharedContent {
  id: string;
  content: string;
  type: EntryType;
  ticker?: string | null;
  mood?: string | null;
  conviction?: string | null;
  createdAt: string;
  detectedBiases?: string[];
  aiTags?: string[];
  viewCount: number;
}

interface ShareData {
  slug: string;
  sharedAt: string;
  expiresAt: string | null;
  isPasswordProtected: boolean;
  entry: SharedContent | null;
}

const TYPE_CONFIG: Record<EntryType, { label: string; color: string; bgColor: string }> = {
  TRADE_IDEA: {
    label: "Trade Idea",
    color: "bg-blue-500",
    bgColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  TRADE: {
    label: "Trade",
    color: "bg-green-500",
    bgColor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  REFLECTION: {
    label: "Reflection",
    color: "bg-purple-500",
    bgColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  OBSERVATION: {
    label: "Observation",
    color: "bg-orange-500",
    bgColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
};

function getMoodEmoji(mood: string | null | undefined): string {
  const moodMap: Record<string, string> = {
    confident: "😎",
    excited: "🤩",
    optimistic: "😊",
    neutral: "😐",
    uncertain: "🤔",
    anxious: "😰",
    fearful: "😨",
    frustrated: "😤",
    regretful: "😔",
    hopeful: "🙏",
    calm: "😌",
    focused: "🎯",
    overwhelmed: "😵",
    disciplined: "💪",
  };
  return mood ? moodMap[mood] || "😐" : "😐";
}

function formatDate(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export default function ShareViewerPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [shareData, setShareData] = React.useState<ShareData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [password, setPassword] = React.useState("");
  const [passwordError, setPasswordError] = React.useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = React.useState(false);

  // Fetch share data
  React.useEffect(() => {
    async function fetchShare() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/shares/${slug}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("This share link does not exist or has expired.");
          } else {
            setError("Failed to load shared content.");
          }
          return;
        }

        const data = await response.json();
        setShareData(data);
      } catch {
        setError("Failed to load shared content. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchShare();
    }
  }, [slug]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setPasswordError("Please enter a password.");
      return;
    }

    setIsUnlocking(true);
    setPasswordError(null);

    try {
      const response = await fetch(`/api/shares/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          setPasswordError("Incorrect password. Please try again.");
        } else {
          setPasswordError("Failed to unlock. Please try again.");
        }
        return;
      }

      const data = await response.json();
      setShareData(data);
    } catch {
      setPasswordError("Failed to unlock. Please try again.");
    } finally {
      setIsUnlocking(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Loading shared content...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Content Not Available
          </h1>
          <p className="text-slate-600 dark:text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  // Password gate
  if (shareData?.isPasswordProtected && !shareData.entry) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-700/50 shadow-lg">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Protected Content
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                This content is password protected. Enter the password to view.
              </p>
            </div>

            <form onSubmit={handleUnlock} className="space-y-4">
              <div>
                <Label htmlFor="password" className="sr-only">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-[48px] text-center"
                  autoFocus
                />
                {passwordError && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2 text-center">
                    {passwordError}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                disabled={isUnlocking}
                className="w-full min-h-[48px] bg-amber-500 hover:bg-amber-600 text-white"
              >
                {isUnlocking ? "Unlocking..." : "Unlock Content"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // No entry found
  if (!shareData?.entry) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="h-8 w-8 text-slate-600 dark:text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Content Not Found
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            This shared content could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  const entry = shareData.entry;
  const typeConfig = TYPE_CONFIG[entry.type];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="text-slate-500">
              Shared Entry
            </Badge>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Eye className="h-4 w-4" />
              <span>{entry.viewCount} views</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            AI Trader Journal
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
          {/* Type indicator */}
          <div className={cn("h-1", typeConfig.color)} />

          <div className="p-6">
            {/* Entry header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="secondary"
                  className={cn("text-sm font-medium", typeConfig.bgColor)}
                >
                  {typeConfig.label}
                </Badge>
                {entry.ticker && (
                  <Badge variant="outline" className="font-mono">
                    ${entry.ticker}
                  </Badge>
                )}
                {entry.conviction && (
                  <Badge
                    variant="outline"
                    className={cn(
                      entry.conviction === "HIGH" &&
                        "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400",
                      entry.conviction === "MEDIUM" &&
                        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400",
                      entry.conviction === "LOW" &&
                        "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400"
                    )}
                  >
                    {entry.conviction.charAt(0) +
                      entry.conviction.slice(1).toLowerCase()}{" "}
                    Conviction
                  </Badge>
                )}
              </div>
              {entry.mood && (
                <span className="text-3xl" title={entry.mood}>
                  {getMoodEmoji(entry.mood)}
                </span>
              )}
            </div>

            {/* Entry content */}
            <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
              <p className="text-lg text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                {entry.content}
              </p>
            </div>

            {/* AI Insights */}
            {(entry.detectedBiases?.length || entry.aiTags?.length) && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  AI Insights
                </h3>

                {entry.detectedBiases && entry.detectedBiases.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      Detected Biases
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {entry.detectedBiases.map((bias) => (
                        <Badge
                          key={bias}
                          variant="outline"
                          className="bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400"
                        >
                          {bias}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {entry.aiTags && entry.aiTags.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      Tags
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {entry.aiTags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(entry.createdAt)}</span>
              </div>
              {shareData.expiresAt && (
                <span className="text-xs text-slate-400">
                  Expires {formatDate(shareData.expiresAt)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Attribution */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Shared via{" "}
            <a
              href="/"
              className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium"
            >
              AI Trader Journal
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
