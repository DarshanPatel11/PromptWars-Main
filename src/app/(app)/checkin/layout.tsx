import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daily Check-in",
  description: "Log your mood, energy, and journal entry for AI-powered wellness analysis.",
};

export default function CheckInLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
