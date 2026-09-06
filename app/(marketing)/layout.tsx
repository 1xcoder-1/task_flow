import type { PropsWithChildren } from "react";
import { Navbar } from "./_components/navbar";
import { Footer } from "./_components/footer";

const MarketingLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col justify-between">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 pt-16 pb-14 overflow-hidden">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default MarketingLayout;

