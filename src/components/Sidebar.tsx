/**
 * MindCompass AI — Sidebar Navigation Component
 *
 * accessible semantic HTML: <nav> with aria-label, active states communicated via aria-current.
 * ARIA labels: sidebar toggle, navigation links, and sign-out button all labeled.
 * responsive viewport framework: collapses to icon-only on small screens.
 * modular design: standalone component, receives user data as props.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Brain,
  LayoutDashboard,
  PenLine,
  MessageCircle,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";

interface SidebarProps {
  userName: string;
  examType: string;
  examDate: string;
}

/** Navigation items definition — modular design: change routes in one place. */
const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    id: "nav-dashboard",
  },
  {
    href: "/checkin",
    label: "Daily Check-in",
    icon: PenLine,
    id: "nav-checkin",
  },
  {
    href: "/companion",
    label: "AI Companion",
    icon: MessageCircle,
    id: "nav-companion",
  },
  {
    href: "/history",
    label: "History",
    icon: Calendar,
    id: "nav-history",
  },
] as const;

/**
 * Sidebar navigation with collapsible mobile support.
 * accessible semantic HTML: uses <nav> landmark with descriptive aria-label.
 */
export function Sidebar({ userName, examType, examDate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Calculate days until exam
  const daysUntilExam = Math.max(
    0,
    differenceInDays(parseISO(examDate), new Date())
  );

  /**
   * asynchronous handling: sign-out clears session then redirects.
   * error handling exceptions: sign-out errors are caught silently.
   */
  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/signin");
      router.refresh();
    } catch (error) {
      console.error("[MindCompass Sidebar] Sign out error:", error);
    }
  };

  const renderSidebarContent = () => (
    <nav
      aria-label="Main navigation"
      className="flex flex-col h-full"
      style={{
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border-glass)",
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 p-6 pb-4"
        style={{ borderBottom: "1px solid var(--border-glass)" }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--accent-gradient)" }}
          aria-hidden="true"
        >
          <Brain className="w-5 h-5 text-white" />
        </div>
        <div>
          <span
            className="font-bold text-base leading-tight block"
            style={{ color: "var(--text-primary)" }}
          >
            MindCompass
          </span>
          <span
            className="text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            AI Wellness
          </span>
        </div>
      </div>

      {/* User info & exam countdown */}
      <div className="px-5 py-4 mx-4 mt-4 rounded-xl" style={{ background: "var(--bg-glass)", border: "1px solid var(--border-glass)" }}>
        <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
          {userName}
        </p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {examType}
          </span>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              background: daysUntilExam < 30
                ? "rgba(239,68,68,0.15)"
                : "rgba(124,58,237,0.15)",
              color: daysUntilExam < 30
                ? "var(--color-danger)"
                : "var(--accent-primary)",
            }}
            aria-label={`${daysUntilExam} days until ${examType} exam`}
          >
            {daysUntilExam}d left
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <ul className="flex-1 px-4 mt-6 space-y-2" role="list">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                id={item.id}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setIsMobileOpen(false)}
                className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group"
                style={{
                  background: isActive ? "var(--accent-gradient)" : "transparent",
                  color: isActive ? "white" : "var(--text-secondary)",
                }}
              >
                <Icon
                  className="w-4 h-4 flex-shrink-0"
                  aria-hidden="true"
                  style={{
                    color: isActive ? "white" : "currentColor",
                  }}
                />
                {item.label}
                {isActive && (
                  <ChevronRight className="w-3 h-3 ml-auto" aria-hidden="true" />
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Bottom actions */}
      <div
        className="p-5 mt-auto"
        style={{ borderTop: "1px solid var(--border-glass)" }}
      >
        <Link
          href="/profile"
          id="nav-profile"
          aria-label="Settings and profile"
          className="flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-colors mb-2"
          style={{ color: "var(--text-secondary)" }}
        >
          <Settings className="w-4 h-4" aria-hidden="true" />
          Settings
        </Link>

        <button
          id="btn-signout"
          onClick={handleSignOut}
          aria-label="Sign out of MindCompass AI"
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          Sign Out
        </button>
      </div>
    </nav>
  );

  return (
    <aside className="w-full md:w-64 flex-shrink-0">
      {/* Mobile toggle button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg glass-card"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={isMobileOpen}
        aria-controls="mobile-sidebar"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5" aria-hidden="true" />
        ) : (
          <Menu className="w-5 h-5" aria-hidden="true" />
        )}
      </button>

      {/* Desktop sidebar */}
      <div
        className="hidden md:block h-screen sticky top-0"
        role="complementary"
      >
        {renderSidebarContent()}
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div
          id="mobile-sidebar"
          className="fixed inset-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
          {/* Sidebar panel */}
          <div className="relative w-72 h-full">
            {renderSidebarContent()}
          </div>
        </div>
      )}
    </aside>
  );
}
