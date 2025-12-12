export interface CodeChangePayload {
    newCode: string;
    roomId: string;
    clientId: string;
}

export interface RoomDocument {
    _id: string;
    roomId: string;
    language: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ClientToServerEvents {
    'join-room': (roomId: string, callback: (initialCode: string) => void) => void;
    'code-change': (payload: CodeChangePayload) => void;
}

export interface ServerToClientEvents {
    'code-update' : (payload: CodeChangePayload) => void;
    'user-joined': (userId: string) => void;
    'user-left': (userId: string) => void;
}