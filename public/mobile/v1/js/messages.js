export function createCallMessage(number) {
  return JSON.stringify({
    type: "call",
    number: String(number)
  });
}
