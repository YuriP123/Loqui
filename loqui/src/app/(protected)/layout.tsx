import AppSidebar from "@/components/app-sidebar";
import { Sidebar, SidebarFooter, SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { data } from "@/app/data";
import { NavUser } from "@/components/nav-user";

export default function ProtectedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar items={data.navMain} />
        <SidebarFooter>
          <NavUser user={data.user} />
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


