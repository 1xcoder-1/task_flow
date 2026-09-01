import type { PropsWithChildren } from "react";

import { Sidebar } from "../_components/sidebar";
import { CollapsibleLayout } from "./_components/collapsible-layout";

const OrganizationLayout = ({ children }: PropsWithChildren) => {
  return (
    <main className="pt-14 px-4 max-w-7xl 2xl:max-w-screen-2xl mx-auto h-full">
      <CollapsibleLayout sidebar={<Sidebar />}>
        {children}
      </CollapsibleLayout>
    </main>
  );
};

export default OrganizationLayout;
