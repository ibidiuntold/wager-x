import { GameConfig } from './game.types';

export type SessionStatus = 'waiting' | 'playing' | 'finished' | 'expired';
export type NetworkStatus = 'connected' | 'disconnected' | 'reconnecting';
export type PlayerRole = 'initiator' | 'joiner';

export interface SessionPlayer {
 id: string;
 nickname: string;
 avatarUrl: string;
 isBot: boolean;
 status: 'active' | 'disconnected';
 role: PlayerRole;
 lastActive?: number;
 joinedAt: number;
}

export interface SessionState {
 id: string;
 gameId: string;
 status: SessionStatus;
 initiator: {
   id: string;
   nickname: string;
   avatarUrl: string;
 };
 players: {
   [userId: string]: SessionPlayer
 };
 networkStatus?: NetworkStatus;
 reconnectionStartTime?: number;
 wager: number;
 winner: string | null;
 currentTurn: string | null;
 startTime: number;
 endTime?: number | null;
 lastActivityTime: number;
 gameState: any;
 moves: any[];
 expiresAt: number;
 isRandomMatch: boolean;
 config?: GameConfig;
 invite?: {
   status: 'pending' | 'accepted' | 'cancelled' | 'expired';
   inviterId: string;
   inviteeId?: string | null;
   createdAt: number;
   expiresAt: number;
 };
 forfeitedBy?: string;
 lastUpdateTimestamp: number;
}

export interface SessionOptions {
 timeLimit?: number;
 turnDuration?: number;
 maxPlayers?: number;
 minBalance?: number;
 isPrivate?: boolean;
 allowSpectators?: boolean;
 customRules?: Record<string, any>;
 sessionTimeout?: number;
 inviteTimeout?: number;
 userId?: string;
 userName?: string;
 userAvatar?: string;
 maxReconnectionAttempts?: number;
 reconnectionInterval?: number;
}

export interface FirestoreDataCache<T> {
  data: T;
  timestamp: number;
  isLoading?: boolean;
}

export const DEFAULT_SESSION_OPTIONS: SessionOptions = {
 timeLimit: 300, // 5 minutes
 turnDuration: 30, // 30 seconds per turn
 maxPlayers: 2,
 minBalance: 0,
 isPrivate: false,
 allowSpectators: false,
 sessionTimeout: 300000, // 5 minutes
 inviteTimeout: 600000, // 10 minutes
 maxReconnectionAttempts: 3,
 reconnectionInterval: 5000 // 5 seconds
};