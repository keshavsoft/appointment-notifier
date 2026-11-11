const validRoles = new Set(["doctor", "display", "reception"]);

export function handleConnection({ ws, role, channels }) {
    if (!validRoles.has(role)) {
        ws.close(1008, "Unknown role");
        return;
    }

    if (role === "display" || role === "reception") {
        channels[role].add(ws);
        ws.on("close", () => channels[role].delete(ws));
        ws.send(JSON.stringify({ type: "connected", channel: role }));
        return;
    }

    ws.on("message", (raw) => {
        let payload;
        try {
            payload = JSON.parse(raw.toString());
        } catch {
            ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
            return;
        }

        const target = payload.target;
        const message = typeof payload.message === "string" ? payload.message.trim() : "";

        if (!["display", "reception"].includes(target) || !message || message.length > 120) {
            ws.send(JSON.stringify({ type: "error", message: "Choose a channel and enter a message (max 120 characters)." }));
            return;
        }

        const event = JSON.stringify({
            type: "announcement",
            target,
            message,
            sentAt: Date.now()
        });

        let delivered = 0;
        for (const client of channels[target]) {
            if (client.readyState === 1) {
                client.send(event);
                delivered++;
            }
        }

        ws.send(JSON.stringify({ type: "sent", target, delivered }));
    });
}
