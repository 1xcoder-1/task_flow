import Link from "next/link";
import { Folder } from "lucide-react";

interface WindowsFolderCardProps {
  href: string;
  title: string;
  optionsMenu?: React.ReactNode;
}

export const WindowsFolderCard = ({
  href,
  title,
  optionsMenu,
}: WindowsFolderCardProps) => {
  return (
    <div className="group relative flex flex-col w-40 items-center">
      <Link
        href={href}
        className="w-full rounded-md hover:bg-black/5 p-1 pb-1 transition flex flex-col items-center justify-center"
      >
        <div className="relative aspect-square w-full rounded-lg border border-slate-200 bg-slate-50 shadow-sm overflow-hidden flex items-center justify-center">
          <Folder className="h-20 w-20 text-blue-400 drop-shadow-sm" fill="#60a5fa" strokeWidth={1} />
        </div>
      </Link>
      <div className="flex items-center justify-center pt-1 overflow-visible w-full px-1 relative">
        <Link
          href={href}
          className="font-medium text-sm text-neutral-700 truncate hover:bg-blue-500 hover:text-white px-1.5 py-0.5 rounded transition text-center max-w-[85%]"
        >
          {title}
        </Link>
        {optionsMenu && (
          <div className="absolute right-0 top-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
            {optionsMenu}
          </div>
        )}
      </div>
    </div>
  );
};
