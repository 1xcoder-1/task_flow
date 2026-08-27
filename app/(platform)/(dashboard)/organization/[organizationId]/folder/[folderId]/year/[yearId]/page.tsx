import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

  return (
    <div className="w-full mb-20">
      <Link 
        href={`/organization/${organizationId}/folder/${folderId}`}
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition mb-4 ml-1 bg-white/50 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm backdrop-blur-sm"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to Year Folders
      </Link>
      
      <div className="mt-4">
        <Suspense fallback={<MonthFolderList.Skeleton />}>
          <MonthFolderList yearFolderId={yearId} organizationId={organizationId} folderId={folderId} />
        </Suspense>
      </div>
    </div>
  );
};

export default YearIdPage;
