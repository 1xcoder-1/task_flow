import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { MonthFolderList } from "./_components/month-folder-list";

interface YearIdPageProps {
  params: Promise<{
    organizationId: string;
    folderId: string;
    yearId: string;
  }>;
}

const YearIdPage = async ({ params }: YearIdPageProps) => {
  const { folderId, organizationId, yearId } = await params;

  const monthFolders = await db.monthFolder.findMany({
    where: { yearFolderId: yearId, isArchived: false },
    select: {
      id: true,
      title: true,
      yearFolderId: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="w-full mb-20">
      <Link 
        href={`/organization/${organizationId}/folder/${folderId}`}
        prefetch={true}
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition mb-4 ml-1 bg-white/50 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm backdrop-blur-sm"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to Year Folders
      </Link>
      
      <div className="mt-4">
        <MonthFolderList monthFolders={monthFolders} yearFolderId={yearId} organizationId={organizationId} folderId={folderId} />
      </div>
    </div>
  );
};

export default YearIdPage;
