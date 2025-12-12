import {useEffect, useState} from 'react'
import './App.css'
import {io, type Socket} from "socket.io-client";
import type {ClientToServerEvents, ServerToClientEvents} from "./types.ts";
import CodeEditor from "./CodeEditor.tsx";

type TypeSocket = Socket<ServerToClientEvents , ClientToServerEvents>
const socket: TypeSocket = io("http://localhost:3000");

const TEST_ROOM_ID = "ts-collab-demo-2025"

function App() {
    const [initialCode, setInitialCode] = useState<string>('')
    const [hasJoined, setHasJoined] = useState(false)

    useEffect(() => {
        socket.emit('join-room', TEST_ROOM_ID, (code: string) => {
            setInitialCode(code)
            setHasJoined(true)
        })

        socket.on('user-joined', (userId) => {
            console.log(`User ${userId} joined the room`)
        })

        return () => {
            socket.off('user-joined')
        }
    })

    return (
        <div style={{ padding: '10px' }}>
            <h1>TypeScript Collaborative Editor (Room: **{TEST_ROOM_ID}**)</h1>
            {
                hasJoined ? (
                    <CodeEditor socket={socket} initialCode={initialCode} roomId={TEST_ROOM_ID} />
                ) : (
                    <p>Connecting to room...</p>
                )
            }
        </div>
    )

}

export default App
