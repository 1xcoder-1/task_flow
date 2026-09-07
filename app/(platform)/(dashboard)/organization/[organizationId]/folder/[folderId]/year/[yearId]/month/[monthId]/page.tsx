import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { DayFolderList } from "./_components/day-folder-list";

interface MonthIdPageProps {
  params: Promise<{
    organizationId: string;
    folderId: string;
    yearId: string;
    monthId: string;
  }>;
}

const MonthIdPage = async ({ params }: MonthIdPageProps) => {
  const { folderId, organizationId, yearId, monthId } = await params;

  const dayFolders = await db.dayFolder.findMany({
    where: { monthFolderId: monthId, isArchived: false },
    select: {
      id: true,
      title: true,
      monthFolderId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="w-full mb-20">
      <Link 
        href={`/organization/${organizationId}/folder/${folderId}/year/${yearId}`}
        prefetch={true}
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition mb-4 ml-1 bg-white/50 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm backdrop-blur-sm"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to Month Folders
      </Link>
      
      <div className="mt-4">
        <DayFolderList dayFolders={dayFolders} monthFolderId={monthId} yearFolderId={yearId} organizationId={organizationId} folderId={folderId} />
      </div>
    </div>
  );
};

export default MonthIdPage;
