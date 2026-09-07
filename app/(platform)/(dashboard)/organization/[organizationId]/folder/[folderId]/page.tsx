import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, User2 } from "lucide-react";

import { db } from "@/lib/db";
import { FolderAuthWrapper } from "./_components/folder-auth-wrapper";
import { YearFolderList } from "./_components/year-folder-list";
import { BoardLink } from "@/components/board-link";

import { auth } from "@clerk/nextjs/server";

interface FolderIdPageProps {
  params: Promise<{
    organizationId: string;
    folderId: string;
  }>;
}

const FolderIdPage = async ({ params }: FolderIdPageProps) => {
  const { folderId, organizationId } = await params;
  const [{ orgRole, userId }, folder, yearFolders, impBoard] = await Promise.all([
    auth(),
    db.folder.findUnique({
      where: {
        id: folderId,
        orgId: organizationId,
      },
      select: {
        id: true,
        title: true,
        password: true,
        accesses: {
          select: { userId: true },
        },
      },
    }),
    db.yearFolder.findMany({
      where: { folderId, isArchived: false },
      select: {
        id: true,
        title: true,
        folderId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    db.board.findFirst({
      where: { orgId: organizationId, isImpBoard: true },
      select: {
        id: true,
        title: true,
        imageThumbUrl: true,
      },
    }),
  ]);
  const isAdmin = orgRole === "org:admin";

  let impBoardContent = null;

  if (folder?.title === "Important" && impBoard) {
    
    if (impBoard) {
      impBoardContent = (
        <div className="space-y-4 mt-4">
          <div className="flex items-center font-semibold text-lg text-neutral-700">
            <User2 className="h-6 w-6 mr-2" />
            Your Boards
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div key={impBoard.id} className="group relative aspect-video bg-sky-700 rounded-xl shadow-sm h-full w-full overflow-hidden hover:shadow-md transition">
              <BoardLink
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
              </BoardLink>
            </div>
          </div>
        </div>
      );
    }
  }

  const hasAccess = Boolean(folder?.accesses && folder.accesses.some((a) => a.userId === userId));
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
        <YearFolderList yearFolders={yearFolders} folderId={folderId} orgId={organizationId} />
      )}
    </div>
  );

  return (
    <div className="w-full mb-20">
      <Link 
        href={`/organization/${organizationId}`}
        prefetch={true}
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
