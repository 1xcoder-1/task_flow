import Image from "next/image";
import Link from "next/link";
import localFont from "next/font/local";

import { cn } from "@/lib/utils";

const headingFont = localFont({
  src: "../public/fonts/font.woff2",
});

type LogoProps = {
  isMobile?: boolean;
};

export const Logo = ({ isMobile }: LogoProps) => {
  return (
    <Link href="/" className="hover:opacity-90 transition flex items-center gap-x-2">
      <div className={cn(!isMobile && "hidden", "flex items-center gap-x-2")}>
        <Image
          src="/logo.svg"
          alt="TaskFlow Logo"
          height={30}
          width={30}
          className="rounded-lg shadow-2xs"
          aria-hidden
        />

        <p
          className={cn(
            "text-lg font-bold text-slate-900 tracking-tight",
            headingFont.className
          )}
        >
          Task<span className="text-indigo-600">Flow</span>
        </p>
      </div>
    </Link>
  );
};


