"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { useSyncExternalStore } from "react";

import { Skeleton } from "@/components/ui/skeleton";

const subscribeNoop = () => () => {};
const getSnapshotClient = () => true;
const getSnapshotServer = () => false;

export const NavbarClerkControls = ({ isAdmin }: { isAdmin: boolean }) => {
  const mounted = useSyncExternalStore(subscribeNoop, getSnapshotClient, getSnapshotServer);

  if (!mounted) {
    return (
      <>
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </>
    );
  }

  return (
    <>
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
            avatarBox: { height: 30, width: 30 },
            loaderIcon: { display: "block" },
          },
        }}
      />
    </>
  );
};
