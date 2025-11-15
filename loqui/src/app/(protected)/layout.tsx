"use client";

import AppSidebar from "@/components/app-sidebar";
import { Sidebar, SidebarFooter, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { data } from "@/app/data";
import { NavUser } from "@/components/nav-user";
import { ProtectedRoute, useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ProtectedRoute>
      <ProtectedLayoutContent>{children}</ProtectedLayoutContent>
    </ProtectedRoute>
  );
}

function ProtectedLayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar items={data.navMain} />
        <SidebarFooter>
          <div className="flex flex-col gap-2 px-2 pb-2">
            <div className="flex justify-center">
              <ThemeToggle />
            </div>
            <NavUser 
              user={user ? {
                name: user.username,
                email: user.email,
                avatar: "", // No avatar from backend yet
              } : data.user} 
            />
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex items-center justify-between gap-2 border-b p-2 md:hidden">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="size-8" />
            <span className="font-semibold">Menu</span>
          </div>
          <ThemeToggle />
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}


