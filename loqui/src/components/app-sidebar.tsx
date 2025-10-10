import { IconCirclePlusFilled, type Icon } from "@tabler/icons-react";
import Link from "next/link";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import NavMain from "./nav-main";

export default function AppSidebar({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  return (
    <SidebarGroup>
      <span className="text-white text-2xl font-bold py-4">Loqui</span>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <Link href="/lab" className="w-full">
              <SidebarMenuButton
                tooltip="Create New Generation"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear w-full"
              >
                <IconCirclePlusFilled />
                <span>Create New</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <NavMain items={items} />
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
