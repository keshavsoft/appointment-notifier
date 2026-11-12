export function startServer(server, { port }) {
    server.listen(port, () => {
        console.log(`Appointment notifier listening on http://localhost:${port}`);
    });
}
