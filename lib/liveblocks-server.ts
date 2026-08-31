import { Liveblocks } from "@liveblocks/node";

const secretKey = process.env.LIVEBLOCKS_SECRET_KEY;

if (!secretKey) {
  throw new Error("Missing LIVEBLOCKS_SECRET_KEY environment variable.");
}

export const liveblocks = new Liveblocks({
  secret: secretKey,
});
