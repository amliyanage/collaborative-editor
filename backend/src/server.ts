import express from "express";
import * as http from "http";
import { Server, Socket } from "socket.io";

import type {
  ClientToServerEvents,
  CodeChangePayload,
  ServerToClientEvents,
} from "./types";

const app = express();
const PORT = process.env.PORT || 3000;

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const httpServer = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const roomCodeStore: Record<string, string> = {};

io.on("connection", (socket: TypedSocket) => {
  const clientId = socket.id;
  console.log(`Client connected: ${clientId}`);

  socket.on("join-room", (roomId, callback) => {
    socket.join(roomId);
    console.log(`Client ${clientId} joined room: ${roomId}`);

    const initialCode = roomCodeStore[roomId] || "";
    callback(initialCode);

    socket.to(roomId).emit("user-joined", clientId);
  });

  socket.on("code-change", (payload: CodeChangePayload) => {
    const { newCode, roomId } = payload;
    roomCodeStore[roomId] = newCode;

    socket.to(roomId).emit("code-update", payload);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${clientId}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
