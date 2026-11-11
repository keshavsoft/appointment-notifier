const isOpen = (ws) => ws?.readyState === 1;

export function createV3State() {
    return { announcement: null, doctors: new Set(), display: null };
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

export function handleV3Connection({ ws, role, state, requestedRole = role, connectionId = null, log = () => {} }) {
    const details = { connectionId, requestedRole, handlerRole: role };
    log("role-handler-enter", { ...details, displayAlreadyConnected: isOpen(state.display), doctorCount: state.doctors.size });

    if (role === "display-v3") {
        if (isOpen(state.display)) {
            const previous = state.display;
            log("duplicate-display-detected", {
                ...details,
                previousConnectionId: previous.careCallConnectionId || null,
                action: "closing-previous-display",
                closeCode: 4001,
                closeReason: "A newer display connected"
            });
            previous.close(4001, "A newer display connected");
        }

        state.display = ws;
        log("display-registered", { ...details, currentDisplayConnectionId: connectionId });
        ws.on("close", (code, reason) => {
            const isCurrent = state.display === ws;
            log("display-closed", {
                ...details,
                closeCode: code,
                closeReason: reason ? reason.toString() : "",
                wasCurrentDisplay: isCurrent,
                currentDisplayConnectionId: state.display?.careCallConnectionId || null
            });
            if (isCurrent) {
                state.display = null;
                broadcastState(state, "connection");
            }
        });
        broadcastState(state, "snapshot");
        return;
    }

    if (role !== "doctor-v3") {
        log("unknown-versioned-role", details);
        ws.close(1008, "Unknown role");
        return;
    }

    state.doctors.add(ws);
    log("doctor-registered", { ...details, doctorCount: state.doctors.size });
    ws.on("close", (code, reason) => {
        state.doctors.delete(ws);
        log("doctor-closed", {
            ...details,
            closeCode: code,
            closeReason: reason ? reason.toString() : "",
            doctorCount: state.doctors.size
        });
    });
    ws.send(stateMessage(state, "snapshot"));

    ws.on("message", (raw) => {
        let payload;
        try {
            payload = JSON.parse(raw.toString());
        } catch {
            sendError(ws, "Invalid message format.");
            log("doctor-invalid-json", details);
            return;
        }

        // Accept only decimal digits, including the number 0, up to three digits.
        if (payload?.type !== "call" || typeof payload.number !== "string" || !/^\d{1,3}$/.test(payload.number)) {
            sendError(ws, "Enter a number from 0 to 999 before sending.");
            log("doctor-invalid-call", { ...details, payloadType: payload?.type || null, number: payload?.number ?? null });
            return;
        }

        state.announcement = { number: payload.number, sentAt: Date.now() };
        log("call-received", {
            ...details,
            number: payload.number,
            displayConnected: isOpen(state.display),
            displayConnectionId: state.display?.careCallConnectionId || null
        });
        broadcastState(state, "call", isOpen(state.display));
    });
}
