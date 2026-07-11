// server.js
import http from "http";
import app from "./src/app.js";
import { initSocket } from "./src/socket/index.js";

const PORT = process.env.PORT || 8000;

// Build a raw HTTP server FROM your Express app. Express still handles all
// normal HTTP routes; Socket.IO will hook into this same server for its
// websocket upgrade requests.
const server = http.createServer(app);

// Attach Socket.IO and get the `io` instance back.
const io = initSocket(server);

// Stash `io` on the app so any Express controller can reach it later via
// req.app.get("io") — no extra imports or circular dependencies needed.
app.set("io", io);

// NOTE: listen on `server`, not `app`, so the websocket upgrade works.
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});