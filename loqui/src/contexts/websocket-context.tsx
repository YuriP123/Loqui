"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { WebSocketClient, type WebSocketMessage } from '@/lib/websocket-client';
import { useAuth } from './auth-context';
import { getAuthToken } from '@/lib/api-client';

interface WebSocketContextType {
  isConnected: boolean;
  subscribe: (handler: (message: WebSocketMessage) => void) => () => void;
  lastMessage: WebSocketMessage | null;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const clientRef = useRef<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  useEffect(() => {
    // Only connect if authenticated and user exists
    if (!isAuthenticated || !user?.user_id) {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    // Initialize WebSocket client
    const token = getAuthToken();
    clientRef.current = new WebSocketClient(token || undefined, user.user_id);

    // Subscribe to connection status updates
    const unsubscribe = clientRef.current.subscribe((message) => {
      setLastMessage(message);
      
      if (message.type === 'connection') {
        setIsConnected(message.data?.status === 'connected');
      }
    });

    // Connect
    clientRef.current.connect();

    // Cleanup on unmount
    return () => {
      unsubscribe();
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, [isAuthenticated, user?.user_id]);

  // Update token when it changes
  useEffect(() => {
    if (clientRef.current && isAuthenticated) {
      const token = getAuthToken();
      clientRef.current.updateToken(token);
      clientRef.current.updateUserId(user?.user_id ?? null);
    }
  }, [isAuthenticated, user?.user_id]);

  const subscribe = (handler: (message: WebSocketMessage) => void) => {
    if (!clientRef.current) {
      return () => {}; // Return no-op unsubscribe
    }
    return clientRef.current.subscribe(handler);
  };

  const value: WebSocketContextType = {
    isConnected,
    subscribe,
    lastMessage,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

/**
 * Hook to subscribe to generation updates for a specific generation ID
 */
export function useGenerationUpdates(generationId: number | null, callback: (data: any) => void) {
  const { subscribe } = useWebSocket();

  useEffect(() => {
    if (generationId === null) return;

    const unsubscribe = subscribe((message) => {
      if (message.type === 'generation_update' && message.data?.generation_id === generationId) {
        callback(message.data);
      }
    });

    return unsubscribe;
  }, [generationId, subscribe, callback]);
}

