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
    <div
      style={{
        padding: "20px",
        maxWidth: "1400px",
        margin: "0 auto",
        height: "100vh",
        background: "#111b21",
      }}
    >
      {!hasJoined ? (
        <>
          <div
            style={{
              textAlign: "center",
              marginBottom: "30px",
              paddingTop: "20px",
            }}
          >
            <h1
              style={{
                fontSize: "32px",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              <svg
                viewBox="0 0 39 39"
                height="39"
                width="39"
                preserveAspectRatio="xMidYMid meet"
                version="1.1"
              >
                <path
                  fill="#00a884"
                  d="M10.7 32.8l.6.3c2.5 1.5 5.3 2.2 8.1 2.2 8.8 0 16-7.2 16-16 0-4.2-1.7-8.3-4.7-11.3s-7-4.7-11.3-4.7c-8.8 0-16 7.2-15.9 16.1 0 3 .9 5.9 2.4 8.4l.4.6-1.6 5.9 6-1.5z"
                ></path>
                <path
                  fill="#fff"
                  d="M32.4 6.4C29 2.9 24.3 1 19.5 1 9.3 1 1.1 9.3 1.2 19.4c0 3.2.9 6.3 2.4 9.1L1 38l9.7-2.5c2.7 1.5 5.7 2.2 8.7 2.2 10.1 0 18.3-8.3 18.3-18.4 0-4.9-1.9-9.5-5.3-12.9zM19.5 34.6c-2.7 0-5.4-.7-7.7-2.1l-.6-.3-5.8 1.5L6.9 28l-.4-.6c-4.4-7.1-2.3-16.5 4.9-20.9s16.5-2.3 20.9 4.9 2.3 16.5-4.9 20.9c-2.3 1.5-5.1 2.3-7.9 2.3zm8.8-11.1l-1.1-.5s-1.6-.7-2.6-1.2c-.1 0-.2-.1-.3-.1-.3 0-.5.1-.7.2 0 0-.1.1-1.5 1.7-.1.2-.3.3-.5.3h-.1c-.1 0-.3-.1-.4-.2l-.5-.2c-1.1-.5-2.1-1.1-2.9-1.9-.2-.2-.5-.4-.7-.6-.7-.7-1.4-1.5-1.9-2.4l-.1-.2c-.1-.1-.1-.2-.2-.4 0-.2 0-.4.1-.5 0 0 .4-.5.7-.8.2-.2.3-.5.5-.7.2-.3.3-.7.2-1-.1-.5-1.3-3.2-1.6-3.8-.2-.3-.4-.4-.7-.5h-1.1c-.2 0-.4.1-.6.1l-.1.1c-.2.1-.4.3-.6.4-.2.2-.3.4-.5.6-.7.9-1.1 2-1.1 3.1 0 .8.2 1.6.5 2.3l.1.3c.9 1.9 2.1 3.6 3.7 5.1l.4.4c.3.3.6.5.8.8 2.1 1.8 4.5 3.1 7.2 3.8.3.1.7.1 1 .2h1c.5 0 1.1-.2 1.5-.4.3-.2.5-.2.7-.4l.2-.2c.2-.2.4-.3.6-.5s.4-.4.5-.6c.2-.4.3-.9.4-1.4v-.7s-.1-.1-.3-.2z"
                ></path>
              </svg>
              Chat Web
            </h1>
          </div>
          <div
            style={{
              maxWidth: "500px",
              margin: "0 auto",
              padding: "40px",
              borderRadius: "8px",
              backgroundColor: "#222e35",
              boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
            }}
          >
            <h2 style={{ textAlign: "center", marginBottom: "30px" }}>
              Welcome to WhatsApp Chat
            </h2>
            <form onSubmit={handleJoinRoom}>
              <input
                type="text"
                placeholder="Enter your name"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                style={{
                  width: "100%",
                  padding: "15px 20px",
                  marginBottom: "20px",
                  fontSize: "16px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#2a3942",
                  color: "#e9edef",
                }}
                autoFocus
              />
              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "15px",
                  fontSize: "16px",
                  backgroundColor: "#00a884",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                Start Messaging
              </button>
            </form>
          </div>
        </>
      ) : (
        <ChatRoom socket={socket} username={username} roomId={TEST_ROOM_ID} />
      )}
    </div>
  );
}

export default App;
