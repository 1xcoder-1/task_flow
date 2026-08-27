import type { PropsWithChildren } from "react";

import { Sidebar } from "../_components/sidebar";

const OrganizationLayout = ({ children }: PropsWithChildren) => {
  return (
    <main className="pt-14 px-4 max-w-7xl 2xl:max-w-screen-2xl mx-auto h-full">
      <div className="flex gap-x-10 h-full">
        <div className="w-72 shrink-0 hidden md:block border-r border-slate-200 pr-6 pt-4 min-h-[calc(100vh-3.5rem)]">
          <Sidebar />
        </div>
        <div className="flex-1 pl-4 pr-4 pt-4">
          {children}
        </div>
      </div>
    </main>
  );
};

export default OrganizationLayout;
