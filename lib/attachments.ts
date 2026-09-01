import { db } from "@/lib/db";

export const toPublicAttachment = (attachment: {
  id: string;
  url: string;
  type: string;
  title: string | null;
  cardId: string;
  createdAt: Date;
  updatedAt: Date;
  previewUrl?: string | null;
}) => {
  const isHttp = attachment.url.startsWith("http://") || attachment.url.startsWith("https://");
  const isFileApi = attachment.url.startsWith("/api/files/");

  return {
    id: attachment.id,
    type: attachment.type,
    title: attachment.title,
    cardId: attachment.cardId,
    createdAt: attachment.createdAt,
    updatedAt: attachment.updatedAt,
    previewUrl: attachment.previewUrl || undefined,
    url: isHttp || isFileApi ? attachment.url : `/api/files/${attachment.id}`,
  };
};

export const getAuthorizedAttachment = async (attachmentId: string, orgId: string) => {
  return db.attachment.findFirst({
    where: {
      id: attachmentId,
      card: {
        list: {
          board: { orgId },
        },
      },
    },
  });
};
