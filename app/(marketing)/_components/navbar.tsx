import Link from "next/link";
import { Github } from "lucide-react";

import { Logo } from "@/components/logo";
import { buttonVariants } from "@/components/ui/button-variants";

export const Navbar = () => {
  return (
    <div className="fixed top-0 w-full h-16 px-4 border-b border-slate-200/80 shadow-xs bg-white/80 backdrop-blur-md z-50 flex items-center">
      <div className="md:max-w-screen-xl mx-auto flex items-center w-full justify-between">
        <Logo isMobile />

        <div className="space-x-3 md:w-auto flex items-center justify-end">
          <Link
            href="/sign-in"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Login
          </Link>

          <Link 
            href="/sign-up" 
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold h-9 px-4 rounded-xl shadow-xs transition flex items-center"
          >
            Get TaskFlow for free
          </Link>
        </div>
      </div>
    </div>
  );
};
