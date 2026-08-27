import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
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

  return (
    <div className="w-full mb-20">
      <Link 
        href={`/organization/${organizationId}/folder/${folderId}/year/${yearId}/month/${monthId}`}
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition mb-4 ml-1 bg-white/50 px-3 py-1.5 rounded-full border border-slate-200 shadow-sm backdrop-blur-sm"
      >
        <ArrowLeft className="h-4 w-4 mr-1.5" />
        Back to Day Folders
      </Link>
      
      <div className="mt-4">
        <Suspense fallback={<DayBoardList.Skeleton />}>
          <DayBoardList dayFolderId={dayId} />
        </Suspense>
      </div>
    </div>
  );
};

export default DayIdPage;
