// Board Export & Import utilities
// Handles full CSV and JSON export/import with all card fields

export interface ExportCardData {
  id: string;
  title: string;
  description?: string | null;
  listTitle: string;
  createdAt: string;
  dueDate?: string | null;
  priority?: string | null;
  status?: string | null;
  subtasks?: { title: string; isCompleted: boolean }[];
  comments?: { userName?: string; text?: string; content?: string }[];
  attachments?: { url?: string; link?: string; type?: string; title?: string }[];
  assignments?: { userId?: string; userName?: string; userImage?: string }[];
  tags?: { tag?: { name: string; color: string } }[];
}

export interface ExportOptions {
  includeTitleOnly?: boolean;
  includeSubtasks?: boolean;
  includeComments?: boolean;
  includeLinks?: boolean;
  includeAssignments?: boolean;
  includeDueDate?: boolean;
  includePriority?: boolean;
  includeStatus?: boolean;
  includeTags?: boolean;
}

// ─── CSV EXPORT ────────────────────────────────────────────────────────────────

export function exportToCSV(
  boardTitle: string,
  cards: ExportCardData[],
  options: ExportOptions = {}
) {
  if (options.includeTitleOnly) {
    // Headings-only mode: just Title + List
    const headers = ["Card Title", "List"];
    const rows = cards.map((c) => [
      csvCell(c.title),
      csvCell(c.listTitle),
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    downloadCSV(`${slugify(boardTitle)}_headings.csv`, csvContent);
    return;
  }

  // Full export — build headers based on options
  const headers = ["Card Title", "List", "Description", "Created At"];
  if (options.includeStatus !== false) headers.push("Status");
  if (options.includePriority !== false) headers.push("Priority");
  if (options.includeDueDate !== false) headers.push("Due Date");
  if (options.includeAssignments !== false) headers.push("Assignees");
  if (options.includeSubtasks !== false) headers.push("Subtasks");
  if (options.includeComments !== false) headers.push("Comments");
  if (options.includeLinks !== false) headers.push("Attached Links");
  if (options.includeTags !== false) headers.push("Tags");

  const rows = cards.map((c) => {
    const row = [
      csvCell(c.title),
      csvCell(c.listTitle),
      csvCell(c.description || ""),
      csvCell(c.createdAt || ""),
    ];

    if (options.includeStatus !== false) {
      row.push(csvCell(c.status || ""));
    }
    if (options.includePriority !== false) {
      row.push(csvCell(c.priority || ""));
    }
    if (options.includeDueDate !== false) {
      row.push(csvCell(c.dueDate || ""));
    }
    if (options.includeAssignments !== false) {
      // Export as "userId|userName|userImage" so import can recreate real assignments
      const assigneeStr = (c.assignments || [])
        .flatMap((a) => {
          const str = `${a.userId || ""}|${a.userName || ""}|${a.userImage || ""}`;
          return str.replace(/\|/g, "").trim() ? [str] : [];
        })
        .join(" ; ");
      row.push(csvCell(assigneeStr));
    }
    if (options.includeSubtasks !== false) {
      const subtaskStr = (c.subtasks || [])
        .map((s) => `[${s.isCompleted ? "Done" : "Pending"}] ${s.title}`)
        .join(" ; ");
      row.push(csvCell(subtaskStr));
    }
    if (options.includeComments !== false) {
      const commentStr = (c.comments || [])
        .map((cm) => `${cm.userName || "Member"}: ${cm.text || cm.content || ""}`)
        .join(" ; ");
      row.push(csvCell(commentStr));
    }
    if (options.includeLinks !== false) {
      const linkStr = (c.attachments || [])
        .flatMap((att) => {
          if (att.type === "link" || (!att.type && att.url)) {
            const url = att.url || att.link || "";
            if (url && !/\.(png|jpg|jpeg|gif|webp|pdf|docx|xlsx)$/i.test(url)) {
              return [url];
            }
          }
          return [];
        })
        .join(" ; ");
      row.push(csvCell(linkStr));
    }
    if (options.includeTags !== false) {
      const tagStr = (c.tags || [])
        .flatMap((t) => (t.tag ? [`${t.tag.name}:${t.tag.color}`] : []))
        .join(" ; ");
      row.push(csvCell(tagStr));
    }

    return row;
  });

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  downloadCSV(`${slugify(boardTitle)}_export.csv`, csvContent);
}

// ─── JSON EXPORT ───────────────────────────────────────────────────────────────

export function exportToJSON(boardTitle: string, cards: ExportCardData[], options: ExportOptions = {}) {
  const listsMap = new Map<string, any>();

  for (const c of cards) {
    if (!listsMap.has(c.listTitle)) {
      listsMap.set(c.listTitle, { title: c.listTitle, cards: [] });
    }
    const cardObj: any = {
      title: c.title,
      description: c.description || "",
      createdAt: c.createdAt,
    };
    if (options.includeStatus !== false) cardObj.status = c.status || "";
    if (options.includePriority !== false) cardObj.priority = c.priority || "";
    if (options.includeDueDate !== false) cardObj.dueDate = c.dueDate || null;
    if (options.includeAssignments !== false)
      cardObj.assignments = (c.assignments || []).map((a) => ({
        userId: a.userId || "",
        userName: a.userName || "",
        userImage: a.userImage || "",
      }));
    if (options.includeSubtasks !== false)
      cardObj.subtasks = (c.subtasks || []).map((s) => ({
        title: s.title,
        isCompleted: s.isCompleted,
      }));
    if (options.includeComments !== false)
      cardObj.comments = (c.comments || []).map((cm) => ({
        userName: cm.userName || "Member",
        text: cm.text || cm.content || "",
      }));
    if (options.includeLinks !== false)
      cardObj.links = (c.attachments || []).flatMap((att) => {
        if (att.type === "link" || (!att.type && att.url)) {
          const url = att.url || att.link || "";
          if (url && !/\.(png|jpg|jpeg|gif|webp|pdf|docx|xlsx)$/i.test(url)) {
            return [url];
          }
        }
        return [];
      });
    if (options.includeTags !== false)
      cardObj.tags = (c.tags || []).flatMap((t) =>
        t.tag ? [{ name: t.tag.name, color: t.tag.color }] : []
      );

    listsMap.get(c.listTitle)!.cards.push(cardObj);
  }

  const exportData = {
    boardTitle,
    exportedAt: new Date().toISOString(),
    lists: Array.from(listsMap.values()),
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${slugify(boardTitle)}_export.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── CSV IMPORT PARSER ─────────────────────────────────────────────────────────

export function parseCSVImport(csvText: string) {
  try {
    const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
      throw new Error("CSV file is empty or missing headers.");
    }

    const headers = parseCSVRow(lines[0]).map((h) =>
      h.toLowerCase().replace(/[\"']/g, "").trim()
    );

    const idx = {
      title: headers.findIndex((h) => h.includes("title") && !h.includes("list")),
      list: headers.findIndex((h) => h.includes("list")),
      desc: headers.findIndex((h) => h.includes("description")),
      status: headers.findIndex((h) => h.includes("status")),
      priority: headers.findIndex((h) => h.includes("priority")),
      dueDate: headers.findIndex((h) => h.includes("due")),
      assignees: headers.findIndex((h) => h.includes("assign")),
      subtasks: headers.findIndex((h) => h.includes("subtask")),
      comments: headers.findIndex((h) => h.includes("comment")),
      links: headers.findIndex((h) => h.includes("link")),
      tags: headers.findIndex((h) => h.includes("tag")),
    };

    if (idx.title === -1 || idx.list === -1) {
      throw new Error("CSV must contain 'Card Title' and 'List' columns.");
    }

    const listsMap = new Map<string, any[]>();

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVRow(lines[i]);
      const cardTitle = col(cols, idx.title);
      const listTitle = col(cols, idx.list) || "General";
      if (!cardTitle) continue;

      const subtasksRaw = col(cols, idx.subtasks);
      const commentsRaw = col(cols, idx.comments);
      const linksRaw = col(cols, idx.links);
      const assigneesRaw = col(cols, idx.assignees);

      const subtasks = subtasksRaw
        ? subtasksRaw
            .split(" ; ")
            .filter(Boolean)
            .map((st) => {
              const isDone = st.startsWith("[Done]");
              const title = st.replace(/^\[(Done|Pending|X| )\]\s*/, "").trim();
              return { title, isCompleted: isDone };
            })
        : [];

      const comments = commentsRaw
        ? commentsRaw
            .split(" ; ")
            .filter(Boolean)
            .map((cm) => {
              const colonIdx = cm.indexOf(":");
              if (colonIdx > 0) {
                return {
                  userName: cm.slice(0, colonIdx).trim(),
                  text: cm.slice(colonIdx + 1).trim(),
                };
              }
              return { userName: "Member", text: cm.trim() };
            })
        : [];

      const links = linksRaw
        ? linksRaw
            .split(" ; ")
            .map((lk) => lk.trim())
            .filter(Boolean)
        : [];

      const assignments = assigneesRaw
        ? assigneesRaw
            .split(" ; ")
            .map((s) => s.trim())
            .filter(Boolean)
            .map((s) => {
              // Format: "userId|userName|userImage" (new) or "name" (old)
              const parts = s.split("|");
              if (parts.length >= 2) {
                return {
                  userId: parts[0].trim(),
                  userName: parts[1].trim(),
                  userImage: parts[2]?.trim() || "",
                };
              }
              return { userId: "", userName: s, userImage: "" };
            })
        : [];

      const tagsRaw = col(cols, idx.tags);
      const tags = tagsRaw
        ? tagsRaw
            .split(" ; ")
            .map((t) => t.trim())
            .filter(Boolean)
            .map((t) => {
              const colonIdx = t.lastIndexOf(":");
              if (colonIdx > 0) {
                return { name: t.slice(0, colonIdx).trim(), color: t.slice(colonIdx + 1).trim() };
              }
              return { name: t, color: "#6366f1" };
            })
        : [];

      const cardObj = {
        title: cardTitle,
        description: col(cols, idx.desc),
        status: col(cols, idx.status) || undefined,
        priority: col(cols, idx.priority) || undefined,
        dueDate: col(cols, idx.dueDate) || undefined,
        subtasks,
        comments,
        links,
        assignments,
        tags,
      };

      if (!listsMap.has(listTitle)) listsMap.set(listTitle, []);
      listsMap.get(listTitle)!.push(cardObj);
    }

    const lists = Array.from(listsMap.entries()).map(([title, cards]) => ({
      title,
      cards,
    }));

    return { boardName: "Imported CSV Board", lists };
  } catch (err: any) {
    throw new Error(err?.message || "Failed to parse CSV file.");
  }
}

// ─── JSON/TRELLO IMPORT PARSER ─────────────────────────────────────────────────

export function parseTrelloJSON(jsonString: string) {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== "object") {
      throw new Error("Invalid JSON format");
    }

    // Native JSON export format (from our own exportToJSON)
    if (Array.isArray(data.lists) && data.boardTitle) {
      return {
        boardName: data.boardTitle || "Imported Board",
        lists: data.lists.map((l: any) => ({
          title: l.title || "Untitled List",
          cards: (l.cards || []).map((c: any) => ({
            title: c.title || "Untitled Card",
            description: c.description || "",
            status: c.status || undefined,
            priority: c.priority || undefined,
            dueDate: c.dueDate || undefined,
            subtasks: Array.isArray(c.subtasks) ? c.subtasks : [],
            comments: Array.isArray(c.comments) ? c.comments : [],
            links: Array.isArray(c.links) ? c.links : [],
            assignments: Array.isArray(c.assignments) ? c.assignments : [],
            tags: Array.isArray(c.tags) ? c.tags : [],
          })),
        })),
      };
    }

    // Trello JSON format
    const trelloLists = Array.isArray(data.lists) ? data.lists : [];
    const trelloCards = Array.isArray(data.cards) ? data.cards : [];
    const trelloChecklists = Array.isArray(data.checklists) ? data.checklists : [];
    const trelloActions = Array.isArray(data.actions) ? data.actions : [];

    const mappedLists = trelloLists.flatMap((l: any) =>
      l.closed
        ? []
        : [
            {
              title: l.name || "Untitled List",
              cards: trelloCards.flatMap((c: any) =>
                c.idList !== l.id || c.closed
                  ? []
                  : [
                      {
                        title: c.name || "Untitled Card",
                        description: c.desc || "",
                        dueDate: c.due || undefined,
                        subtasks: trelloChecklists.flatMap((cl: any) =>
                          cl.idCard === c.id
                            ? (cl.checkItems || []).map((item: any) => ({
                                title: item.name || "",
                                isCompleted: item.state === "complete",
                              }))
                            : []
                        ),
                        comments: trelloActions.flatMap((a: any) =>
                          a.type === "commentCard" && a.data?.card?.id === c.id
                            ? [
                                {
                                  userName: a.memberCreator?.fullName || "Trello Member",
                                  text: a.data?.text || "",
                                },
                              ]
                            : []
                        ),
                      },
                    ]
              ),
            },
          ]
    );

    return { boardName: data.name || "Imported Board", lists: mappedLists };
  } catch (err: any) {
    throw new Error(err?.message || "Failed to parse JSON file.");
  }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function csvCell(value: string): string {
  return `"${(value || "").replace(/"/g, '""')}"`;
}

function slugify(str: string): string {
  return str.toLowerCase().replace(/\s+/g, "_").replace(/[^\w_]/g, "");
}

function col(cols: string[], index: number): string {
  if (index === -1) return "";
  return cols[index] || "";
}

function parseCSVRow(rowStr: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];
    if (char === '"') {
      if (inQuotes && rowStr[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function downloadCSV(filename: string, content: string) {
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
