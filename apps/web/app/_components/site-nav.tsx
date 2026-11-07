import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { MangoMark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { getCurrentUser, isDevelopment } from "@/lib/current-user";
import { Avatar } from "./avatar";
import { SignInButton } from "./sign-in-button";
import { AccountControl } from "./web-chat-auth";

export async function SiteNav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 h-14 border-line border-b bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link className="flex items-center gap-2 text-ink" href="/">
          <MangoMark size={26} />
          <span className="font-semibold text-xl leading-none">mango</span>
        </Link>

        <nav className="ml-1 flex items-center">
          <Button asChild size="sm" variant="ghost">
            <Link href="/agents">Agentes</Link>
          </Button>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {/* Secondary: cada pantalla tiene su propia (única) acción mango. */}
          <Button asChild size="sm" variant="secondary">
            <Link href="/agents/new">
              <PlusIcon className="size-4" strokeWidth={2.4} />
              Crear
            </Link>
          </Button>
          {user ? (
            isDevelopment ? (
              <span className="flex items-center gap-2 text-ink-3 text-xs">
                <Avatar name={user.name} className="size-7" />
                <span className="sr-only">{user.name}</span>
              </span>
            ) : (
              <AccountControl email={user.email} image={user.image} name={user.name} />
            )
          ) : (
            <SignInButton />
          )}
        </div>
      </div>
    </header>
  );
}
