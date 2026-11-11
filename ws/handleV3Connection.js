const isOpen = (ws) => ws?.readyState === 1;

export function createV3State() {
    return {
        announcement: null,
        doctors: new Set(),
        displays: new Set()
    };
}

function hasOpenDisplay(state) {
    for (const display of state.displays) {
        if (isOpen(display)) return true;
    }
    return false;
}

function stateMessage(state, cause, delivered) {
    const message = {
        type: "state",
        cause,
        announcement: state.announcement,
        displayConnected: hasOpenDisplay(state)
    };

    if (delivered !== undefined) message.delivered = delivered;
    return JSON.stringify(message);
}

function broadcastState(state, cause, delivered) {
    const message = stateMessage(state, cause, delivered);

    for (const doctor of state.doctors) {
        if (isOpen(doctor)) doctor.send(message);
    }

    for (const display of state.displays) {
        if (isOpen(display)) display.send(message);
    }
}

function sendError(ws, message) {
    if (isOpen(ws)) ws.send(JSON.stringify({ type: "error", message }));
}

export function handleV3Connection({ ws, role, state, requestedRole = role, connectionId = null, log = () => {} }) {
    const details = { connectionId, requestedRole, handlerRole: role };

    log("role-handler-enter", {
        ...details,
        displayAlreadyConnected: hasOpenDisplay(state),
        displayCount: state.displays.size,
        doctorCount: state.doctors.size
    });

    if (role === "display-v3") {
        state.displays.add(ws);
        log("display-registered", {
            ...details,
            displayCount: state.displays.size,
            currentDisplayConnectionId: connectionId
        });

        ws.on("close", (code, reason) => {
            state.displays.delete(ws);
            log("display-closed", {
                ...details,
                closeCode: code,
                closeReason: reason ? reason.toString() : "",
                displayCount: state.displays.size
            });

            broadcastState(state, "connection");
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

        state.announcement = {
            number: payload.number,
            sentAt: Date.now()
        };

        const displayConnected = hasOpenDisplay(state);
        log("call-received", {
            ...details,
            number: payload.number,
            displayConnected,
            displayCount: state.displays.size
        });

        broadcastState(state, "call", displayConnected);
    });
}
