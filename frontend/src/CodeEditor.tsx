import { Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  CodeChangePayload,
  ServerToClientEvents,
} from "./types.ts";
import { useCallback, useEffect, useRef } from "react";
import Editor, { type OnChange } from "@monaco-editor/react";
import type { editor } from "monaco-editor";

interface CodeEditorProps {
  socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  initialCode: string;
  roomId: string;
}

const CodeEditor = ({ socket, initialCode, roomId }: CodeEditorProps) => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

  const handleEditorChange: OnChange = useCallback(
    (value) => {
      if (value === undefined || !editorRef.current) return;

      const payload: CodeChangePayload = {
        newCode: value,
        roomId: roomId,
        clientId: socket.id || "",
      };

      socket.emit("code-change", payload);
    },
    [socket, roomId]
  );

  useEffect(() => {
    socket.on("code-update", (payload) => {
      if (payload.clientId !== socket.id && editorRef.current) {
        editorRef.current.setValue(payload.newCode);
      }
    });

    return () => {
      socket.off("code-update");
    };
  }, [socket]);

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editor.setValue(initialCode);
  };

  return (
    <Editor
      height={"80vh"}
      defaultLanguage={"typescript"}
      defaultValue={initialCode}
      onChange={handleEditorChange}
      onMount={handleEditorDidMount}
      theme={"vs-dark"}
      options={{ minimap: { enabled: true } }}
    />
  );
};

export default CodeEditor;
