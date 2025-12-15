export interface Message {
  id: string;
  text: string;
  userId: string;
  username: string;
  roomId: string;
  timestamp: Date;
}

export interface User {
  id: string;
  username: string;
}

export interface ClientToServerEvents {
  "join-room": (
    roomId: string,
    username: string,
    callback: (messages: Message[], users: User[]) => void
  ) => void;
  "send-message": (message: Omit<Message, "id" | "timestamp">) => void;
  typing: (roomId: string, username: string) => void;
  "stop-typing": (roomId: string, username: string) => void;
}

export interface ServerToClientEvents {
  "message-received": (message: Message) => void;
  "user-joined": (user: User) => void;
  "user-left": (userId: string) => void;
  "user-typing": (username: string) => void;
  "user-stop-typing": (username: string) => void;
}
