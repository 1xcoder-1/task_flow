"use client";

import { useOrganization } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { getFoldersForAccess } from "@/actions/get-folders-for-access";
import { manageFolderAccess } from "@/actions/manage-folder-access";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Folder } from "@prisma/client";
import Image from "next/image";

export const FolderAccessPage = () => {
  const { memberships, isLoaded } = useOrganization({
    memberships: { pageSize: 100 }
  });

  const [folders, setFolders] = useState<(Folder & { accesses: any[] })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFolders = async () => {
    setLoading(true);
    try {
      const data = await getFoldersForAccess();
      setFolders(data);
    } catch (error) {
      toast.error("Failed to fetch folders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleToggleAccess = async (folderId: string, userId: string, hasAccess: boolean) => {
    try {
      await manageFolderAccess({ folderId, userId, action: hasAccess ? "remove" : "add" });
      toast.success(hasAccess ? "Access removed" : "Access granted");
      fetchFolders(); // Refresh
    } catch (error) {
      toast.error("Failed to update access");
    }
  };

  if (!isLoaded || loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading...</div>;
  }

  const members = memberships?.data || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Folder Access Management</h2>
        <p className="text-sm text-slate-500 mt-1">Assign organization members to specific folders.</p>
      </div>

      <div className="space-y-4">
        {members.map((member) => {
          const userData = member.publicUserData;
          if (!userData) return null;

          return (
          <div key={member.id} className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
            <div className="flex items-center gap-x-3">
              <Image src={userData.imageUrl} width={32} height={32} className="w-8 h-8 rounded-full" alt="User avatar" />
              <div>
                <p className="font-semibold text-sm text-slate-900">
                  {userData.firstName} {userData.lastName}
                </p>
                <p className="text-xs text-slate-500">{userData.identifier}</p>
              </div>
            </div>

            <div className="grid gap-2">
              <p className="text-sm font-medium text-slate-700">Folder Assignments:</p>
              <div className="flex flex-wrap gap-2">
                {folders.map(folder => {
                  const hasAccess = folder.accesses.some(a => a.userId === userData.userId);
                  return (
                    <Button 
                      key={folder.id} 
                      variant={hasAccess ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleAccess(folder.id, userData.userId!, hasAccess)}
                      className="rounded-full text-xs"
                    >
                      {folder.title} {hasAccess ? "✓" : "+"}
                    </Button>
                  )
                })}
                {folders.length === 0 && <span className="text-xs text-slate-500">No folders available</span>}
              </div>
            </div>
          </div>
        )})}
        {members.length === 0 && <p className="text-sm text-slate-500">No members found.</p>}
      </div>
    </div>
  );
};
