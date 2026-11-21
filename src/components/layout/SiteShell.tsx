import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/** Public / customer shell: header, page, footer, chatbot launcher. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-paper focus:px-3 focus:py-2">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <ChatWidget />
    </>
  );
}
