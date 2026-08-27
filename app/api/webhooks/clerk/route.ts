import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent, clerkClient } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  // You can find this in the Clerk Dashboard -> Webhooks -> choose the endpoint
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local')
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    })
  }

  const eventType = evt.type;

  if (eventType === 'organizationMembership.deleted') {
    const { organization, public_user_data } = evt.data;
    
    if (organization?.id && public_user_data?.user_id) {
      console.log(`Removing FolderAccess for user ${public_user_data.user_id} in org ${organization.id}`);
      
      // Delete all FolderAccess records for this user in folders that belong to this organization
      await db.folderAccess.deleteMany({
        where: {
          userId: public_user_data.user_id,
          folder: {
            orgId: organization.id
          }
        }
      });

      // User requested that removing a member from the org permanently deletes their entire Clerk account
      try {
        const client = await clerkClient();
        await client.users.deleteUser(public_user_data.user_id);
        console.log(`Permanently deleted user ${public_user_data.user_id} from Clerk.`);
      } catch (error) {
        console.error(`Failed to delete user ${public_user_data.user_id} from Clerk:`, error);
      }
    }
  }

  return new Response('', { status: 200 })
}
