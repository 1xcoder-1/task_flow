"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ClerkLoaded, useOrganization } from "@clerk/nextjs";
import { FolderTree, CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useBroadcastEvent, useEventListener } from "@liveblocks/react";

export const Info = () => {
  const { organization, membership, isLoaded } = useOrganization();
  const isAdmin = membership?.role === "org:admin";
  const broadcast = useBroadcastEvent();

  const [autoFolderCreation, setAutoFolderCreation] = useState<boolean>(true);
  const [isUpdatingSetting, setIsUpdatingSetting] = useState<boolean>(false);

  // Fetch Organization Settings (Auto Folder Creation) - only for admin users
  const fetchOrgSettings = useCallback(async () => {
    if (!organization?.id || !isAdmin) return;
    try {
      const res = await fetch(`/api/organization/settings?orgId=${organization.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAutoFolderCreation(data.autoFolderCreation ?? true);
        }
      }
    } catch (err) {
      console.error("Failed to load org settings", err);
    }
  }, [organization?.id, isAdmin]);

  useEffect(() => {
    if (isAdmin && organization?.id) {
      fetchOrgSettings();
    }
  }, [isAdmin, organization?.id, fetchOrgSettings]);

  // Real-time Liveblocks setting listener
  useEventListener(({ event }) => {
    if (!event || typeof event !== "object" || !isAdmin) return;
    const e = event as any;

    if (e.type === "ORG_SETTINGS_UPDATED" && e.data?.orgId === organization?.id) {
      setAutoFolderCreation(e.data.autoFolderCreation);
      toast.info(`Auto Folder Creation setting was updated to ${e.data.autoFolderCreation ? "ON" : "OFF"}`);
    }
  });

  const handleToggleAutoFolderCreation = async () => {
    if (!isAdmin || !organization?.id) {
      toast.error("Only workspace Admins can modify folder settings.");
      return;
    }

    const nextValue = !autoFolderCreation;
    setIsUpdatingSetting(true);

    try {
      const res = await fetch("/api/organization/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoFolderCreation: nextValue }),
      });

      if (!res.ok) {
        throw new Error("Failed to update setting");
      }

      const data = await res.json();
      if (data.success) {
        setAutoFolderCreation(nextValue);
        toast.success(
          nextValue
            ? "Auto Folder Creation (Year / Month / Day) is now PERMANENTLY ON across the workspace!"
            : "Auto Folder Creation (Year / Month / Day) is now PERMANENTLY OFF across the workspace!"
        );

        try {
          broadcast({
            type: "ORG_SETTINGS_UPDATED",
            data: {
              orgId: organization.id,
              autoFolderCreation: nextValue,
            },
          });
        } catch (e) {
          // Liveblocks fallback
        }
      } else {
        throw new Error(data.error || "Failed to update setting");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update Auto Folder Creation setting.");
    } finally {
      setIsUpdatingSetting(false);
    }
  };

  if (!isLoaded || !isAdmin) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white/70 rounded-2xl border border-slate-200/80 shadow-sm backdrop-blur-sm mr-4 md:mr-0 -ml-3 transition-all">
      <div className="flex items-center gap-x-4">
        <div className="w-[60px] h-[60px] relative bg-white rounded-xl p-1 shadow-xs border border-slate-100 shrink-0 overflow-hidden">
          <ClerkLoaded>
            <Image
              src={organization?.imageUrl!}
              alt={organization?.name!}
              height={60}
              width={60}
              className="rounded-lg object-cover h-full w-full"
            />
          </ClerkLoaded>
        </div>

        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-2xl text-slate-800 tracking-wide">{organization?.name}</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Admin View
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium">Organization Workspace</p>
        </div>
      </div>

      {/* Admin Auto Folder Creation Control */}
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl self-start sm:self-auto">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <FolderTree className="h-4 w-4 text-amber-600 shrink-0" />
          <span>Auto Folder:</span>
        </div>

        <Button
          size="sm"
          variant="outline"
          disabled={isUpdatingSetting}
          onClick={handleToggleAutoFolderCreation}
          className={cn(
            "h-8 px-3 rounded-lg font-bold text-xs transition border shadow-2xs",
            autoFolderCreation
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100"
              : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100"
          )}
          title="Click to toggle permanent automatic Year, Month & Day folder creation"
        >
          {autoFolderCreation ? (
            <>
              <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-emerald-600" /> ON
            </>
          ) : (
            <>
              <XCircle className="h-3.5 w-3.5 mr-1.5 text-rose-600" /> OFF
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

Info.Skeleton = function SkeletonInfo() {
  return (
    <div className="flex items-center gap-x-4">
      <div className="w-[60px] h-[60px] relative">
        <Skeleton className="w-full h-full absolute rounded-xl" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-4 w-[120px]" />
      </div>
    </div>
  );
};
