import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, User2 } from "lucide-react";

import { db } from "@/lib/db";
import { inngest } from "@/inngest/client";
import { FolderAuthWrapper } from "./_components/folder-auth-wrapper";
import { YearFolderList } from "./_components/year-folder-list";
import { BoardCardOptionsModal } from "@/components/modals/board-card-options-modal";

import { auth } from "@clerk/nextjs/server";

interface FolderIdPageProps {
  params: Promise<{
    organizationId: string;
    folderId: string;
  }>;
}

const FolderIdPage = async ({ params }: FolderIdPageProps) => {
  const [{ folderId, organizationId }, { orgRole, userId }] = await Promise.all([params, auth()]);
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

  let impBoardContent = null;

  if (folder?.title === "Important") {
    const impBoard = await db.board.findFirst({
      where: { orgId: organizationId, isImpBoard: true }
    });
    
    if (impBoard) {
      impBoardContent = (
        <div className="space-y-4 mt-4">
          <div className="flex items-center font-semibold text-lg text-neutral-700">
            <User2 className="h-6 w-6 mr-2" />
            Your Boards
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div key={impBoard.id} className="group relative aspect-video bg-sky-700 rounded-xl shadow-sm h-full w-full overflow-hidden hover:shadow-md transition">
              <Link
                href={`/board/${impBoard.id}`}
                style={{ backgroundImage: `url(${impBoard.imageThumbUrl})` }}
                className="absolute inset-0 block h-full w-full bg-no-repeat bg-center bg-cover"
              >
                <div
                  aria-hidden
                  className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition"
                />
                <div className="relative p-3 h-full flex flex-col justify-between pointer-events-none">
                  <p className="font-semibold text-white drop-shadow-md tracking-wide">{impBoard.title}</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }
  
  if (folder && folder.title !== "Important") {
    try {
      await inngest.send({
        name: "app/folder.init",
        data: {
          orgId: organizationId,
          folderId: folder.id,
        },
      });
    } catch (error) {
      console.error("Failed to send inngest event:", error);
    }
  }
  const hasAccess = folder?.accesses.some((a) => a.userId === userId);

  const hasPassword = !!folder?.password;
  let requiresPassword = hasPassword && !isAdmin && !hasAccess;

  if (folder?.title === "Important" || folder?.title === "Imp Tasks daily") {
    requiresPassword = false;
  }

  const content = (
    <div className="mt-4">
      {folder?.title === "Important" ? (
        impBoardContent
      ) : (
        <Suspense fallback={<YearFolderList.Skeleton />}>
          <YearFolderList folderId={folderId} />
        </Suspense>
      )}
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
