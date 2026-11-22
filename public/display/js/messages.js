export function createSetKeyMessage(key) {
  return JSON.stringify({
    type: "setKey",
    key,
    role: "display"
  });
}
