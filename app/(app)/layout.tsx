import { AdvisoryOverlay } from "@/components/AdvisoryOverlay";
import { DonePanel } from "@/components/DonePanel";
import { FeedProvider } from "@/components/FeedProvider";
import { Sidebar } from "@/components/Sidebar";
import { Toast } from "@/components/Toast";

// Chrome de l'app : sidebar + flux SSE partagé + overlays globaux
// (advisory, enchère terminée, toast) — visibles depuis toutes les pages.

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeedProvider>
      <div className="flex h-screen overflow-hidden bg-night text-[14px] text-white">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
      </div>
      <AdvisoryOverlay />
      <DonePanel />
      <Toast />
    </FeedProvider>
  );
}
