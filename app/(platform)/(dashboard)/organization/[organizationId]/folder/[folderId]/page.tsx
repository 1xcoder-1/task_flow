import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { db } from "@/lib/db";
import { FolderAuthWrapper } from "./_components/folder-auth-wrapper";
import { YearFolderList } from "./_components/year-folder-list";

import { auth } from "@clerk/nextjs/server";

interface FolderIdPageProps {
  params: Promise<{
    organizationId: string;
    folderId: string;
  }>;
}

const FolderIdPage = async ({ params }: FolderIdPageProps) => {
  const { folderId, organizationId } = await params;
  const { orgRole } = await auth();
  const isAdmin = orgRole === "org:admin";

  const folder = await db.folder.findUnique({
    where: {
      id: folderId,
      orgId: organizationId,
    },
    include: {
      accesses: true,
    }
  });

  const { userId } = await auth();

  const hasAccess = folder?.accesses.some((a) => a.userId === userId);

  const hasPassword = !!folder?.password;
  const requiresPassword = hasPassword && !isAdmin && !hasAccess;

  const content = (
    <div className="mt-4">
      <Suspense fallback={<YearFolderList.Skeleton />}>
        <YearFolderList folderId={folderId} />
      </Suspense>
    </div>
  );

  return (
    <div className="w-full mb-20">
      <Link 
        href={`/organization/${organizationId}`}
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition mb-4 ml-1 bg-white/50 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm backdrop-blur-sm"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to workspace
      </Link>
      
      {requiresPassword ? (
        <FolderAuthWrapper folderId={folderId}>
          {content}
        </FolderAuthWrapper>
      ) : (
        content
      )}
    </div>
  );
};

export default FolderIdPage;
