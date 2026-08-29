"use client";

import { useSyncExternalStore } from "react";

import { CardModal } from "@/components/modals/card-modal";

const emptySubscribe = () => () => {};

export const ModalProvider = () => {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  if (!isMounted) return null;

  return (
    <>
      <CardModal />
    </>
  );
};
