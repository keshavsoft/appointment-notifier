import { notifyPresence } from "../../broadcast.js";

export function onClose(wss) {
  notifyPresence(wss);
}
