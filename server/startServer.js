export function startServer(server, { port, host = "0.0.0.0" }) {
    server.listen(port, host, () => {
        console.log(`Appointment notifier listening on http://${host}:${port}`);
    });
}
