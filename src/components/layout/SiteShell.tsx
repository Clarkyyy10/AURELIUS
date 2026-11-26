import { ChatWidget } from "@/components/chatbot/ChatWidget";
import { IS_API } from "@/lib/data/source";
import { DemoBar } from "./DemoBar";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/** Public / customer shell: header, page, footer, chatbot launcher. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-sm focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to main content
      </a>
      <SiteHeader />
      {!IS_API && <DemoBar />}
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <ChatWidget />
    </>
  );
}
