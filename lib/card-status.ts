export const statusFromListTitle = (title?: string) => {
  const value = (title || "").toLowerCase();

  if (value.includes("in progress") || value.includes("progress")) {
    return { status: "IN_PROGRESS", isActive: true };
  }

  if (value.includes("done") || value.includes("complete")) {
    return { status: "DONE", isActive: false };
  }

  return { status: "PENDING", isActive: false };
};
