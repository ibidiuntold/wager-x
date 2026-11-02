export interface GameConfig {
  id: string;
  title: string;
  slug: string;
  description: string;
  instructions: string;
  image: string;
  link: string;
  activeStatus: boolean;
  minWager: number;
  maxWager: number;
  monthPlayers: number;
  keywords: readonly string[];
  houseEdge: number;
  gameSettings: {
    maxPlayers: number;
    timeLimit: number;
    minBalance: number;
    turnDuration?: number;
  };
}

export interface OpponentData {
  id: string;
  name: string;
  avatar: string;
  wager: number;
  isBot: boolean;
}

export interface WalletData {
  walletBalance: number;
  currency: string;
}

export type GameSessionData = GameSession;

export interface PlayerState {
  id: string;
  nickname: string;
  avatarUrl: string;
  isBot: boolean;
  status: 'active' | 'disconnected';
  role: 'initiator' | 'joiner';
  joinedAt: number;
}

export interface GameSession {
  id: string;
  gameId: string;
  status: 'waiting' | 'playing' | 'finished' | 'expired';
  initiator: {
    id: string;
    nickname: string;
    avatarUrl: string;
  };
  players: Record<string, PlayerState>;
  wager: number;
  winner: string | null;
  currentTurn: string | null;
  startTime: number;
  endTime?: number;
  lastActivityTime: number;
  gameState: Record<string, any>;
  moves: Array<GameAction>;
  expiresAt: number;
  isRandomMatch: boolean;
  config: GameConfig;
  invite?: {
    status: 'pending' | 'accepted' | 'expired';
    inviterId: string;
    inviteeId: string;
    createdAt: number;
    expiresAt: number;
  };
  wagersPaid?: Record<string, boolean>;
  forfeitedBy?: string;
  lastUpdateTimestamp: number;
  notifiedAcceptance?: boolean;
}

export interface GameAction {
  playerId: string;
  action: string;
  timestamp: number;
  data?: any;
}

// Game is identical to GameConfig — use a type alias to avoid duplication
export type Game = GameConfig;

export interface Wager {
  id: string;
  slug: string;
  title: string;
  description: string;
  totalPool: number;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled' | 'closed';
  category: string;
  image: string;
  minimumEntry?: number;
  creatorId?: string;
  createdAt?: string | { toDate: () => Date };
  expiresAt?: string | { toDate: () => Date };
  options: Array<{
    name: string;
    odds?: number;
  }> | string;
  createdBy?: string;
  isPrivate?: boolean;
  isResolved?: boolean | number;
  invitedFriends?: string[];
  winningOption?: string;
  wagerType?: 'p2p' | 'event';
  resolvedAt?: string | { toDate: () => Date };
}

export interface Participant {
  id?: string;
  userId: string;
  userName?: string;
  wagerAmount: number;
  optionSelected: string;
  participantId: string;
  wagerId: string;
}

export interface ProcessedOption {
  name: string;
  totalAmount: number;
}