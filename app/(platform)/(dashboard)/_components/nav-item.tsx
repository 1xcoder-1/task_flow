"use client";

import Image from "next/image";
import { Activity, Layout } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { cn } from "@/lib/utils";

export type Organization = {
  id: string;
  slug: string;
  imageUrl: string;
  name: string;
};

type NavItemProps = {
  isExpanded: boolean;
  isActive: boolean;
  organization: Organization;
  onExpand: (id: string) => void;
};

export const NavItem = ({
  isExpanded,
  isActive,
  organization,
  onExpand,
}: NavItemProps) => {
  const router = useRouter();
  const pathname = usePathname();

  const routes = [
    {
      label: "Teams",
      icon: <Layout className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}`,
    },
    {
      label: "Activity",
      icon: <Activity className="h-4 w-4 mr-2" />,
      href: `/organization/${organization.id}/activity`,
    },
  ];

  const onClick = (href: string) => {
    router.push(href);
  };

  return (
    <AccordionItem value={organization.id} className="border-none">
      <AccordionTrigger
        onClick={() => onExpand(organization.id)}
        className={cn(
          "flex items-center gap-x-2 p-2 text-slate-700 rounded-lg hover:bg-slate-100 transition text-start no-underline hover:no-underline",
          isActive && !isExpanded && "bg-slate-100/50 font-medium text-slate-900"
        )}
      >
        <div className="flex items-center gap-x-2">
          <div className="w-7 h-7 relative">
            <Image
              src={organization.imageUrl}
              height={28}
              width={28}
              alt={`organization ${organization.name}'s image`}
              className="rounded-sm object-cover"
            />
          </div>
          <span className="font-medium text-sm">{organization.name}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-1 pb-1 pl-4 text-slate-700">
        <div className="flex flex-col gap-y-1 relative before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-slate-200">
          {routes.map((route) => (
            <Button
              key={route.label}
              size="sm"
              onClick={() => onClick(route.href)}
              className={cn(
                "w-full font-normal justify-start pl-6 h-9 rounded-md relative",
                pathname === route.href
                  ? "bg-slate-100 text-slate-900 font-medium before:absolute before:left-[-1px] before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-5 before:bg-slate-900 before:rounded-r-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              )}
              variant="ghost"
            >
              {route.icon}
              {route.label}
            </Button>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

NavItem.Skeleton = function SkeletonNavItem() {
  return (
    <div className="flex items-center gap-x-2">
      <div className="w-10 h-10 relative shrink-0">
        <Skeleton className="h-full w-full absolute" />
      </div>

      <Skeleton className="h-10 w-full" />
    </div>
  );
};
