import  io, { Socket } from 'socket.io-client';

export class SocketService {
  private static instance: SocketService; // Use a static instance for the service
  private socket: Socket;
  private gameId: string | null = null;
  private playerId: number | null = null;

  private constructor() { // Make constructor private for singleton pattern
    const url = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';
    this.socket = io(url, { autoConnect: true });
  }

  static getInstance(): SocketService { // Return the service instance
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    this.socket.on(event, listener);
  }

  public emit(event: string, ...args: any[]): void {
    this.socket.emit(event, ...args);
  }

  public getGameId(): string | null {
    return this.gameId;
  }

  public getPlayerId(): number | null {
    return this.playerId;
  }

  public setGameId(gameId: string): void {
    this.gameId = gameId;
  }

  public setPlayerId(playerId: number): void {
    this.playerId = playerId;
  }
}
