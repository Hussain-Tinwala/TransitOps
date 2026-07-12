// server.ts
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
  });

  io.on("connection", (socket) => {
    console.log("Client connected to Socket.io:", socket.id);

    // When one client updates the database, they emit this.
    // The server then broadcasts it to EVERYONE ELSE to refresh their screens.
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