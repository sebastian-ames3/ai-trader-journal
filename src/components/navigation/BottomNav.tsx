"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  BarChart3,
  Settings,
  Plus,
  LucideIcon,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickCapture } from "@/components/QuickCapture";

interface NavItemProps {
  icon: LucideIcon;
  label: string;
  href: string;
  isActive: boolean;
}

function NavItem({ icon: Icon, label, href, isActive }: NavItemProps) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center",
        "h-full px-3 min-w-[56px]",
        "transition-all duration-200",
        isActive
          ? "text-amber-500"
          : "text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
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
    </Link>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);

  // Hide navigation on login page
  if (pathname === '/login') {
    return null;
  }

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: BookOpen, label: "Journal", href: "/journal" },
    // Center FAB placeholder
    { icon: TrendingUp, label: "Theses", href: "/theses" },
    { icon: BarChart3, label: "Insights", href: "/insights" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden">
        {/* Backdrop blur container */}
        <div className="relative">
          {/* Center FAB - positioned above the bar */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-7 z-50">
            <button
              onClick={() => setIsQuickCaptureOpen(true)}
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
              "bg-white/90 dark:bg-slate-900/90",
              "backdrop-blur-xl",
              "border-t border-slate-200/20 dark:border-white/5",
              "pb-safe"
            )}
          >
            <div className="flex items-center justify-around h-16 max-w-md mx-auto">
              {navItems.slice(0, 2).map((item) => (
                <NavItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  isActive={
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href))
                  }
                />
              ))}

              {/* Spacer for center FAB */}
              <div className="w-14" aria-hidden="true" />

              {navItems.slice(2).map((item) => (
                <NavItem
                  key={item.href}
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
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
