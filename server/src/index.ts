import express from "express";
import { createServer } from "http";
import { Server, matchMaker } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { monitor } from "@colyseus/monitor";
import { GameRoom } from "./rooms/GameRoom";

const PORT = Number(process.env.PORT ?? 2567);

async function bootstrap() {
  const app = express();

  // Parse JSON bodies
  app.use(express.json());

  // CORS for Phaser client running on localhost:3000
  app.use((req, res, next) => {
    const origin = req.headers.origin ?? "*";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Health check endpoint
  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      game: "Petaland",
    });
  });

  // Create HTTP server from express app
  const httpServer = createServer(app);

  // Create Colyseus server with WebSocket transport
  const gameServer = new Server({
    transport: new WebSocketTransport({
      server: httpServer,
      pingInterval: 5000,
      pingMaxRetries: 3,
    }),
  });

  // Register game rooms
  gameServer.define("game", GameRoom, {
    // Room metadata visible to client when listing rooms
    label: "Petaland World",
    maxClients: 100,
  });

  // Colyseus Monitor UI (dev tool — view rooms, clients, state)
  // Access at http://localhost:2567/colyseus
  if (process.env.NODE_ENV !== "production") {
    app.use("/colyseus", monitor());
    console.log(`[Petaland] Colyseus monitor: http://localhost:${PORT}/colyseus`);
  }

  // API route: list active rooms (useful for Phaser lobby)
  app.get("/api/rooms", async (_req, res) => {
    try {
      const rooms = await matchMaker.query({});
      res.json(rooms);
    } catch (err) {
      console.error("[Petaland] /api/rooms error:", err);
      res.status(500).json({ error: "Failed to list rooms." });
    }
  });

  // API route: server info for client config
  app.get("/api/info", (_req, res) => {
    res.json({
      game: "Petaland",
      version: "0.1.0",
      wsUrl: `ws://localhost:${PORT}`,
      rooms: ["game"],
    });
  });

  // Start listening
  await gameServer.listen(PORT, undefined, undefined, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║            🌸 Petaland Game Server 🌸                  ║
╠═══════════════════════════════════════════════════════╣
║  WebSocket:  ws://localhost:${PORT}                   ║
║  HTTP:       http://localhost:${PORT}                 ║
║  Monitor:    http://localhost:${PORT}/colyseus        ║
║  Health:     http://localhost:${PORT}/health          ║
╚═══════════════════════════════════════════════════════╝
    `);
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("[Petaland] Shutting down...");
    await gameServer.gracefullyShutdown();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("[Petaland] SIGTERM received, shutting down...");
    await gameServer.gracefullyShutdown();
    process.exit(0);
  });
}

bootstrap().catch((err) => {
  console.error("[Petaland] Fatal startup error:", err);
  process.exit(1);
});
