import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const logDirectory = path.join(projectRoot, "logs");
const logFile = path.join(logDirectory, "log.txt");

export function writeWsLog(event, details = {}) {
    try {
        fs.mkdirSync(logDirectory, { recursive: true });
        const entry = {
            time: new Date().toISOString(),
            pid: process.pid,
            event,
            ...details
        };
        fs.appendFileSync(logFile, JSON.stringify(entry) + "\\n", "utf8");
    } catch (error) {
        console.error("Unable to write WebSocket log:", error);
    }
}

export function getWsLogPath() {
    return logFile;
}
