import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

/** Fake identity used by `next dev`, where the Web Chat skips Sign in with Vercel. */
export const DEV_USER: CurrentUser = {
  id: "local-dev",
  name: "Dev local",
  email: "dev@localhost",
  image: null,
};

export const isDevelopment = process.env.NODE_ENV === "development";

/** The signed-in Vercel user for this request, or `null`. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isDevelopment) return DEV_USER;
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? null,
  };
}
