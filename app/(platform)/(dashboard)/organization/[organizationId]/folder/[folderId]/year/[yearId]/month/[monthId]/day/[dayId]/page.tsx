import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { DayBoardList } from "./_components/day-board-list";

interface DayIdPageProps {
  params: Promise<{
    organizationId: string;
    folderId: string;
    yearId: string;
    monthId: string;
    dayId: string;
  }>;
}

const DayIdPage = async ({ params }: DayIdPageProps) => {
  const { folderId, organizationId, yearId, monthId, dayId } = await params;

  const boards = await db.board.findMany({
    where: { orgId: organizationId, dayFolderId: dayId, isArchived: false },
    select: {
      id: true,
      title: true,
      imageThumbUrl: true,
      isImpBoard: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="w-full mb-20">
      <Link 
        href={`/organization/${organizationId}/folder/${folderId}/year/${yearId}/month/${monthId}`}
        prefetch={true}
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition mb-4 ml-1 bg-white/50 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm backdrop-blur-sm"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to Day Folders
      </Link>
      
      <div className="mt-4">
        <DayBoardList boards={boards} dayFolderId={dayId} orgId={organizationId} />
      </div>
    </div>
  );
};

export default DayIdPage;
