"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useLocalStorage } from "usehooks-ts";
import {
  ClerkLoaded,
  ClerkLoading,
  useOrganization,
  useOrganizationList,
} from "@clerk/nextjs";

import { buttonVariants } from "@/components/ui/button-variants";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion } from "@/components/ui/accordion";

import { NavItem, Organization } from "./nav-item";
import { cn } from "@/lib/utils";

type SidebarProps = {
  storageKey?: string;
};

export const Sidebar = ({ storageKey = "t-sidebar-state" }: SidebarProps) => {
  const [expanded, setExpanded] = useLocalStorage<Record<string, any>>(
    storageKey,
    {}
  );

  const { organization: activeOrganization, isLoaded: isLoadedOrg, membership } =
    useOrganization();
  const isAdmin = membership?.role === "org:admin";

  const { userMemberships, isLoaded: isLoadedOrgList } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  const defaultAccordionValue: string[] = Object.keys(expanded).reduce(
    (acc: string[], key: string) => {
      if (expanded[key]) {
        acc.push(key);
      }

      return acc;
    },
    []
  );

  const onExpand = (id: string) => {
    setExpanded((curr) => ({
      ...curr,
      [id]: !expanded[id],
    }));
  };

  if (!isLoadedOrg || !isLoadedOrgList || userMemberships.isLoading) {
    return (
      <ClerkLoading>
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-10 w-[50%]" />
          <Skeleton className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <NavItem.Skeleton />
          <NavItem.Skeleton />
          <NavItem.Skeleton />
        </div>
      </ClerkLoading>
    );
  }

  return (
    <>
      <div className="flex items-center mb-4 text-slate-500">
        <span className="pl-4 text-xs font-semibold tracking-wider uppercase">Workspaces</span>
        {isAdmin && (
          <Link
            href="/select-org"
            className={cn(
              buttonVariants({
                size: "icon",
                variant: "ghost",
              }),
              "ml-auto h-8 w-8 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
            )}
          >
            <Plus className="h-4 w-4" />
          </Link>
        )}
      </div>
      <Accordion
        type="multiple"
        defaultValue={defaultAccordionValue}
        className="space-y-2"
      >
        <ClerkLoaded>
          {userMemberships.data.map(({ organization }) => (
            <NavItem
              key={organization.id}
              isActive={activeOrganization?.id === organization.id}
              isExpanded={expanded[organization.id]}
              organization={organization as Organization}
              onExpand={onExpand}
            />
          ))}
        </ClerkLoaded>
      </Accordion>
    </>
  );
};
