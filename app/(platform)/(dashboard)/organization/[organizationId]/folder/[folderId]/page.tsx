import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, User2 } from "lucide-react";

import { db } from "@/lib/db";
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
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentDay = new Date().getDate().toString();

    // Fast path: check if the folders already exist before doing any expensive AuditLog queries
    let yearFolder = await db.yearFolder.findFirst({
      where: { folderId: folder.id, title: currentYear }
    });
    
    let monthFolder = yearFolder ? await db.monthFolder.findFirst({
      where: { yearFolderId: yearFolder.id, title: currentMonth }
    }) : null;
    
    let dayFolder = monthFolder ? await db.dayFolder.findFirst({
      where: { monthFolderId: monthFolder.id, title: currentDay }
    }) : null;

    // Only if the day folder doesn't exist, we check if it was created and deleted today
    if (!dayFolder) {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const autoCreateLogTitle = `AutoCreate_Structure_${folder.id}_${currentYear}_${currentMonth}_${currentDay}`;

      const alreadyCreatedToday = await db.auditLog.findFirst({
        where: {
          orgId: organizationId,
          entityType: "FOLDER",
          action: "CREATE",
          entityTitle: autoCreateLogTitle,
          createdAt: { gte: startOfDay }
        }
      });

      if (!alreadyCreatedToday) {
        if (!yearFolder) {
          yearFolder = await db.yearFolder.create({
            data: { title: currentYear, folderId: folder.id }
          });
        }

        if (!monthFolder) {
          monthFolder = await db.monthFolder.create({
            data: { title: currentMonth, yearFolderId: yearFolder!.id }
          });
        }

        dayFolder = await db.dayFolder.create({
          data: { title: currentDay, monthFolderId: monthFolder!.id }
        });
        
        // Auto-create a default board inside the new day folder
        await db.board.create({
          data: {
            title: "Daily Tasks",
            orgId: organizationId,
            dayFolderId: dayFolder.id,
            imageId: "default",
            imageThumbUrl: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=400&auto=format&fit=crop",
            imageFullUrl: "https://images.unsplash.com/photo-1707343843437-caacff5cfa74?q=80&w=1080&auto=format&fit=crop",
            imageUserName: "System",
            imageLinkHtml: "System",
            lists: {
              create: [
                {
                  title: "Pending",
                  order: 1,
                },
                {
                  title: "In Progress",
                  order: 2,
                },
                {
                  title: "Done",
                  order: 3,
                }
              ]
            }
          }
        });

        try {
          await db.auditLog.create({
            data: {
              orgId: organizationId,
              action: "CREATE",
              entityId: folder.id,
              entityType: "FOLDER",
              entityTitle: autoCreateLogTitle,
              userId: userId || "system",
              userImage: "",
              userName: "System",
            }
          });
        } catch (e) {
          console.error("Failed to log auto-create", e);
        }
      }
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
