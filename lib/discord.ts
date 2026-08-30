export async function sendDiscordNotification(taskTitle: string, assignedToName: string, assignedByName: string) {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
        console.warn("DISCORD_WEBHOOK_URL is not set. Skipping Discord notification.");
        return;
    }
    
    // Construct a rich Discord Embed
    const payload = {
        embeds: [{
            title: "🔔 New Task Assigned!",
            color: 3447003, // Blue color
            description: `**Task:** ${taskTitle}\n**Assigned To:** ${assignedToName}\n**Assigned By:** ${assignedByName}`,
            timestamp: new Date().toISOString()
        }]
    };

    const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        throw new Error(`Failed to send Discord notification: ${res.status} ${res.statusText}`);
    }
}
