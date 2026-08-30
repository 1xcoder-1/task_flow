import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ 
  id: "campus-team-manager",
  eventKey: process.env.INNGEST_EVENT_KEY,
});
