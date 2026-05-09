import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { routes } from "@/data/sidebarData";
import { NavUser } from "./NavUser";
import { useAppSelector } from "@/slice/hook";
import {
  Anchor,
  LayoutDashboard,
  Users,
  Ship,
  Wrench,
  ShieldAlert,
  Settings,
  UserCog,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  "/admin-management": UserCog,
  "/adminDashboard": LayoutDashboard,
  "/userDashboard": LayoutDashboard,
  "/ships": Ship,
  "/maintenance": Wrench,
  "/drills": ShieldAlert,
  "/setting": Settings,
};

export function AppSidebar({ ...props }) {
  const user = useAppSelector((state) => state.auth.user);
  const location = useLocation();

  if (!user) return null;

  const filteredRoutes = routes.filter((route) =>
    route.allowedRoles.includes(user.role)
  );

  const homeUrl =
    user.role === "superAdmin"
      ? "/admin-management"
      : user.role === "admin"
      ? "/adminDashboard"
      : "/userDashboard";

  return (
    <Sidebar {...props} className="">
      {/* Deep navy sidebar background */}
      <div
        className="h-full flex flex-col"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.11 0.04 248) 0%, oklch(0.09 0.03 245) 100%)",
          color: "oklch(0.88 0.02 215)",
        }}
      >
        {/* ── Header ── */}
        <SidebarHeader className="border-b border-white/8 pb-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link
                  to={homeUrl}
                  className="flex items-center gap-3 px-2 py-1 group"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl icon-teal shadow-lg shadow-teal-900/30 shrink-0">
                    <Anchor className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col leading-tight">
                    <span className="text-sm font-bold text-white tracking-wide">
                      Maritime Ops
                    </span>
                    <span className="text-[11px] text-white/40 capitalize">
                      {user.role === "superAdmin"
                        ? "Super Admin"
                        : user.role === "admin"
                        ? "Administrator"
                        : "Crew Member"}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* ── Nav Items ── */}
        <SidebarContent className="flex-1 py-2">
          <SidebarGroup>
            <p className="px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
              Navigation
            </p>
            <SidebarMenu className="gap-0.5 px-2">
              {filteredRoutes.map((item) => {
                const Icon = ICON_MAP[item.url] || Users;
                const isActive = location.pathname === item.url;
                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild>
                      <Link
                        to={item.url}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                          isActive
                            ? "text-white shadow-sm"
                            : "text-white/60 hover:text-white hover:bg-white/8"
                        }`}
                        style={
                          isActive
                            ? {
                                background:
                                  "linear-gradient(135deg, oklch(0.55 0.18 195 / 30%), oklch(0.42 0.15 220 / 20%))",
                                borderLeft: "3px solid oklch(0.55 0.18 195)",
                              }
                            : {}
                        }
                      >
                        <Icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? "text-[oklch(0.7_0.15_195)]" : "text-white/40"
                          }`}
                        />
                        <span>{item.title}</span>
                        {isActive && (
                          <div className="ml-auto h-1.5 w-1.5 rounded-full bg-[oklch(0.7_0.15_195)]" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        {/* ── Footer ── */}
        <SidebarFooter className="border-t border-white/8 pt-2">
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </div>
    </Sidebar>
  );
}
