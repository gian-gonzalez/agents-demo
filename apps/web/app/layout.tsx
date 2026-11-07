import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SiteNav } from "./_components/site-nav";
import "./globals.css";

const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: "variable",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "belo agentic · agentes",
    template: "%s · belo agentic",
  },
  description: "La capa bancaria para agentes (& humanos). Creá tu agente y mirá cómo opera: el agente propone, la persona decide.",
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html className={cn(sans.variable, mono.variable, "dark")} lang="es">
      <body className="flex min-h-dvh flex-col">
        <TooltipProvider>
          <SiteNav />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
