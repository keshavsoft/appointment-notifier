export function startServer(server, { port }) {
    server.listen(port, () => {
        console.log("Appointment notifier listening on port " + port + " on all interfaces.");
        console.log("Local Doctor:    http://localhost:" + port + "/doctor");
        console.log("Local Display:   http://localhost:" + port + "/display");
        console.log("Local Reception: http://localhost:" + port + "/reception");
        console.log("V3 Doctor:       http://localhost:" + port + "/v3/doctor");
        console.log("V3 Display:      http://localhost:" + port + "/v3/display");
        console.log("V4 Doctor:       http://localhost:" + port + "/v4/doctor");
        console.log("V4 Display:      http://localhost:" + port + "/v4/display");
        console.log("For other devices, use this computer's IP address with port " + port + ".");
    });
}
