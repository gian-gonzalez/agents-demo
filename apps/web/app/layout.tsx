import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SiteNav } from "./_components/site-nav";
import "./globals.css";

/** Una sola familia tipográfica: Archivo, pesos 400 / 600 / 700. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "mango · agentes",
    template: "%s · mango",
  },
  description:
    "Tu plata, tus reglas. Creá tu agente de plata y mirá cómo opera solo sobre una cuenta belo de prueba: ejecuta en automático, dentro de los límites que le ponés.",
};

export const viewport: Viewport = {
  themeColor: "#FAF8F2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html className={archivo.variable} lang="es">
      <body className="flex min-h-dvh flex-col bg-paper text-ink">
        <TooltipProvider>
          {/* Mobile-first: una columna en el celular; cada página fija su contenedor (max-w-6xl) en desktop. */}
          <div className="flex min-h-dvh w-full flex-1 flex-col bg-paper">
            <SiteNav />
            {children}
          </div>
        </TooltipProvider>
      </body>
    </html>
  );
}
