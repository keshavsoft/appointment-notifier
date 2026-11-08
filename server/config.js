import fs from "node:fs";
import { fileURLToPath } from "node:url";

const envFilePath = fileURLToPath(new URL("../.env", import.meta.url));

function readPortFromEnvFile() {
    let contents;

    try {
        contents = fs.readFileSync(envFilePath, "utf8");
    } catch (error) {
        if (error.code === "ENOENT") return undefined;
        throw error;
    }

    let port;

    for (const rawLine of contents.split(/\r?\n/)) {
        const line = rawLine.trim();
        const assignment = line.match(/^(?:export\s+)?PORT\s*=\s*(.*)$/);

        if (!assignment) continue;

        let value = assignment[1].trim();

        if (value.startsWith('"') || value.startsWith("'")) {
            const closingQuote = value.indexOf(value[0], 1);
            if (closingQuote !== -1) value = value.slice(1, closingQuote);
        } else {
            value = value.replace(/\s+#.*$/, "").trim();
        }

        port = value;
    }

    return port;
}

export function loadConfig(env = process.env) {
    const portValue = env.PORT ?? readPortFromEnvFile() ?? 3000;
    const port = Number(portValue);

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error("PORT must be an integer between 1 and 65535.");
    }

    return { port };
}
