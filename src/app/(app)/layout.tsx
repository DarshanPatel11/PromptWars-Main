/**
 * MindCompass AI — App Shell Layout
 *
 * Wraps all authenticated pages with the sidebar navigation.
 * clean architecture: layout concerns are separated from page content.
 * accessible semantic HTML: landmark regions (<nav>, <main>).
 * responsive viewport framework: sidebar collapses to icon-only on mobile.
 * Server Component: fetches user profile on the server for fast first paint.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/Sidebar";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Server Component — validates session and fetches user profile.
 * asynchronous handling: awaits Supabase server client initialization.
 */
export default async function AppLayout({ children }: AppLayoutProps) {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("name, exam_type, exam_date")
    .eq("user_id", user.id)
    .single();

  // If no profile, redirect to onboarding
  if (!profile) {
    redirect("/onboarding");
  }

  return (
    /*
     * accessible semantic HTML: grid layout with named regions.
     * responsive viewport framework: 260px sidebar + fluid main content.
     */
    <div className="app-layout">
      {/* accessible semantic HTML: <nav> landmark for sidebar */}
      <Sidebar
        userName={profile.name}
        examType={profile.exam_type}
        examDate={profile.exam_date}
      />

      {/* accessible semantic HTML: <main> landmark for content area */}
      <main
        id="main-content"
        className="overflow-y-auto pt-20 md:pt-0"
        style={{ background: "var(--bg-primary)" }}
      >
        {children}
      </main>
    </div>
  );
}
