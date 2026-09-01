"use client";

const MAX_IMAGE_EDGE = 1280;
const PREVIEW_EDGE = 360;
const IMAGE_QUALITY = 0.72;
const PREVIEW_QUALITY = 0.55;
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const compressBitmap = async (
  file: Blob,
  maxEdge: number,
  quality: number,
  mimeType: "image/webp" | "image/jpeg"
) => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / bitmap.width, maxEdge / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, quality);
  });

  return blob || file;
};

export const prepareUploadFile = async (file: File) => {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("File is too large. Please keep uploads under 8 MB.");
  }

  const isImage = file.type.startsWith("image/");
  const isGif = file.type === "image/gif";

  if (!isImage || isGif) {
    return {
      blob: file,
      name: file.name,
      type: isImage ? "image" : "document",
      mimeType: file.type || "application/octet-stream",
      previewUrl: undefined as string | undefined,
    };
  }

  try {
    const compressed = await compressBitmap(file, MAX_IMAGE_EDGE, IMAGE_QUALITY, "image/webp");
    const preview = await compressBitmap(file, PREVIEW_EDGE, PREVIEW_QUALITY, "image/jpeg");
    const previewUrl = await blobToDataUrl(preview);
    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";

    return {
      blob: compressed,
      name,
      type: "image" as const,
      mimeType: compressed.type || "image/webp",
      previewUrl,
    };
  } catch {
    return {
      blob: file,
      name: file.name,
      type: "image" as const,
      mimeType: file.type || "image/jpeg",
      previewUrl: undefined as string | undefined,
    };
  }
};
