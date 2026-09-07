import type { PropsWithChildren } from "react";
import startCase from "lodash/startCase";

import { OrgControl } from "./_components/org-control";
import { LiveblocksAppProvider } from "@/components/providers/liveblocks-provider";
import { LiveblocksRoomProvider } from "@/components/providers/liveblocks-room-provider";

export async function generateMetadata() {
  return {
    title: "Organization Workspace",
  };
}

const OrganizationIdLayout = async (props: { children: React.ReactNode; params: Promise<{ organizationId: string }> }) => {
  const { organizationId } = await props.params;

  return (
    <LiveblocksAppProvider>
      <LiveblocksRoomProvider roomId={organizationId}>
        <OrgControl />
        {props.children}
      </LiveblocksRoomProvider>
    </LiveblocksAppProvider>
  );
};

export default OrganizationIdLayout;
