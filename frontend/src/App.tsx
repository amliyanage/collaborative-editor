import { useState } from "react";
import "./App.css";
import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./types.ts";
import ChatRoom from "./ChatRoom";

type TypeSocket = Socket<ServerToClientEvents, ClientToServerEvents>;
const socket: TypeSocket = io("http://localhost:3000");

const TEST_ROOM_ID = "ts-chat-demo-2025";

function App() {
  const [username, setUsername] = useState<string>("");
  const [hasJoined, setHasJoined] = useState(false);
  const [inputUsername, setInputUsername] = useState<string>("");

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUsername.trim()) {
      setUsername(inputUsername.trim());
      setHasJoined(true);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>💬 Real-Time Chat App</h1>
      {!hasJoined ? (
        <div
          style={{
            maxWidth: "400px",
            margin: "50px auto",
            padding: "30px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <h2>Join Chat Room: {TEST_ROOM_ID}</h2>
          <form onSubmit={handleJoinRoom}>
            <input
              type="text"
              placeholder="Enter your username"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "10px",
                fontSize: "16px",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
              autoFocus
            />
            <button
              type="submit"
              style={{
                width: "100%",
                padding: "10px",
                fontSize: "16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Join Chat
            </button>
          </form>
        </div>
      ) : (
        <ChatRoom socket={socket} username={username} roomId={TEST_ROOM_ID} />
      )}
    </div>
  );
}

export default App;
