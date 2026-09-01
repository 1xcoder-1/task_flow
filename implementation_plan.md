# Performance Fix: Slow Folder & Board Navigation

## Problem

Opening folders (Year → Month → Day) and boards takes too long. Going back and re-opening the same page re-fetches everything from scratch, doubling load time.

## Root Cause Analysis

I found **6 major bottlenecks** causing the slowness:

### 🔴 Bottleneck 1: Inngest blocks folder page render (CRITICAL)

[`folder/[folderId]/page.tsx`](file:///c:/Users/coder/Desktop/mannabi_team_mangemenet/app/(platform)/(dashboard)/organization/[organizationId]/folder/[folderId]/page.tsx) line 71-81:
```ts
// This runs EVERY time you open a folder and blocks rendering!
await inngest.send({
  name: "app/folder.init",
  data: { orgId: organizationId, folderId: folder.id },
});
```
This makes an **HTTP call to the Inngest server** every single time you open a folder. The page waits for this call to complete before rendering anything. This alone can add 500-2000ms+ delay.

### 🔴 Bottleneck 2: Board layout makes duplicate DB calls (CRITICAL)

[`board/[boardId]/layout.tsx`](file:///c:/Users/coder/Desktop/mannabi_team_mangemenet/app/(platform)/(dashboard)/board/[boardId]/layout.tsx) calls `db.board.findUnique()` **twice** — once in `generateMetadata()` (line 18) and once in `BoardIdLayout()` (line 41). Then [`board/[boardId]/page.tsx`](file:///c:/Users/coder/Desktop/mannabi_team_mangemenet/app/(platform)/(dashboard)/board/[boardId]/page.tsx) calls it a **third time** (line 18). That's 3 DB queries for the same board on every visit.

### 🟡 Bottleneck 3: Board page eagerly loads ALL card relations

[`board/[boardId]/page.tsx`](file:///c:/Users/coder/Desktop/mannabi_team_mangemenet/app/(platform)/(dashboard)/board/[boardId]/page.tsx) lines 27-53 include:
- `comments: true` — ALL comments for ALL cards
- `attachments: true` — ALL attachments for ALL cards
- `assignments: true` — ALL assignments for ALL cards
- `tags: { include: { tag: true } }` — ALL tags for ALL cards

For a board with many cards, this is **one massive DB query** returning far more data than the Kanban view needs (only card title, priority, dueDate, etc. are shown on the board).

### 🟡 Bottleneck 4: Liveblocks WebSocket overhead on folder pages

[`organization/[organizationId]/layout.tsx`](file:///c:/Users/coder/Desktop/mannabi_team_mangemenet/app/(platform)/(dashboard)/organization/[organizationId]/layout.tsx) wraps **everything** (including folder browsing) in `LiveblocksAppProvider` + `LiveblocksRoomProvider`. This means:
- Opening Year folders → WebSocket connection initiated
- Opening Month folders → same overhead  
- Opening Day folders → same overhead

The folder pages don't need real-time collaboration at all.

### 🟡 Bottleneck 5: No Next.js caching — every navigation re-fetches

All pages are async Server Components with no `unstable_cache` or `revalidate`. When you go back from a board to a Day folder and then re-open the same board, Next.js throws away all server-rendered data and re-fetches from the database.

### 🟢 Bottleneck 6: Missing database indexes

The `Board` model lacks an `@@index([orgId])` which slows down queries like `db.board.findMany({ where: { orgId } })` used on the org page and search. The `Folder` model also lacks `@@index([orgId])`.

---

## Proposed Changes

### Fix 1: Make inngest.send() non-blocking (fire-and-forget)

#### [MODIFY] [`folder/[folderId]/page.tsx`](file:///c:/Users/coder/Desktop/mannabi_team_mangemenet/app/(platform)/(dashboard)/organization/[organizationId]/folder/[folderId]/page.tsx)

Remove `await` from `inngest.send()`. The folder init is idempotent (it only creates if not exists), so we don't need to wait for it. Fire and forget.

```diff
  if (folder && folder.title !== "Important") {
-   try {
-     await inngest.send({
-       name: "app/folder.init",
-       data: {
-         orgId: organizationId,
-         folderId: folder.id,
-       },
-     });
-   } catch (error) {
-     console.error("Failed to send inngest event:", error);
-   }
+   // Fire-and-forget: don't block page render
+   inngest.send({
+     name: "app/folder.init",
+     data: { orgId: organizationId, folderId: folder.id },
+   }).catch((e) => console.error("Inngest folder.init failed:", e));
  }
```

**Impact:** Saves 500-2000ms per folder open.

---

### Fix 2: Deduplicate board DB calls

#### [MODIFY] [`board/[boardId]/layout.tsx`](file:///c:/Users/coder/Desktop/mannabi_team_mangemenet/app/(platform)/(dashboard)/board/[boardId]/layout.tsx)

Use `React.cache()` to deduplicate the `db.board.findUnique()` call across `generateMetadata` and `BoardIdLayout`. Next.js automatically dedupes `fetch` calls, but not raw DB queries.

```diff
+ import { cache } from "react";
+
+ const getBoard = cache(async (boardId: string, orgId: string) => {
+   return db.board.findUnique({ where: { id: boardId, orgId } });
+ });
```

Then use `getBoard(boardId, orgId)` in both `generateMetadata()` and `BoardIdLayout()`.

#### [MODIFY] [`board/[boardId]/page.tsx`](file:///c:/Users/coder/Desktop/mannabi_team_mangemenet/app/(platform)/(dashboard)/board/[boardId]/page.tsx)

Remove the third `db.board.findUnique()` call and just use the cached version. The board data is already validated in the layout (which runs first).

**Impact:** Eliminates 2 unnecessary DB round-trips per board load.

---

### Fix 3: Slim down the board page query

#### [MODIFY] [`board/[boardId]/page.tsx`](file:///c:/Users/coder/Desktop/mannabi_team_mangemenet/app/(platform)/(dashboard)/board/[boardId]/page.tsx)

Only include the `_count` for comments and attachments, and include `assignments` (for avatars) and `tags`. Comments and attachments are only needed inside the card modal, not on the Kanban board.

```diff
  include: {
    cards: {
      orderBy: { order: "asc" },
      include: {
-       comments: true,
-       attachments: true,
+       _count: {
+         select: { comments: true, attachments: true, subtasks: true },
+       },
        assignments: true,
        tags: { include: { tag: true } },
      },
    },
  },
```

**Impact:** Reduces data transfer by 50-80% for boards with many comments/attachments.

---

### Fix 4: Remove Liveblocks from org layout, keep only on board

#### [MODIFY] [`organization/[organizationId]/layout.tsx`](file:///c:/Users/coder/Desktop/mannabi_team_mangemenet/app/(platform)/(dashboard)/organization/[organizationId]/layout.tsx)

Remove `LiveblocksAppProvider` and `LiveblocksRoomProvider` from the org layout. Folder browsing doesn't need real-time collaboration.

```diff
- import { LiveblocksAppProvider } from "@/components/providers/liveblocks-provider";
- import { LiveblocksRoomProvider } from "@/components/providers/liveblocks-room-provider";

  const OrganizationIdLayout = async (props) => {
    const { organizationId } = await props.params;
    return (
-     <LiveblocksAppProvider>
-       <LiveblocksRoomProvider roomId={organizationId}>
-         <OrgControl />
-         {props.children}
-       </LiveblocksRoomProvider>
-     </LiveblocksAppProvider>
+     <>
+       <OrgControl />
+       {props.children}
+     </>
    );
  };
```

**Impact:** Eliminates WebSocket connection overhead + auth API call on all folder navigation.

---

### Fix 5: Add Next.js cache to folder & board queries

#### [MODIFY] All folder list components

Add `unstable_cache` to wrap the DB queries with short revalidation (30 seconds), so navigating back doesn't re-query the DB.

Affected files:
- [`year-folder-list.tsx`](file:///c:/Users/coder/Desktop/mannabi_team_mangemenet/app/(platform)/(dashboard)/organization/[organizationId]/folder/[folderId]/_components/year-folder-list.tsx)
- [`month-folder-list.tsx`](file:///c:/Users/coder/Desktop/mannabi_team_mangemenet/app/(platform)/(dashboard)/organization/[organizationId]/folder/[folderId]/year/[yearId]/_components/month-folder-list.tsx)
- [`day-folder-list.tsx`](file:///c:/Users/coder/Desktop/mannabi_team_mangemenet/app/(platform)/(dashboard)/organization/[organizationId]/folder/[folderId]/year/[yearId]/month/[monthId]/_components/day-folder-list.tsx)
- [`day-board-list.tsx`](file:///c:/Users/coder/Desktop/mannabi_team_mangemenet/app/(platform)/(dashboard)/organization/[organizationId]/folder/[folderId]/year/[yearId]/month/[monthId]/day/[dayId]/_components/day-board-list.tsx)

```ts
import { unstable_cache } from "next/cache";

const getCachedYearFolders = unstable_cache(
  async (folderId: string) => db.yearFolder.findMany({
    where: { folderId },
    orderBy: { createdAt: "desc" },
  }),
  ["year-folders"],
  { revalidate: 30 }
);
```

**Impact:** Back-navigation becomes near-instant (served from cache).

---

### Fix 6: Add missing database indexes

#### [MODIFY] [`prisma/schema.prisma`](file:///c:/Users/coder/Desktop/mannabi_team_mangemenet/prisma/schema.prisma)

```diff
  model Board {
    ...
    @@index([dayFolderId])
+   @@index([orgId])
  }

  model Folder {
    ...
+   @@index([orgId])
  }

  model AuditLog {
    ...
+   @@index([orgId])
  }

  model Notification {
    ...
+   @@index([assignedToId])
  }
```

**Impact:** Faster queries when filtering boards and folders by orgId.

---

## Summary of Expected Speed Improvements

| Bottleneck | Before | After | Improvement |
|------------|--------|-------|-------------|
| Inngest blocking render | 500-2000ms wait | 0ms (fire-and-forget) | ⚡ **Instant** |
| Duplicate board queries | 3 DB calls | 1 DB call | **66% fewer queries** |
| Oversized board query | Full comments+attachments | Counts only | **50-80% less data** |
| Liveblocks on folders | WebSocket + auth per page | None | ⚡ **No overhead** |
| No caching | Fresh DB hit every nav | 30s cache | ⚡ **Instant on back-nav** |
| Missing indexes | Full table scans | Index lookups | **10-100x faster queries** |

---

## Verification Plan

### Automated Tests
```bash
npx prisma validate
npm run build
```

### Manual Verification
1. Open a folder → should load instantly (no inngest delay)
2. Navigate Year → Month → Day → Board — each transition should be fast
3. Click "Back" → should reload near-instantly (cached)
4. Re-open same board → should be fast (no triple DB query)
5. Open same board in 2 tabs → real-time still works (Liveblocks on board layout)
