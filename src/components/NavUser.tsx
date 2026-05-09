import { ChevronsUpDown, LogOut, Settings } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAppDispatch, useAppSelector } from "@/slice/hook";
import { logout } from "@/slice/auth.slice";

export function NavUser() {
  const { isMobile } = useSidebar();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);

  const firstName = user?.firstName || "";
  const lastName = user?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = (firstName?.[0] || "") + (lastName?.[0] || "");

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="rounded-xl transition-colors hover:bg-white/8 data-[state=open]:bg-white/10"
            >
              {/* Avatar */}
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white shadow-sm"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.55 0.18 195), oklch(0.42 0.15 220))",
                }}
              >
                {initials.toUpperCase() || "?"}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-white">
                  {fullName || "User"}
                </span>
                <span className="truncate text-xs text-white/50">
                  {user?.email}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto h-4 w-4 text-white/40" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-xl border-border shadow-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, oklch(0.55 0.18 195), oklch(0.42 0.15 220))",
                  }}
                >
                  {initials.toUpperCase() || "?"}
                </div>
                <div className="grid flex-1 leading-tight">
                  <span className="truncate text-sm font-semibold">
                    {fullName}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 rounded-lg mx-1 cursor-pointer"
              asChild
            >
              <a href="/setting">
                <Settings className="h-4 w-4 text-muted-foreground" />
                Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="gap-2 rounded-lg mx-1 mb-1 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
