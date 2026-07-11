// components/SocketProvider.jsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export function SocketProvider({ token, children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!token) return; // don't connect until the user is authenticated

    const instance = io("http://localhost:8000", {
      // This `auth.token` is exactly what the server reads in io.use().
      auth: { token },
    });

    instance.on("connect", () => console.log("Socket connected:", instance.id));

    // Fires when the server's auth middleware REJECTS us (bad/expired token).
    instance.on("connect_error", (err) =>
      console.error("Socket error:", err.message),
    );

    setSocket(instance);

    // CRUCIAL cleanup: disconnect on unmount / token change. Without this,
    // Strict Mode + Fast Refresh stack up zombie connections.
    return () => instance.disconnect();
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
