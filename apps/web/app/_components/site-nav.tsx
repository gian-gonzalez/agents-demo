import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser, isDevelopment } from "@/lib/current-user";
import { Avatar } from "./avatar";
import { SignInButton } from "./sign-in-button";
import { AccountControl } from "./web-chat-auth";

export async function SiteNav() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 h-14 border-border border-b bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link className="flex items-center gap-2 font-mono text-sm tracking-tight" href="/">
          <span aria-hidden="true" className="size-2 rounded-sm bg-primary" />
          <span className="font-medium">belo</span>
          <span className="text-muted-foreground">agentic</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link className="rounded-md px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground" href="/agents">
            Agentes
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Button asChild size="sm">
            <Link href="/agents/new">
              <PlusIcon className="size-4" />
              <span className="hidden sm:inline">Crear agente</span>
              <span className="sm:hidden">Crear</span>
            </Link>
          </Button>
          {user ? (
            isDevelopment ? (
              <span className="flex items-center gap-2 font-mono text-muted-foreground text-xs">
                <Avatar name={user.name} className="size-6" />
                <span className="hidden sm:inline">{user.name}</span>
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
