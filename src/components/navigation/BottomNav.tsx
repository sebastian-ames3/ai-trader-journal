"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Plus,
  LucideIcon,
  TrendingUp,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { hapticLight, hapticMedium } from "@/lib/haptics";
import { useViewTransitionRouter } from "@/lib/useViewTransition";
import { QuickCapture } from "@/components/QuickCapture";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive: boolean;
  onNavigate: (href: string) => void;
}

function NavItem({ icon: Icon, label, href, isActive, onNavigate }: NavItemProps) {
  return (
    <button
      onClick={() => { hapticLight(); onNavigate(href); }}
      className={cn(
        "flex flex-col items-center justify-center",
        "flex-1 h-full",
        "transition-all duration-200",
        "active:scale-90",
        isActive
          ? "text-amber-500"
          : "text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
      )}
    >
      <Icon
        className={cn(
          "h-6 w-6 mb-0.5",
          "transition-transform duration-200",
          isActive && "scale-110"
        )}
      />
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const { push } = useViewTransitionRouter();
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  // Hide navigation on public/unauthenticated pages
  if (pathname === '/login' || pathname === '/offline' || pathname?.startsWith('/share/')) {
    return null;
  }

  const leftNavItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: BookOpen, label: "Journal", href: "/journal" },
  ];

  const rightNavItems = [
    { icon: TrendingUp, label: "Theses", href: "/theses" },
    { icon: MessageSquare, label: "Coach", href: "/coach" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        {/* Backdrop blur container */}
        <div className="relative">
          {/* Center FAB - positioned above the bar */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-14 z-50">
            <button
              onClick={() => { hapticMedium(); setIsQuickCaptureOpen(true); }}
              className={cn(
                "h-14 w-14 rounded-full",
                "bg-amber-500 hover:bg-amber-600",
                "text-white",
                "shadow-lg shadow-amber-500/40",
                "flex items-center justify-center",
                "transition-all duration-200",
                "active:scale-95",
                "btn-interactive"
              )}
              aria-label="Create new entry"
            >
              <Plus className="h-7 w-7" />
            </button>
          </div>

          {/* Nav bar */}
          <div
            className={cn(
              "bg-white/90 dark:bg-background/80",
              "backdrop-blur-xl",
              "border-t border-slate-200/20 dark:border-white/[0.06]",
              "pb-safe"
            )}
          >
            <div className="flex items-center w-full h-16 px-4">
              {/* Left items */}
              {leftNavItems.map((item) => (
                <NavItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  onNavigate={push}
                  isActive={
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href))
                  }
                />
              ))}

              {/* Center spacer for FAB */}
              <div className="flex-1" />

              {/* Right items */}
              {rightNavItems.map((item) => (
                <NavItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  onNavigate={push}
                  isActive={
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href))
                  }
                />
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Quick Capture Modal */}
      <QuickCapture
        isOpen={isQuickCaptureOpen}
        onClose={() => setIsQuickCaptureOpen(false)}
      />
    </>
  );
}
