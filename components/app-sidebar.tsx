"use client";
import { BarChart2, MapPin } from "lucide-react";
import { useSession } from "next-auth/react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { CompanyLogo } from "@/components/company-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "";
  const isAdmin = role !== "employee";

  const salesSubItems = [
    ...(isAdmin ? [{ title: "Area Customer Sales", url: "/sales" }] : []),
    { title: "Outlet Map", url: "/sales/map" },
  ];

  const navMain = [
    {
      title: "Sales",
      url: "#",
      icon: BarChart2,
      isActive: true,
      items: salesSubItems,
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <CompanyLogo />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
