"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Shield,
  Trash2,
  UserMinus,
  Eye,
  BarChart2,
  FileText,
  DollarSign,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface Mentor {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  connectedAt: Date | string;
}

interface SharedEntry {
  id: string;
  entryId: string;
  content: string;
  type: string;
  sharedAt: Date | string;
  viewCount: number;
}

interface MentorPermissions {
  weeklyInsights: boolean;
  biasPatterns: boolean;
  entries: boolean;
  profitLoss: boolean;
}

interface MentorAccessProps {
  mentor: Mentor | null;
  permissions: MentorPermissions;
  sharedEntries: SharedEntry[];
  onUpdatePermissions: (permissions: MentorPermissions) => Promise<void>;
  onUnshareEntry: (shareId: string) => Promise<void>;
  onDisconnect: () => Promise<void>;
  className?: string;
}

function formatSharedDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

const PERMISSION_ITEMS = [
  {
    key: "weeklyInsights" as const,
    icon: BarChart2,
    label: "Weekly Insights",
    description: "Allow mentor to see your weekly insight summaries",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  },
  {
    key: "biasPatterns" as const,
    icon: Eye,
    label: "Bias Patterns",
    description: "Share detected cognitive biases and patterns",
    color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  },
  {
    key: "entries" as const,
    icon: FileText,
    label: "Journal Entries",
    description: "Allow access to entries you explicitly share",
    color: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  },
  {
    key: "profitLoss" as const,
    icon: DollarSign,
    label: "P/L Information",
    description: "Include profit/loss details in shared content",
    color: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
  },
];

export function MentorAccess({
  mentor,
  permissions,
  sharedEntries,
  onUpdatePermissions,
  onUnshareEntry,
  onDisconnect,
  className,
}: MentorAccessProps) {
  const [localPermissions, setLocalPermissions] =
    React.useState<MentorPermissions>(permissions);
  const [isUpdating, setIsUpdating] = React.useState(false);
  const [showDisconnectDialog, setShowDisconnectDialog] = React.useState(false);
  const [isDisconnecting, setIsDisconnecting] = React.useState(false);
  const [unshareTarget, setUnshareTarget] = React.useState<string | null>(null);

  // Track if permissions have changed
  const hasChanges = React.useMemo(() => {
    return Object.keys(permissions).some(
      (key) =>
        localPermissions[key as keyof MentorPermissions] !==
        permissions[key as keyof MentorPermissions]
    );
  }, [localPermissions, permissions]);

  const handlePermissionChange = (
    key: keyof MentorPermissions,
    value: boolean
  ) => {
    setLocalPermissions((prev) => ({ ...prev, [key]: value }));
  };

  const handleSavePermissions = async () => {
    setIsUpdating(true);
    try {
      await onUpdatePermissions(localPermissions);
    } catch (error) {
      console.error("Failed to update permissions:", error);
      // Revert on error
      setLocalPermissions(permissions);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await onDisconnect();
      setShowDisconnectDialog(false);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleUnshare = async (shareId: string) => {
    try {
      await onUnshareEntry(shareId);
      setUnshareTarget(null);
    } catch (error) {
      console.error("Failed to unshare entry:", error);
    }
  };

  // No mentor connected
  if (!mentor) {
    return (
      <div className={cn("text-center py-12", className)}>
        <div className="text-6xl mb-4">🎓</div>
        <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
          No Mentor Connected
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto">
          Connect with a mentor to get guidance on your trading psychology
          journey.
        </p>
        <Button className="min-h-[48px]">Invite a Mentor</Button>
      </div>
    );
  }

  const initials = mentor.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("space-y-6", className)}>
      {/* Mentor Info Card */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
        <div className="flex items-center gap-4">
          {mentor.avatarUrl ? (
            // External avatar URL - Next/Image would require domain configuration
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={mentor.avatarUrl}
              alt={mentor.name}
              className="w-14 h-14 rounded-full object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
              {initials}
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
              {mentor.name}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Connected{" "}
              {formatDistanceToNow(
                typeof mentor.connectedAt === "string"
                  ? new Date(mentor.connectedAt)
                  : mentor.connectedAt,
                { addSuffix: true }
              )}
            </p>
          </div>
          <Badge variant="outline" className="text-green-600 border-green-200">
            <Shield className="h-3 w-3 mr-1" />
            Active
          </Badge>
        </div>
      </div>

      {/* Permission Toggles */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Permissions
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setLocalPermissions(permissions)}
            disabled={!hasChanges}
          >
            Reset
          </Button>
        </div>

        <div className="space-y-3">
          {PERMISSION_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", item.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <Label
                      htmlFor={`perm-${item.key}`}
                      className="font-medium cursor-pointer"
                    >
                      {item.label}
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={`perm-${item.key}`}
                  checked={localPermissions[item.key]}
                  onCheckedChange={(checked) =>
                    handlePermissionChange(item.key, checked)
                  }
                />
              </div>
            );
          })}
        </div>

        {hasChanges && (
          <Button
            onClick={handleSavePermissions}
            disabled={isUpdating}
            className="w-full min-h-[44px] bg-amber-500 hover:bg-amber-600 text-white"
          >
            {isUpdating ? "Saving..." : "Save Changes"}
          </Button>
        )}
      </div>

      {/* Shared Entries */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Shared Entries ({sharedEntries.length})
        </h3>

        {sharedEntries.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
            No entries shared with this mentor yet.
          </p>
        ) : (
          <div className="space-y-2">
            {sharedEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                    {entry.content}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Shared {formatSharedDate(entry.sharedAt)} • {entry.viewCount}{" "}
                    views
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] min-w-[44px] text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => setUnshareTarget(entry.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button
          variant="outline"
          className="flex-1 min-h-[44px]"
          onClick={() => {/* Navigate to manage access */}}
        >
          <Settings className="h-4 w-4 mr-2" />
          Manage Access
        </Button>
        <Button
          variant="outline"
          className="flex-1 min-h-[44px] text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20"
          onClick={() => setShowDisconnectDialog(true)}
        >
          <UserMinus className="h-4 w-4 mr-2" />
          Disconnect
        </Button>
      </div>

      {/* Disconnect Confirmation Dialog */}
      <Dialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect from Mentor?</DialogTitle>
            <DialogDescription>
              This will revoke {mentor.name}&apos;s access to all shared content and
              remove the mentor relationship. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="min-h-[44px]"
            >
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unshare Confirmation Dialog */}
      <Dialog
        open={!!unshareTarget}
        onOpenChange={(open) => !open && setUnshareTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unshare Entry?</DialogTitle>
            <DialogDescription>
              This will revoke your mentor&apos;s access to this entry. They will no
              longer be able to view it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setUnshareTarget(null)}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => unshareTarget && handleUnshare(unshareTarget)}
              className="min-h-[44px]"
            >
              Unshare
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
