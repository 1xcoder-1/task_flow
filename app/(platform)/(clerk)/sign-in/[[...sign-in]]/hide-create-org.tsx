"use client";

import { useOrganizationList } from "@clerk/nextjs";

import { useEffect } from "react";

export const HideCreateOrg = () => {
  const { isLoaded, userMemberships } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });

  useEffect(() => {
    if (!isLoaded) return;

    const hasMemberships = userMemberships.data?.length > 0;
    const isAnyAdmin = userMemberships.data?.some((m) => m.role === "org:admin");
    const isOnlyMember = hasMemberships && !isAnyAdmin;

    if (!isOnlyMember) return;

    // Use an interval to catch the button as Clerk renders it asynchronously
    const interval = setInterval(() => {
      const buttons = document.querySelectorAll("button");
      buttons.forEach((btn) => {
        if (btn.innerText && btn.innerText.includes("Create new organization")) {
          btn.style.display = "none";
        }
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isLoaded, userMemberships.data]);

  if (!isLoaded) return null;

  const hasMemberships = userMemberships.data?.length > 0;
  const isAnyAdmin = userMemberships.data?.some((m) => m.role === "org:admin");
  const isOnlyMember = hasMemberships && !isAnyAdmin;

  if (!isOnlyMember) return null;

  return (
    <style dangerouslySetInnerHTML={{__html: `
      /* Target the create organization button in Clerk components */
      .cl-organizationListCreateOrganizationActionButton,
      .cl-organizationSwitcherActionButton,
      .cl-createOrganizationButton,
      button[data-localization-key*="createOrganization"] {
        display: none !important;
      }
    `}} />
  );
};
