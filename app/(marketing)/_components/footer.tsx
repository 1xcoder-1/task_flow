import Link from "next/link";
import { Logo } from "@/components/logo";

export const Footer = () => {
  return (
    <div className="fixed bottom-0 w-full h-14 px-4 border-t border-slate-200/80 bg-white/80 backdrop-blur-sm z-50 flex items-center">
      <div className="md:max-w-screen-xl mx-auto flex items-center w-full justify-between">
        <Logo isMobile />

        <div className="flex items-center gap-x-4">
          <Link href="#" className="text-xs text-slate-500 hover:text-slate-900 transition font-medium">
            Privacy Policy
          </Link>
          <Link href="#" className="text-xs text-slate-500 hover:text-slate-900 transition font-medium">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
};

