"use client";

import Image from "next/image";
import { ClerkLoaded, useOrganization } from "@clerk/nextjs";

import { Skeleton } from "@/components/ui/skeleton";

export const Info = () => {
  const { organization, isLoaded } = useOrganization();
  if (!isLoaded) return <Info.Skeleton />;

  return (
    <div className="flex items-center gap-x-6 p-4 bg-white/50 rounded-xl border border-slate-100 shadow-sm backdrop-blur-sm mr-4 md:mr-0 -ml-3">
      <div className="w-[64px] h-[64px] relative bg-white rounded-lg p-1 shadow-sm border border-slate-100 shrink-0">
        <ClerkLoaded>
          <Image
            src={organization?.imageUrl!}
            alt={organization?.name!}
            height={64}
            width={64}
            className="rounded-md object-cover h-full w-full"
          />
        </ClerkLoaded>
      </div>

      <div className="space-y-1">
        <h1 className="font-bold text-2xl text-slate-800 tracking-wide">{organization?.name}</h1>
        <p className="text-sm text-slate-500 font-medium">Organization Workspace</p>
      </div>
    </div>
  );
};

Info.Skeleton = function SkeletonInfo() {
  return (
    <div className="flex items-center gap-x-4">
      <div className="w-[60px] h-[60px] relative">
        <Skeleton className="w-full h-full absolute" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-10 w-[200px]" />
      </div>
    </div>
  );
};
