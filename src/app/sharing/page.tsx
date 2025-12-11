"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Link2,
  Trash2,
  Copy,
  Check,
  UserPlus,
  Users,
  ArrowLeft,
  ExternalLink,
  Bell,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { AccountabilityWidget } from "@/components/sharing/AccountabilityWidget";

interface ActiveShare {
  id: string;
  slug: string;
  entryId: string;
  entryPreview: string;
  createdAt: string;
  expiresAt: string | null;
  viewCount: number;
  isPasswordProtected: boolean;
}

interface Mentor {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  connectedAt: string;
}

interface Partner {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  currentStreak: number;
  weeklyActivity: number[];
}

// Mock data for demonstration
const MOCK_SHARES: ActiveShare[] = [];
const MOCK_MENTOR: Mentor | null = null;
const MOCK_PARTNER: Partner | null = null;
const MOCK_USER = {
  name: "You",
  currentStreak: 5,
  weeklyActivity: [1, 2, 1, 0, 1, 2, 1],
};

function formatDate(date: string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export default function SharingPage() {
  const router = useRouter();
  const [shares, setShares] = React.useState<ActiveShare[]>(MOCK_SHARES);
  const [mentor, setMentor] = React.useState<Mentor | null>(MOCK_MENTOR);
  const [partner, setPartner] = React.useState<Partner | null>(MOCK_PARTNER);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [showInviteMentor, setShowInviteMentor] = React.useState(false);
  const [showInvitePartner, setShowInvitePartner] = React.useState(false);
  const [showDiscordSetup, setShowDiscordSetup] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [discordWebhook, setDiscordWebhook] = React.useState("");
  const [revokeTarget, setRevokeTarget] = React.useState<string | null>(null);

  const handleCopyLink = async (share: ActiveShare) => {
    const url = `${window.location.origin}/share/${share.slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(share.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleRevoke = async (shareId: string) => {
    // API call would go here
    setShares((prev) => prev.filter((s) => s.id !== shareId));
    setRevokeTarget(null);
  };

  const handleInviteMentor = async () => {
    if (!inviteEmail.trim()) return;
    // API call would go here
    console.log("Inviting mentor:", inviteEmail);
    setShowInviteMentor(false);
    setInviteEmail("");
  };

  const handleInvitePartner = async () => {
    if (!inviteEmail.trim()) return;
    // API call would go here
    console.log("Inviting partner:", inviteEmail);
    setShowInvitePartner(false);
    setInviteEmail("");
  };

  const handleSaveDiscord = async () => {
    if (!discordWebhook.trim()) return;
    // API call would go here
    console.log("Setting Discord webhook:", discordWebhook);
    setShowDiscordSetup(false);
  };

  const handleNudgePartner = async (partnerId: string) => {
    // API call would go here
    console.log("Nudging partner:", partnerId);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Sharing
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Active Share Links */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Active Share Links
            </h2>
            <Badge variant="outline">{shares.length}</Badge>
          </div>

          {shares.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-center">
              <Link2 className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400">
                No active share links yet.
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">
                Share entries from the journal to create links.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50"
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 flex-1 mr-3">
                      {share.entryPreview}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleCopyLink(share)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Copy link"
                      >
                        {copiedId === share.id ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setRevokeTarget(share.id)}
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Revoke link"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span>{share.viewCount} views</span>
                    <span>Created {formatDate(share.createdAt)}</span>
                    {share.expiresAt && (
                      <span>Expires {formatDate(share.expiresAt)}</span>
                    )}
                    {share.isPasswordProtected && (
                      <Badge variant="outline" className="text-xs">
                        Password
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Mentor Relationship */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
            Mentor
          </h2>

          {mentor ? (
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
              <div className="flex items-center gap-4">
                {mentor.avatarUrl ? (
                  <img
                    src={mentor.avatarUrl}
                    alt={mentor.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                    {mentor.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    {mentor.name}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Connected {formatDate(mentor.connectedAt)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="min-h-[44px]"
                  onClick={() => router.push("/sharing/mentor-access")}
                >
                  Manage
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-center">
              <UserPlus className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Connect with a mentor for guidance on your trading journey.
              </p>
              <Button
                onClick={() => setShowInviteMentor(true)}
                className="min-h-[44px]"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Mentor
              </Button>
            </div>
          )}
        </section>

        {/* Accountability Partner */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
            Accountability Partner
          </h2>

          {partner ? (
            <AccountabilityWidget
              user={MOCK_USER}
              partner={partner}
              onNudge={handleNudgePartner}
            />
          ) : (
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-center">
              <Users className="h-8 w-8 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Pair up with a partner to stay accountable and motivated.
              </p>
              <Button
                onClick={() => setShowInvitePartner(true)}
                className="min-h-[44px]"
              >
                <Users className="h-4 w-4 mr-2" />
                Invite Partner
              </Button>
            </div>
          )}
        </section>

        {/* Discord Integration */}
        <section>
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">
            Notifications
          </h2>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <Bell className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Discord Webhook
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Get notified in Discord when you reach milestones
                </p>
              </div>
              <Button
                variant="outline"
                className="min-h-[44px]"
                onClick={() => setShowDiscordSetup(true)}
              >
                Setup
              </Button>
            </div>
          </div>
        </section>

        {/* Mentor Dashboard Link (for mentors) */}
        <section>
          <Button
            variant="outline"
            className="w-full min-h-[48px]"
            onClick={() => router.push("/sharing/mentor")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Mentor Dashboard
          </Button>
        </section>
      </div>

      {/* Invite Mentor Dialog */}
      <Dialog open={showInviteMentor} onOpenChange={setShowInviteMentor}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a Mentor</DialogTitle>
            <DialogDescription>
              Enter your mentor&apos;s email address. They&apos;ll receive an invitation to
              connect with you.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="mentor-email" className="sr-only">
              Mentor Email
            </Label>
            <Input
              id="mentor-email"
              type="email"
              placeholder="mentor@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="min-h-[48px]"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowInviteMentor(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInviteMentor}
              disabled={!inviteEmail.trim()}
              className="min-h-[44px]"
            >
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invite Partner Dialog */}
      <Dialog open={showInvitePartner} onOpenChange={setShowInvitePartner}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite a Partner</DialogTitle>
            <DialogDescription>
              Enter your partner&apos;s email address to start an accountability
              partnership.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="partner-email" className="sr-only">
              Partner Email
            </Label>
            <Input
              id="partner-email"
              type="email"
              placeholder="partner@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="min-h-[48px]"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowInvitePartner(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvitePartner}
              disabled={!inviteEmail.trim()}
              className="min-h-[44px]"
            >
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discord Setup Dialog */}
      <Dialog open={showDiscordSetup} onOpenChange={setShowDiscordSetup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Discord Webhook Setup</DialogTitle>
            <DialogDescription>
              Create a webhook in your Discord server and paste the URL here to
              receive notifications.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="discord-webhook" className="text-sm font-medium mb-2 block">
              Webhook URL
            </Label>
            <Input
              id="discord-webhook"
              type="url"
              placeholder="https://discord.com/api/webhooks/..."
              value={discordWebhook}
              onChange={(e) => setDiscordWebhook(e.target.value)}
              className="min-h-[48px]"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDiscordSetup(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveDiscord}
              disabled={!discordWebhook.trim()}
              className="min-h-[44px]"
            >
              Save Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <Dialog
        open={!!revokeTarget}
        onOpenChange={(open) => !open && setRevokeTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke Share Link?</DialogTitle>
            <DialogDescription>
              This will permanently delete the share link. Anyone with the link
              will no longer be able to access the content.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setRevokeTarget(null)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => revokeTarget && handleRevoke(revokeTarget)}
              className="min-h-[44px]"
            >
              Revoke Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
