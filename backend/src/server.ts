import express from "express";
import * as http from "http";
import { Server, Socket } from "socket.io";

import type {
  ClientToServerEvents,
  Message,
  ServerToClientEvents,
  User,
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

// Store messages and users by room
const roomMessagesStore: Record<string, Message[]> = {};
const roomUsersStore: Record<string, User[]> = {};
const socketToUserMap: Record<string, { roomId: string; username: string }> = {};

io.on("connection", (socket: TypedSocket) => {
  const clientId = socket.id;
  console.log(`Client connected: ${clientId}`);

  socket.on("join-room", (roomId, username, callback) => {
    socket.join(roomId);
    console.log(`Client ${clientId} (${username}) joined room: ${roomId}`);

    // Initialize room stores if they don't exist
    if (!roomMessagesStore[roomId]) {
      roomMessagesStore[roomId] = [];
    }
    if (!roomUsersStore[roomId]) {
      roomUsersStore[roomId] = [];
    }

    // Add user to room
    const user: User = { id: clientId, username };
    roomUsersStore[roomId].push(user);
    socketToUserMap[clientId] = { roomId, username };

    // Send existing messages and users to the joining client
    callback(roomMessagesStore[roomId], roomUsersStore[roomId]);

    // Notify other users in the room
    socket.to(roomId).emit("user-joined", user);
  });

  socket.on("send-message", (messageData) => {
    const message: Message = {
      ...messageData,
      id: `${Date.now()}-${clientId}`,
      timestamp: new Date(),
    };

    // Store message
    if (!roomMessagesStore[message.roomId]) {
      roomMessagesStore[message.roomId] = [];
    }
    
    roomMessagesStore[message.roomId]!.push(message);

    // Broadcast to all clients in the room including sender
    io.to(message.roomId).emit("message-received", message);
    console.log(`Message from ${message.username} in room ${message.roomId}: ${message.text}`);
  });

  socket.on("typing", (roomId, username) => {
    socket.to(roomId).emit("user-typing", username);
  });

  socket.on("stop-typing", (roomId, username) => {
    socket.to(roomId).emit("user-stop-typing", username);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${clientId}`);
    
    const userInfo = socketToUserMap[clientId];
    if (userInfo) {
      const { roomId } = userInfo;
      
      // Remove user from room
      if (roomUsersStore[roomId]) {
        roomUsersStore[roomId] = roomUsersStore[roomId].filter(
          (user) => user.id !== clientId
        );
      }

      // Notify other users
      socket.to(roomId).emit("user-left", clientId);
      
      // Clean up
      delete socketToUserMap[clientId];
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Chat server is running on port ${PORT}`);
});
