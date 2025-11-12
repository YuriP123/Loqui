"use client";

import AppSidebar from "@/components/app-sidebar";
import { Sidebar, SidebarFooter, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { data } from "@/app/data";
import { NavUser } from "@/components/nav-user";
import { ProtectedRoute, useAuth } from "@/contexts/auth-context";

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
          <NavUser 
            user={user ? {
              name: user.username,
              email: user.email,
              avatar: "", // No avatar from backend yet
            } : data.user} 
          />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <div className="flex items-center gap-2 border-b p-2 md:hidden">
          <SidebarTrigger className="size-8" />
          <span className="font-semibold">Menu</span>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}


