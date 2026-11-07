import { redirect } from "next/navigation";

/** Conversations now live under /agents/[id]/s. */
export default function LegacySessionsPage() {
  redirect("/agents");
}
