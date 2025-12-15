import { Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  Message,
  ServerToClientEvents,
  User,
} from "./types.ts";
import { useCallback, useEffect, useRef, useState } from "react";

interface ChatRoomProps {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  username: string;
  roomId: string;
}

const ChatRoom = ({ socket, username, roomId }: ChatRoomProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | null>(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Join room on mount
  useEffect(() => {
    socket.emit(
      "join-room",
      roomId,
      username,
      (initialMessages, initialUsers) => {
        setMessages(initialMessages);
        setUsers(initialUsers);
      }
    );

    // Listen for new messages
    socket.on("message-received", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for users joining
    socket.on("user-joined", (user) => {
      setUsers((prev) => [...prev, user]);
    });

    // Listen for users leaving
    socket.on("user-left", (userId) => {
      setUsers((prev) => prev.filter((user) => user.id !== userId));
    });

    // Listen for typing indicators
    socket.on("user-typing", (typingUsername) => {
      setTypingUsers((prev) => new Set(prev).add(typingUsername));
    });

    socket.on("user-stop-typing", (typingUsername) => {
      setTypingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(typingUsername);
        return newSet;
      });
    });

    return () => {
      socket.off("message-received");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("user-typing");
      socket.off("user-stop-typing");
    };
  }, [socket, roomId, username]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);

    // Emit typing event
    socket.emit("typing", roomId, username);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to emit stop-typing
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", roomId, username);
    }, 1000);
  };

  const handleSendMessage = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (inputMessage.trim() && socket.id) {
        const message: Omit<Message, "id" | "timestamp"> = {
          text: inputMessage.trim(),
          userId: socket.id,
          username: username,
          roomId: roomId,
        };

        socket.emit("send-message", message);
        setInputMessage("");
        socket.emit("stop-typing", roomId, username);

        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    },
    [inputMessage, socket, username, roomId]
  );

  const formatTime = (timestamp: Date) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div
      style={{ display: "flex", height: "calc(100vh - 120px)", gap: "20px" }}
    >
      {/* Users sidebar */}
      <div
        style={{
          width: "250px",
          borderRight: "1px solid #ccc",
          padding: "10px",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        <h3>Online Users ({users.length})</h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {users.map((user) => (
            <li
              key={user.id}
              style={{
                padding: "8px",
                marginBottom: "5px",
                backgroundColor:
                  user.username === username ? "#d1e7ff" : "white",
                borderRadius: "4px",
                fontWeight: user.username === username ? "bold" : "normal",
              }}
            >
              {user.username === username
                ? `${user.username} (You)`
                : user.username}
            </li>
          ))}
        </ul>
      </div>

      {/* Chat area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            backgroundColor: "#ffffff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            marginBottom: "10px",
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                marginBottom: "15px",
                padding: "10px",
                backgroundColor:
                  message.userId === socket.id ? "#dcf8c6" : "#f1f1f1",
                borderRadius: "8px",
                color: "black",
                maxWidth: "70%",
                marginLeft: message.userId === socket.id ? "auto" : "0",
                marginRight: message.userId === socket.id ? "0" : "auto",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "14px",
                  marginBottom: "5px",
                  color: message.userId === socket.id ? "#075e54" : "#007bff",
                }}
              >
                {message.username === username ? "You" : message.username}
              </div>
              <div style={{ fontSize: "16px", marginBottom: "5px" }}>
                {message.text}
              </div>
              <div
                style={{ fontSize: "12px", color: "#666", textAlign: "right" }}
              >
                {formatTime(message.timestamp)}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div
            style={{
              padding: "5px 10px",
              fontSize: "14px",
              color: "#666",
              fontStyle: "italic",
            }}
          >
            {Array.from(typingUsers).join(", ")}{" "}
            {typingUsers.size === 1 ? "is" : "are"} typing...
          </div>
        )}

        {/* Message input */}
        <form
          onSubmit={handleSendMessage}
          style={{ display: "flex", gap: "10px" }}
        >
          <input
            type="text"
            placeholder="Type a message..."
            value={inputMessage}
            onChange={handleInputChange}
            style={{
              flex: 1,
              padding: "12px",
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "4px",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "12px 30px",
              fontSize: "16px",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
