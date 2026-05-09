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
import { Separator } from "./ui/separator";
import { NavUser } from "./NavUser";
import { useAppSelector } from "@/slice/hook";
import { Anchor } from "lucide-react";

export function AppSidebar({ ...props }) {
  const user = useAppSelector((state) => state.auth.user);

  const location = useLocation();

  if (!user) return null;

  const filteredRoutes = routes.filter((route) =>
    route.allowedRoles.includes(user.role)
  );
  return (
    <Sidebar {...props} className="">
      <div className="h-full bg-white text-black flex flex-col">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <Link to={user.role === "superAdmin" ? "/admin-management" : user.role === "admin" ? "/adminDashboard" : "/userDashboard"} className="flex items-center gap-2 px-2">
                  <Anchor className="h-5 w-5" />
                  <span className="font-semibold">Maritime Ops</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <Separator />

        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu className="gap-2">
              {filteredRoutes.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    className="text-md px-4 rounded-md"
                  >
                    <Link
                      to={item.url}
                      className={`font-medium transition-colors ${location.pathname === item.url
                          ? "bg-gray-300 text-black"
                          : "text-black hover:text-gray"
                        }`}
                    >
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <NavUser />
        </SidebarFooter>
        <SidebarRail />
      </div>
    </Sidebar>
  );
}
