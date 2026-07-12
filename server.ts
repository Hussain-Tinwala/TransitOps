import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(server, {
    path: "/api/socket",
    addTrailingSlash: false,
  });

  // THIS WAS MISSING: Allows Next.js to proxy WebSocket connections
  // Allows Next.js to proxy WebSocket connections safely
  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url!, true);
    if (pathname === "/api/socket") {
      io.engine.handleUpgrade(req, socket, head);
    }
    // CRITICAL FIX: Do NOT destroy the socket here. 
    // Next.js needs the other sockets for /_next/webpack-hmr to live-reload the browser!
  });

  io.on("connection", (socket) => {
    console.log("Client connected to Socket.io:", socket.id);
    socket.on("state_changed", () => {
      socket.broadcast.emit("refresh_data");
    });
    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Custom Socket.io server running`);
  });
});