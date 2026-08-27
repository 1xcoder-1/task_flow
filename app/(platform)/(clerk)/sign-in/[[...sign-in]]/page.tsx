import { SignIn } from "@clerk/nextjs";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { HideCreateOrg } from "./hide-create-org";

export default async function SignInPage() {
  const { userId } = await auth();
  console.log("SignInPage auth():", { userId });
  
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
      <HideCreateOrg />
      <style dangerouslySetInnerHTML={{__html: `
        .cl-organizationListCreateOrganizationActionButton,
        .cl-organizationSwitcherActionButton,
        .cl-createOrganizationButton,
        button[data-localization-key*="createOrganization"],
        .cl-internal-phfxlr, /* fallback just in case */
        .cl-organizationList-createOrganizationActionButton {
          display: none !important;
        }
      `}} />
      <SignIn 
        appearance={{
          elements: {
            organizationListCreateOrganizationActionButton: "hidden",
            organizationSwitcherCreateOrganizationActionButton: "hidden",
          },
        }}
      />
    </>
  );
}
