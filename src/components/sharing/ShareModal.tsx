"use client";

import * as React from "react";
import { Copy, Check, Link2, User, Users, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type EntryType = "TRADE_IDEA" | "TRADE" | "REFLECTION" | "OBSERVATION";

interface ShareModalEntry {
  id: string;
  content: string;
  type: EntryType;
  ticker?: string | null;
  mood?: string | null;
  conviction?: string | null;
  sentiment?: number | null;
  detectedBiases?: string[];
  aiTags?: string[];
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: ShareModalEntry | null;
  onCreateShare?: (options: ShareOptions) => Promise<{ url: string; slug: string }>;
}

export interface ShareOptions {
  entryId: string;
  redactPL: boolean;
  redactTickers: boolean;
  showMood: boolean;
  includeAIInsights: boolean;
  expiration: "never" | "1day" | "1week" | "1month";
  password?: string;
}

const TYPE_CONFIG: Record<EntryType, { label: string; bgColor: string }> = {
  TRADE_IDEA: {
    label: "Trade Idea",
    bgColor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  },
  TRADE: {
    label: "Trade",
    bgColor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  },
  REFLECTION: {
    label: "Reflection",
    bgColor: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  },
  OBSERVATION: {
    label: "Observation",
    bgColor: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  },
};

function redactContent(
  content: string,
  redactPL: boolean,
  redactTickers: boolean
): string {
  let redacted = content;

  if (redactPL) {
    // Redact dollar amounts like $100, $1,234.56, -$500
    redacted = redacted.replace(/[-+]?\$[\d,]+\.?\d*/g, "$[REDACTED]");
    // Redact percentage gains/losses
    redacted = redacted.replace(/[-+]?\d+\.?\d*%/g, "[REDACTED]%");
  }

  if (redactTickers) {
    // Redact common ticker patterns like AAPL, SPY, NVDA
    redacted = redacted.replace(/\b[A-Z]{1,5}\b(?=\s|$|[.,!?])/g, "[TICKER]");
    // Redact $TICKER format
    redacted = redacted.replace(/\$[A-Z]{1,5}\b/g, "$[TICKER]");
  }

  return redacted;
}

export function ShareModal({
  isOpen,
  onClose,
  entry,
  onCreateShare,
}: ShareModalProps) {
  const [redactPL, setRedactPL] = React.useState(false);
  const [redactTickers, setRedactTickers] = React.useState(false);
  const [showMood, setShowMood] = React.useState(true);
  const [includeAIInsights, setIncludeAIInsights] = React.useState(true);
  const [expiration, setExpiration] = React.useState<
    "never" | "1day" | "1week" | "1month"
  >("never");
  const [password, setPassword] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);
  const [shareUrl, setShareUrl] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // Reset state when modal opens with new entry
  React.useEffect(() => {
    if (isOpen && entry) {
      setRedactPL(false);
      setRedactTickers(false);
      setShowMood(true);
      setIncludeAIInsights(true);
      setExpiration("never");
      setPassword("");
      setShareUrl(null);
      setCopied(false);
    }
  }, [isOpen, entry?.id]);

  const handleCreateShare = async () => {
    if (!entry || !onCreateShare) return;

    setIsCreating(true);
    try {
      const result = await onCreateShare({
        entryId: entry.id,
        redactPL,
        redactTickers,
        showMood,
        includeAIInsights,
        expiration,
        password: password || undefined,
      });
      setShareUrl(result.url);
    } catch (error) {
      console.error("Failed to create share link:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  if (!entry) return null;

  const previewContent = redactContent(entry.content, redactPL, redactTickers);
  const typeConfig = TYPE_CONFIG[entry.type];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Share Entry
          </DialogTitle>
          <DialogDescription className="text-slate-600 dark:text-slate-400">
            Create a shareable link with privacy controls
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Privacy Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Privacy Options
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <span className="text-red-600 dark:text-red-400 text-sm font-medium">
                      $
                    </span>
                  </div>
                  <div>
                    <Label htmlFor="redact-pl" className="font-medium">
                      Redact P/L
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Hide dollar amounts and percentages
                    </p>
                  </div>
                </div>
                <Switch
                  id="redact-pl"
                  checked={redactPL}
                  onCheckedChange={setRedactPL}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <span className="text-blue-600 dark:text-blue-400 text-sm font-mono">
                      SPY
                    </span>
                  </div>
                  <div>
                    <Label htmlFor="redact-tickers" className="font-medium">
                      Redact Tickers
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Hide stock/option symbols
                    </p>
                  </div>
                </div>
                <Switch
                  id="redact-tickers"
                  checked={redactTickers}
                  onCheckedChange={setRedactTickers}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <span className="text-lg">
                      {showMood ? getMoodEmoji(entry.mood) : "?"}
                    </span>
                  </div>
                  <div>
                    <Label htmlFor="show-mood" className="font-medium">
                      Show Mood
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Include emotional state
                    </p>
                  </div>
                </div>
                <Switch
                  id="show-mood"
                  checked={showMood}
                  onCheckedChange={setShowMood}
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <span className="text-purple-600 dark:text-purple-400 text-sm">
                      AI
                    </span>
                  </div>
                  <div>
                    <Label htmlFor="include-ai" className="font-medium">
                      Include AI Insights
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Share detected biases and tags
                    </p>
                  </div>
                </div>
                <Switch
                  id="include-ai"
                  checked={includeAIInsights}
                  onCheckedChange={setIncludeAIInsights}
                />
              </div>
            </div>
          </div>

          {/* Expiration */}
          <div className="space-y-2">
            <Label htmlFor="expiration" className="text-sm font-medium">
              Link Expiration
            </Label>
            <Select value={expiration} onValueChange={(v) => setExpiration(v as typeof expiration)}>
              <SelectTrigger id="expiration" className="min-h-[44px]">
                <SelectValue placeholder="Select expiration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never expires</SelectItem>
                <SelectItem value="1day">1 day</SelectItem>
                <SelectItem value="1week">1 week</SelectItem>
                <SelectItem value="1month">1 month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Password Protection */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Password Protection (Optional)
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter password to protect link"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="min-h-[44px]"
            />
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              Preview
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="secondary"
                  className={cn("text-xs font-medium", typeConfig.bgColor)}
                >
                  {typeConfig.label}
                </Badge>
                {entry.ticker && !redactTickers && (
                  <Badge variant="outline" className="font-mono text-xs">
                    ${entry.ticker}
                  </Badge>
                )}
                {entry.ticker && redactTickers && (
                  <Badge variant="outline" className="font-mono text-xs">
                    $[TICKER]
                  </Badge>
                )}
                {showMood && entry.mood && (
                  <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                )}
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-3">
                {previewContent}
              </p>
              {includeAIInsights && entry.detectedBiases && entry.detectedBiases.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Detected biases: {entry.detectedBiases.join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Share URL or Create Button */}
          {shareUrl ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="flex-1 min-h-[44px] font-mono text-sm"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="min-h-[44px] min-w-[44px]"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {copied && (
                <p className="text-sm text-green-600 dark:text-green-400 text-center">
                  Link copied to clipboard!
                </p>
              )}

              {/* Quick Share Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px]"
                  onClick={() => {/* Share to mentor logic */}}
                >
                  <User className="h-4 w-4 mr-2" />
                  Send to Mentor
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px]"
                  onClick={() => {/* Share to partner logic */}}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Send to Partner
                </Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={handleCreateShare}
              disabled={isCreating || !onCreateShare}
              className="w-full min-h-[48px] bg-amber-500 hover:bg-amber-600 text-white"
            >
              {isCreating ? (
                <>
                  <span className="animate-spin mr-2">...</span>
                  Creating Link...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Create Share Link
                </>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to get mood emoji
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
