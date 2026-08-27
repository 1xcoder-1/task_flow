import { OrganizationProfile } from "@clerk/nextjs";
import { Folder } from "lucide-react";
import { FolderAccessPage } from "./_components/folder-access-page";

const SettingsPage = () => {
  return (
    <div className="w-full">
      <OrganizationProfile
        appearance={{
          elements: {
            rootBox: {
              boxShadow: "none",
              width: "100%",
            },
            card: {
              border: "1px solid #e5e5e5",
              boxShadow: "none",
              width: "100%",
            },
          },
        }}
      >
        <OrganizationProfile.Page
          label="Folder Access"
          labelIcon={<Folder className="w-4 h-4" />}
          url="folder-access"
        >
          <FolderAccessPage />
        </OrganizationProfile.Page>
      </OrganizationProfile>
    </div>
  );
};

export default SettingsPage;
