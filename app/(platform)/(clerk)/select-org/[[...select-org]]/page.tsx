import { OrganizationList } from "@clerk/nextjs";
import { auth, clerkClient } from "@clerk/nextjs/server";

export default async function CreateOrganizationPage() {
  const { userId } = await auth();
  
  let isOnlyMember = false;
  
  if (userId) {
    const client = await clerkClient();
    const memberships = await client.users.getOrganizationMembershipList({ userId });
    
    const hasMemberships = memberships.data.length > 0;
    const isAnyAdmin = memberships.data.some((m) => m.role === "org:admin");
    
    if (hasMemberships && !isAnyAdmin) {
      isOnlyMember = true;
    }
  }

  return (
    <>
      {isOnlyMember && (
        <style dangerouslySetInnerHTML={{__html: `
          .cl-organizationListCreateOrganizationActionButton {
            display: none !important;
          }
        `}} />
      )}
      <OrganizationList
        hidePersonal
        afterSelectOrganizationUrl="/organization/:id"
        afterCreateOrganizationUrl="/organization/:id"
        appearance={{
          elements: {
            organizationListCreateOrganizationActionButton: isOnlyMember ? "hidden" : "",
          },
        }}
      />
    </>
  );
}
