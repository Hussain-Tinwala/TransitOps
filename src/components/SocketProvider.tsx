// src/components/SocketProvider.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const router = useRouter();

  useEffect(() => {
    const socketInstance = io({
      path: "/api/socket",
      addTrailingSlash: false,
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected on client");
    });

    // When the server broadcasts a change, magically refresh the Next.js data cache!
    socketInstance.on("refresh_data", () => {
      router.refresh();
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [router]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);