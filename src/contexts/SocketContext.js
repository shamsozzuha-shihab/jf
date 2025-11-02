import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAdmin } = useAuth();

  // Check if WebSocket is enabled via environment variable
  const isWebSocketEnabled = process.env.REACT_APP_ENABLE_WEBSOCKET !== 'false';

  useEffect(() => {
    if (!isWebSocketEnabled) {
      console.log("🔌 WebSocket disabled via environment variable");
      return;
    }

    // Initialize socket connection - Always use Render backend
    const socketUrl = "https://jamalpur-chamber-backend-b61d.onrender.com";
    const newSocket = io(socketUrl, {
      transports: ["polling", "websocket"], // Try polling first, then websocket
      timeout: 30000, // Increased timeout
      forceNew: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5,
    });

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("🔌 Connected to WebSocket server");
      setIsConnected(true);

      // Join appropriate room based on user role
      if (isAdmin) {
        newSocket.emit("join-admin");
        console.log("👑 SocketContext: Joined admin room");
      } else {
        newSocket.emit("join-user");
        console.log("👤 SocketContext: Joined user room");
      }
    });

    newSocket.on("disconnect", () => {
      console.log("🔌 Disconnected from WebSocket server");
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
      setIsConnected(false);
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log(`🔄 WebSocket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
    });

    newSocket.on("reconnect_error", (error) => {
      console.error("❌ WebSocket reconnection error:", error);
    });

    newSocket.on("reconnect_failed", () => {
      console.error("❌ WebSocket reconnection failed after all attempts");
      setIsConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [isAdmin, isWebSocketEnabled]);

  // Rejoin rooms when user role changes
  useEffect(() => {
    if (socket && isConnected && isWebSocketEnabled) {
      if (isAdmin) {
        socket.emit("join-admin");
        console.log("👑 Rejoined admin room");
      } else {
        socket.emit("join-user");
        console.log("👤 Rejoined user room");
      }
    }
  }, [socket, isConnected, isAdmin, isWebSocketEnabled]);

  const value = {
    socket: isWebSocketEnabled ? socket : null,
    isConnected: isWebSocketEnabled ? isConnected : false,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
