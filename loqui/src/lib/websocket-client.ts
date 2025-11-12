// WebSocket client for real-time generation updates

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export interface WebSocketMessage {
  type: 'generation_update' | 'connection' | 'error';
  data?: any;
}

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private messageHandlers: Set<(message: WebSocketMessage) => void> = new Set();
  private token: string | null = null;
  private userId: number | null = null;

  constructor(token?: string, userId?: number) {
    this.token = token || null;
    this.userId = userId ?? null;
  }

  connect() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    if (!this.userId) {
      // Cannot connect without a user id (server requires /ws/{user_id})
      return;
    }

    try {
      // Connect to WebSocket with token if available
      const url = this.token 
        ? `${WS_BASE_URL}/api/ws/${this.userId}?token=${this.token}`
        : `${WS_BASE_URL}/api/ws/${this.userId}`;
      
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.notifyHandlers({
          type: 'connection',
          data: { status: 'connected' },
        });
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.notifyHandlers(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifyHandlers({
          type: 'error',
          data: { error: 'WebSocket connection error' },
        });
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.ws = null;
        this.notifyHandlers({
          type: 'connection',
          data: { status: 'disconnected' },
        });

        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
          setTimeout(() => this.connect(), this.reconnectDelay);
        }
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
  }

  subscribe(handler: (message: WebSocketMessage) => void) {
    this.messageHandlers.add(handler);
    
    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  private notifyHandlers(message: WebSocketMessage) {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in WebSocket message handler:', error);
      }
    });
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  updateToken(token: string | null) {
    if (this.token !== token) {
      this.token = token;
      // Reconnect with new token
      if (this.ws) {
        this.disconnect();
        if (token) {
          this.connect();
        }
      }
    }
  }

  updateUserId(userId: number | null) {
    if (this.userId !== userId) {
      this.userId = userId;
      if (this.ws) {
        this.disconnect();
        if (userId) {
          this.connect();
        }
      }
    }
  }
}

