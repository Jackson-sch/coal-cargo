import { AppSidebar } from "@/components/app-sidebar";
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb";
import { SucursalContextCompact } from "@/components/sucursal-context";
import ThemeSelector from "@/components/theme-selector";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NuqsAdapterWrapper } from "@/components/nuqs-adapter";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function DashboardLayout({ children }) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <NuqsAdapterWrapper>
      <SidebarProvider>
        <AppSidebar user={session.user} />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <DashboardBreadcrumb />
            </div>
            <div className="flex items-center gap-4 ml-auto px-4">
              <SucursalContextCompact className="hidden md:flex" />
              <Separator orientation="vertical" className="h-4" />
              <ThemeSelector />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-6 md:p-8 overflow-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </NuqsAdapterWrapper>
  );
}
