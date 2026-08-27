import {
  ClerkLoaded,
  ClerkLoading,
  OrganizationSwitcher,
  UserButton,
} from "@clerk/nextjs";

import { Skeleton } from "@/components/ui/skeleton";

import { Logo } from "@/components/logo";
import { MobileSidebar } from "./mobile-sidebar";

import { auth } from "@clerk/nextjs/server";

export const Navbar = async () => {
  const { orgRole } = await auth();
  const isAdmin = orgRole === "org:admin";

  return (
    <nav className="fixed z-50 top-0 w-full px-4 h-14 border-b border-slate-200 shadow-sm bg-white/95 backdrop-blur flex items-center">
      <MobileSidebar />
      <div className="flex items-center gap-x-4">
        <div className="hidden md:flex">
          <Logo />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-x-2">
        <ClerkLoading>
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </ClerkLoading>
        <ClerkLoaded>
          {isAdmin && (
            <OrganizationSwitcher
              hidePersonal
              afterCreateOrganizationUrl="/organization/:id"
              afterLeaveOrganizationUrl="/select-org"
              afterSelectOrganizationUrl="/organization/:id"
              appearance={{
                elements: {
                  rootBox: {
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                  },
                },
              }}
            />
          )}
          <UserButton
            appearance={{
              elements: {
                avatarBox: {
                  height: 30,
                  width: 30,
                },
                loaderIcon: {
                  display: "block",
                },
              },
            }}
          />
        </ClerkLoaded>
      </div>
    </nav>
  );
};
