const statusEl = document.querySelector("#doctorStatus");
const feedback = document.querySelector("#feedback");
const wsProtocol = location.protocol === "https:" ? "wss:" : "ws:";
const socket = new WebSocket(`${wsProtocol}//${location.host}/ws?role=doctor`);
const tabs = [...document.querySelectorAll(".tab")];
const panels = { display: document.querySelector("#display-panel"), reception: document.querySelector("#reception-panel") };

tabs.forEach((tab) => tab.addEventListener("click", () => {
  const selected = tab.dataset.tab;
  tabs.forEach((item) => item.classList.toggle("active", item === tab));
  Object.entries(panels).forEach(([name, panel]) => { panel.hidden = name !== selected; panel.classList.toggle("active", name === selected); });
  feedback.textContent = "";
}));

socket.addEventListener("open", () => { statusEl.classList.add("connected"); statusEl.innerHTML = "<i></i> Connected and ready"; });
socket.addEventListener("close", () => { statusEl.classList.remove("connected"); statusEl.innerHTML = "<i></i> Disconnected — refresh to reconnect"; });
socket.addEventListener("error", () => { statusEl.classList.remove("connected"); statusEl.innerHTML = "<i></i> Connection problem"; });
socket.addEventListener("message", (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "sent") feedback.textContent = `Sent to ${data.target}. ${data.delivered} screen(s) received it.`;
  else if (data.type === "error") feedback.textContent = data.message;
});

const selections = { display: "", reception: "" };
const outputs = { display: document.querySelector("#displaySelectedNumber"), reception: document.querySelector("#receptionSelectedNumber") };
const sendButtons = { display: document.querySelector("#sendDisplay"), reception: document.querySelector("#sendReception") };
function update(target) { outputs[target].textContent = selections[target] || "—"; sendButtons[target].disabled = !selections[target]; }

document.querySelectorAll("[data-keypad]").forEach((keypad) => {
  const target = keypad.dataset.keypad;
  keypad.querySelectorAll("[data-digit]").forEach((button) => button.addEventListener("click", () => {
    if (selections[target].length < 3) selections[target] += button.dataset.digit;
    update(target);
  }));
  keypad.querySelector('[data-action="clear"]').addEventListener("click", () => { selections[target] = ""; update(target); });
  keypad.querySelector('[data-action="backspace"]').addEventListener("click", () => { selections[target] = selections[target].slice(0, -1); update(target); });
});

function send(target) {
  if (!selections[target]) return;
  if (socket.readyState !== WebSocket.OPEN) { feedback.textContent = "Not connected. Please wait or refresh the page."; return; }
  socket.send(JSON.stringify({ target, message: selections[target] }));
  selections[target] = "";
  update(target);
}
sendButtons.display.addEventListener("click", () => send("display"));
sendButtons.reception.addEventListener("click", () => send("reception"));
