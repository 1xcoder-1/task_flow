import Link from "next/link";
import { Poppins } from "next/font/google";
import localFont from "next/font/local";
import { Medal, ArrowRight, Sparkles, Clock, Kanban, FolderTree } from "lucide-react";

import { cn } from "@/lib/utils";

const headingFont = localFont({
  src: "../../public/fonts/font.woff2",
});

const textFont = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const MarketingPage = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto px-4 py-4 space-y-6">
      {/* Top Medal Badge */}
      <div className="inline-flex items-center gap-2 border border-amber-200/80 bg-amber-50/90 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-amber-700 shadow-2xs">
        <Medal className="h-4 w-4 text-amber-600" />
        <span>No 1 Task Management Platform</span>
      </div>

      {/* Main Title */}
      <div className={cn("flex flex-col items-center justify-center gap-y-3.5 my-2", headingFont.className)}>
        <h1 className="text-3xl sm:text-5xl md:text-6xl text-slate-800 tracking-tight leading-normal text-center">
          TaskFlow helps team move
        </h1>
        <div className="text-2xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-fuchsia-600 via-pink-600 to-amber-500 text-white px-5 py-2.5 rounded-xl shadow-sm uppercase tracking-wide inline-block mt-1">
          work forward.
        </div>
      </div>

      {/* Subtitle Paragraph */}
      <p
        className={cn(
          "text-sm sm:text-lg text-slate-600 max-w-xl font-medium leading-relaxed",
          textFont.className
        )}
      >
        Collaborate, manage projects, and reach new productivity peaks. From high rises to the home office, the way your team works is unique — accomplish it all with TaskFlow.
      </p>

      {/* Primary CTA Button */}
      <div className="pt-2">
        <Link
          href="/sign-up"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm sm:text-base h-12 px-8 rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2"
        >
          <span>Get TaskFlow for free</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Quick Feature Badges */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-slate-500 pt-4 border-t border-slate-200/60 w-full max-w-lg">
        <div className="flex items-center gap-1.5 bg-slate-100/80 px-3 py-1.5 rounded-lg">
          <Kanban className="h-3.5 w-3.5 text-indigo-600" />
          <span>Real-time Kanban</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100/80 px-3 py-1.5 rounded-lg">
          <Clock className="h-3.5 w-3.5 text-amber-600" />
          <span>Focus Time Tracker</span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100/80 px-3 py-1.5 rounded-lg">
          <FolderTree className="h-3.5 w-3.5 text-cyan-600" />
          <span>Auto Folder Engine</span>
        </div>
      </div>
    </div>
  );
};

export default MarketingPage;
