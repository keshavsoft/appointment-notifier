const isOpen = (ws) => ws?.readyState === 1;

export function createV3State() {
    return {
        announcement: null,
        doctors: new Set(),
        display: null
    };
}

function stateMessage(state, cause, delivered) {
    const message = {
        type: "state",
        cause,
        announcement: state.announcement,
        displayConnected: isOpen(state.display)
    };

    if (delivered !== undefined) message.delivered = delivered;
    return JSON.stringify(message);
}

function broadcastState(state, cause, delivered) {
    const message = stateMessage(state, cause, delivered);

    for (const doctor of state.doctors) {
        if (isOpen(doctor)) doctor.send(message);
    }

    if (isOpen(state.display)) state.display.send(message);
}

function sendError(ws, message) {
    if (isOpen(ws)) ws.send(JSON.stringify({ type: "error", message }));
}

export function handleV3Connection({ ws, role, state }) {
    if (role === "display-v3") {
        if (isOpen(state.display)) {
            state.display.close(4001, "A newer V3 display connected");
        }

        state.display = ws;
        ws.on("close", () => {
            if (state.display === ws) {
                state.display = null;
                broadcastState(state, "connection");
            }
        });

        broadcastState(state, "snapshot");
        return;
    }

    if (role !== "doctor-v3") {
        ws.close(1008, "Unknown V3 role");
        return;
    }

    state.doctors.add(ws);
    ws.on("close", () => state.doctors.delete(ws));
    ws.send(stateMessage(state, "snapshot"));

    ws.on("message", (raw) => {
        let payload;
        try {
            payload = JSON.parse(raw.toString());
        } catch {
            sendError(ws, "Invalid message format.");
            return;
        }

        if (payload?.type !== "call" || typeof payload.number !== "string" || !/^\d{1,3}$/.test(payload.number)) {
            sendError(ws, "Enter a number from 0 to 999 before sending.");
            return;
        }

        state.announcement = {
            number: payload.number,
            sentAt: Date.now()
        };

        broadcastState(state, "call", isOpen(state.display));
    });
}
