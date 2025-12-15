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

  const uniqueUsers = Array.from(new Map(users.map((u) => [u.id, u])).values());

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 60px)",
        gap: "0",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
      }}
    >
      {/* Users sidebar - WhatsApp style */}
      <div
        style={{
          width: "350px",
          backgroundColor: "#111b21",
          borderRight: "1px solid #2a3942",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: "15px 20px",
            backgroundColor: "#202c33",
            borderBottom: "1px solid #2a3942",
          }}
        >
          <h3
            style={{
              margin: 0,
              padding: 0,
              border: "none",
              fontSize: "18px",
              color: "#e9edef",
            }}
          >
            Chats
          </h3>
        </div>

        {/* Users list */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px 0",
          }}
        >
          {uniqueUsers.map((user) => (
            <div
              key={user.id}
              style={{
                padding: "12px 20px",
                backgroundColor:
                  user.username === username ? "#2a3942" : "transparent",
                cursor: "pointer",
                borderLeft:
                  user.username === username
                    ? "4px solid #00a884"
                    : "4px solid transparent",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                if (user.username !== username) {
                  e.currentTarget.style.backgroundColor = "#202c33";
                }
              }}
              onMouseLeave={(e) => {
                if (user.username !== username) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    width: "45px",
                    height: "45px",
                    borderRadius: "50%",
                    backgroundColor: "#00a884",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: "500",
                    color: "#fff",
                    flexShrink: 0,
                  }}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: "#e9edef",
                      fontSize: "16px",
                      fontWeight: user.username === username ? "500" : "400",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {user.username === username
                      ? `${user.username} (You)`
                      : user.username}
                  </div>
                  <div
                    style={{
                      color: "#8696a0",
                      fontSize: "13px",
                      marginTop: "2px",
                    }}
                  >
                    {user.username === username ? "online" : "online"}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area - WhatsApp style */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0b141a",
        }}
      >
        {/* Chat Header */}
        <div
          style={{
            padding: "15px 20px",
            backgroundColor: "#202c33",
            borderBottom: "1px solid #2a3942",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: "#00a884",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "16px",
              fontWeight: "500",
              color: "#fff",
            }}
          >
            👥
          </div>
          <div>
            <div
              style={{
                color: "#e9edef",
                fontSize: "16px",
                fontWeight: "500",
              }}
            >
              Group Chat
            </div>
            <div
              style={{
                color: "#8696a0",
                fontSize: "13px",
              }}
            >
              {users.length} participants
            </div>
          </div>
        </div>

        {/* Messages area with WhatsApp background pattern */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0H5v5H0v1h5v94h1V6h94V5H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundColor: "#0b141a",
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                marginBottom: "12px",
                display: "flex",
                justifyContent:
                  message.userId === socket.id ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "65%",
                  padding: "8px 12px 8px 12px",
                  backgroundColor:
                    message.userId === socket.id ? "#005c4b" : "#202c33",
                  borderRadius: "8px",
                  boxShadow: "0 1px 0.5px rgba(0,0,0,0.13)",
                  position: "relative",
                }}
              >
                {message.username !== username && (
                  <div
                    style={{
                      fontWeight: "500",
                      fontSize: "13px",
                      marginBottom: "4px",
                      color: "#00a884",
                    }}
                  >
                    {message.username}
                  </div>
                )}
                <div
                  style={{
                    fontSize: "14.2px",
                    marginBottom: "4px",
                    color: "#e9edef",
                    lineHeight: "19px",
                    wordWrap: "break-word",
                  }}
                >
                  {message.text}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    color: "#8696a0",
                    textAlign: "right",
                    marginTop: "4px",
                  }}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div
            style={{
              padding: "8px 20px",
              fontSize: "13px",
              color: "#8696a0",
              fontStyle: "italic",
              backgroundColor: "#111b21",
            }}
          >
            {Array.from(typingUsers).join(", ")}{" "}
            {typingUsers.size === 1 ? "is" : "are"} typing...
          </div>
        )}

        {/* Message input - WhatsApp style */}
        <div
          style={{
            padding: "10px 20px",
            backgroundColor: "#202c33",
            borderTop: "1px solid #2a3942",
          }}
        >
          <form
            onSubmit={handleSendMessage}
            style={{ display: "flex", gap: "10px", alignItems: "center" }}
          >
            <button
              type="button"
              style={{
                padding: "10px",
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
                fontSize: "24px",
                color: "#8696a0",
              }}
            >
              😊
            </button>
            <input
              type="text"
              placeholder="Type a message"
              value={inputMessage}
              onChange={handleInputChange}
              style={{
                flex: 1,
                padding: "10px 15px",
                fontSize: "15px",
                border: "none",
                borderRadius: "8px",
                backgroundColor: "#2a3942",
                color: "#e9edef",
              }}
            />
            <button
              type="submit"
              style={{
                padding: "10px 18px",
                fontSize: "16px",
                backgroundColor: "#00a884",
                color: "white",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                width: "45px",
                height: "45px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ➤
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
