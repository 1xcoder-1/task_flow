import fs from 'fs';
import path from 'path';

const actions = [
  { name: 'delete-subtask', entity: 'subtask', op: 'delete' },
  { name: 'create-comment', entity: 'comment', op: 'create' },
  { name: 'delete-comment', entity: 'comment', op: 'delete' },
  { name: 'create-attachment', entity: 'attachment', op: 'create' },
  { name: 'delete-attachment', entity: 'attachment', op: 'delete' }
];

actions.forEach(({ name, entity, op }) => {
  const dir = path.join('actions', name);
  fs.mkdirSync(dir, { recursive: true });

  const capitalizedEntity = entity.charAt(0).toUpperCase() + entity.slice(1);
  const camelName = op + capitalizedEntity;
  const pascalName = op.charAt(0).toUpperCase() + op.slice(1) + capitalizedEntity;

  // index.ts
  let indexCode = '';
  if (op === 'delete') {
    indexCode = \"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";;

import { \ } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  const { id, boardId } = data;
  let \;

  try {
    \ = await db.\.delete({
      where: { id },
    });
  } catch (error) {
    return { error: "Failed to delete." };
  }

  revalidatePath(\/board/\\);
  return { data: \ };
};

export const \ = createSafeAction(\, handler);
\;
  } else if (op === 'create' && entity === 'comment') {
    indexCode = \"use server";

import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";;

import { \ } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();
  const user = await currentUser();

  if (!userId || !orgId || !user) {
    return { error: "Unauthorized" };
  }

  const { text, cardId, boardId } = data;
  let \;

  try {
    \ = await db.\.create({
      data: {
        text,
        cardId,
        userId: user.id,
        userImage: user.imageUrl,
        userName: user.firstName ? \\ \\.trim() : 'Unknown User',
      },
    });
  } catch (error) {
    return { error: "Failed to create." };
  }

  revalidatePath(\/board/\\);
  return { data: \ };
};

export const \ = createSafeAction(\, handler);
\;
  } else if (op === 'create' && entity === 'attachment') {
    indexCode = \"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";;

import { \ } from "./schema";
import { InputType, ReturnType } from "./types";
import { db } from "@/lib/db";
import { createSafeAction } from "@/lib/create-safe-action";

const handler = async (data: InputType): Promise<ReturnType> => {
  const { userId, orgId } = await auth();

  if (!userId || !orgId) {
    return { error: "Unauthorized" };
  }

  const { url, type, title, cardId, boardId } = data;
  let \;

  try {
    \ = await db.\.create({
      data: {
        url,
        type,
        title,
        cardId,
      },
    });
  } catch (error) {
    return { error: "Failed to create." };
  }

  revalidatePath(\/board/\\);
  return { data: \ };
};

export const \ = createSafeAction(\, handler);
\;
  }

  fs.writeFileSync(path.join(dir, 'index.ts'), indexCode);

  // types.ts
  fs.writeFileSync(path.join(dir, 'types.ts'), \import { z } from "zod";
import { \ } from "@prisma/client";
import { ActionState } from "@/lib/create-safe-action";
import { \ } from "./schema";

export type InputType = z.infer<typeof \>;
export type ReturnType = ActionState<InputType, \>;
\);

  // schema.ts
  let schemaCode = '';
  if (op === 'delete') {
    schemaCode = \import { z } from "zod";
export const \ = z.object({
  id: z.string(),
  boardId: z.string(),
});
\;
  } else if (op === 'create' && entity === 'comment') {
    schemaCode = \import { z } from "zod";
export const \ = z.object({
  text: z.string().min(1, "Comment cannot be empty"),
  cardId: z.string(),
  boardId: z.string(),
});
\;
  } else if (op === 'create' && entity === 'attachment') {
    schemaCode = \import { z } from "zod";
export const \ = z.object({
  url: z.string().url(),
  type: z.string(),
  title: z.string().optional(),
  cardId: z.string(),
  boardId: z.string(),
});
\;
  }
  fs.writeFileSync(path.join(dir, 'schema.ts'), schemaCode);

});

console.log('Created all missing actions');
