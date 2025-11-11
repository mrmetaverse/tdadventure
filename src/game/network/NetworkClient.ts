import { NetworkMessage, Vector2 } from '@types/game';
import { NETWORK } from '../utils/Constants';

export class NetworkClient {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private playerId: string | null = null;

  private onPlayerUpdateCallback: ((data: any) => void) | null = null;
  private onEntityUpdateCallback: ((data: any) => void) | null = null;
  private onChatCallback: ((message: string, player: string) => void) | null = null;

  connect(): void {
    if (this.isConnected || this.ws) return;

    try {
      // Determine WebSocket URL
      let wsUrl = NETWORK.WS_URL;
      
      // If in browser and URL is relative, make it absolute
      if (typeof window !== 'undefined') {
        if (wsUrl.startsWith('ws://') || wsUrl.startsWith('wss://')) {
          // Already absolute
        } else if (wsUrl.startsWith('/')) {
          // Relative to current host
          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          wsUrl = `${protocol}//${window.location.host}${wsUrl}`;
        } else {
          // Use environment variable or default
          wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';
        }
      }

      console.log('Connecting to WebSocket:', wsUrl);
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: NetworkMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        this.stopPing();
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, NETWORK.RECONNECT_INTERVAL);
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      if (this.isConnected && this.ws) {
        this.send({ type: 'ping', data: {}, timestamp: Date.now() });
      }
    }, NETWORK.PING_INTERVAL);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private handleMessage(message: NetworkMessage): void {
    switch (message.type) {
      case 'player_update':
        if (this.onPlayerUpdateCallback) {
          this.onPlayerUpdateCallback(message.data);
        }
        break;

      case 'entity_update':
        if (this.onEntityUpdateCallback) {
          this.onEntityUpdateCallback(message.data);
        }
        break;

      case 'chat':
        if (this.onChatCallback) {
          this.onChatCallback(message.data.message, message.data.player);
        }
        break;

      case 'pong':
        // Handle pong
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  send(message: Partial<NetworkMessage>): void {
    if (!this.isConnected || !this.ws) {
      console.warn('Cannot send message: not connected');
      return;
    }

    const fullMessage: NetworkMessage = {
      type: message.type || 'unknown',
      data: message.data || {},
      timestamp: message.timestamp || Date.now(),
      playerId: this.playerId || undefined,
    };

    this.ws.send(JSON.stringify(fullMessage));
  }

  sendPlayerUpdate(update: { position: Vector2; velocity: Vector2; rotation: number }): void {
    this.send({
      type: 'player_move',
      data: update,
    });
  }

  sendChatMessage(message: string): void {
    this.send({
      type: 'chat',
      data: { message },
    });
  }

  onPlayerUpdate(callback: (data: any) => void): void {
    this.onPlayerUpdateCallback = callback;
  }

  onEntityUpdate(callback: (data: any) => void): void {
    this.onEntityUpdateCallback = callback;
  }

  onChat(callback: (message: string, player: string) => void): void {
    this.onChatCallback = callback;
  }

  disconnect(): void {
    this.isConnected = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopPing();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnectedToServer(): boolean {
    return this.isConnected;
  }

  setPlayerId(id: string): void {
    this.playerId = id;
  }
}

