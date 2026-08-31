import type { PropsWithChildren } from "react";

import { Navbar } from "./_components/navbar";
import { ConditionalNavbar } from "./_components/conditional-navbar";

const DashboardLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="h-full">
      <ConditionalNavbar>
        <Navbar />
      </ConditionalNavbar>
      {children}
    </div>
  );
};

export default DashboardLayout;
