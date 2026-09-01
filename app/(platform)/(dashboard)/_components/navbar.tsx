import { Logo } from "@/components/logo";
import { MobileSidebar } from "./mobile-sidebar";
import { NotificationPopover } from "@/components/notification-popover";
import { NavbarClerkControls } from "./navbar-clerk-controls";
import { CommandPalette } from "@/components/command-palette";

import { auth } from "@clerk/nextjs/server";

export const Navbar = async () => {
  const { orgRole } = await auth();
  const isAdmin = orgRole === "org:admin";

  return (
    <nav className="fixed z-50 top-0 w-full px-4 h-14 border-b border-slate-200 dark:border-slate-800 shadow-sm bg-white/95 dark:bg-slate-950/95 backdrop-blur flex items-center">
      <MobileSidebar />
      <div className="flex items-center gap-x-4">
        <div className="hidden md:flex">
          <Logo />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-x-3">
        <CommandPalette />
        <NotificationPopover />
        <NavbarClerkControls isAdmin={isAdmin} />
      </div>
    </nav>
  );
};
