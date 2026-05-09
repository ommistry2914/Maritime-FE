import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Outlet, useLocation } from "react-router-dom";
import { routes } from "./data/sidebarData";
import { Bell } from "lucide-react";

export default function Layout() {
  const location = useLocation();
  const currentRoute = routes.find((r) => r.url === location.pathname);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-screen">
        {/* ── Top Header Bar ── */}
        <header
          className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 px-4"
          style={{
            background: "oklch(1 0 0 / 85%)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid oklch(0.88 0.015 220 / 70%)",
            boxShadow: "0 1px 12px oklch(0.13 0.04 245 / 6%)",
          }}
        >
          <SidebarTrigger
            className="-ml-1 rounded-lg transition-colors hover:bg-muted"
          />
          <Separator
            orientation="vertical"
            className="mr-1 data-[orientation=vertical]:h-5"
          />

          {/* Page Title */}
          <div className="flex-1">
            <h1 className="text-base font-semibold tracking-tight text-foreground">
              {currentRoute ? currentRoute.title : "Maritime Ops"}
            </h1>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-2">
            <button
              className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-colors hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className="h-4.5 w-4.5 text-muted-foreground" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[oklch(0.55_0.18_195)]" />
            </button>
          </div>
        </header>

        {/* ── Page Content ── */}
        <div className="flex flex-1 flex-col overflow-y-auto p-6 page-enter">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
