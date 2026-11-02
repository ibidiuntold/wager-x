import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { useGameSession } from '@/hooks/useGameSession';
import { GameConfig, GameSession } from '@/types/game.types';

// Mock dependencies
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        image: '/images/avatars/default.png'
      }
    },
    status: 'authenticated'
  }))
}));

vi.mock('@/lib/firebase', () => ({
  db: mockFirestore
}));

vi.mock('@/hooks/useWalletOperations', () => ({
  useWalletOperations: vi.fn(() => ({
    debitWager: mockDebitWager,
    creditWinnings: mockCreditWinnings,
    refundWager: mockRefundWager
  }))
}));

vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: mockToast
  }))
}));

// Mock functions
const mockDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockCollection = vi.fn();
const mockAddDoc = vi.fn();
const mockOnSnapshot = vi.fn();
const mockToast = vi.fn();
const mockDebitWager = vi.fn();
const mockCreditWinnings = vi.fn();
const mockRefundWager = vi.fn();

// Mock game session data
const mockSessionData: GameSession = {
  id: 'test-session-id',
  gameId: 'test-game-id',
  status: 'waiting',
  players: {
    'test-user-id': {
      id: 'test-user-id',
      nickname: 'Test User',
      avatarUrl: '/images/avatars/default.png',
      isBot: false,
      status: 'active'
    }
  },
  wager: 200,
  winner: null,
  currentTurn: null,
  startTime: Date.now(),
  lastActivityTime: Date.now(),
  gameState: {},
  moves: [],
  expiresAt: Date.now() + 30 * 60 * 1000,
  isRandomMatch: false,
  config: {} as GameConfig,
  wagersPaid: {
    'test-user-id': true
  }
};

// Mock Firestore
const mockFirestore = {
  // Add methods that should be available on the returned Firestore instance
};

// Mock the firebase/firestore module
vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => {
    mockDoc(...args);
    return { id: 'mock-doc-id' };
  },
  getDoc: mockGetDoc,
  updateDoc: mockUpdateDoc,
  collection: (...args: any[]) => {
    mockCollection(...args);
    return { id: 'mock-collection-id' };
  },
  addDoc: mockAddDoc,
  onSnapshot: (...args: any[]) => {
    mockOnSnapshot(...args);
    return vi.fn(); // Return a cleanup function
  }
}));

describe('useGameSession', () => {
  let mockUnsubscribe: Mock;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockUnsubscribe = vi.fn();
    mockOnSnapshot.mockImplementation((_, callback) => {
      // Simulate successful data fetch
      callback({
        exists: () => true,
        id: 'test-session-id',
        data: () => ({
          ...mockSessionData,
          id: undefined // ID comes from the snapshot itself, not the data
        })
      });
      
      return mockUnsubscribe;
    });
    
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        ...mockSessionData,
        id: undefined // ID comes from the snapshot itself, not the data
      })
    });
    
    mockAddDoc.mockResolvedValue({
      id: 'new-session-id'
    });
    
    mockDebitWager.mockResolvedValue(true);
    mockCreditWinnings.mockResolvedValue(true);
    mockRefundWager.mockResolvedValue(true);
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should initialize with the correct initial state', async () => {
    const { session, loading, error, sessionStatus } = useGameSession({});
    
    expect(session).toBeNull();
    expect(loading).toBe(true);
    expect(error).toBeNull();
    expect(sessionStatus).toBe('none');
  });
  
  it('should load session data when sessionId is provided', async () => {
    // Setting up onSnapshot to deliver session data after a delay
    mockOnSnapshot.mockImplementation((_, callback) => {
      setTimeout(() => {
        callback({
          exists: () => true,
          id: 'test-session-id',
          data: () => ({
            ...mockSessionData,
            id: undefined
          })
        });
      }, 0);
      
      return mockUnsubscribe;
    });
    
    const { session, loading, sessionStatus } = useGameSession({ sessionId: 'test-session-id' });
    
    // Initial state
    expect(loading).toBe(true);
    
    // Wait for async operations
    await vi.runAllTimersAsync();
    
    // Should now have the session data
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'gameSessions', 'test-session-id');
    expect(mockOnSnapshot).toHaveBeenCalled();
    expect(session).toEqual(mockSessionData);
    expect(sessionStatus).toBe('waiting');
  });
  
  it('should create a new session', async () => {
    const gameConfig: GameConfig = {
      id: 'test-game-id',
      title: 'Test Game',
      slug: 'test-game',
      description: 'Test description',
      instructions: 'Test instructions',
      image: '/images/games/test.png',
      link: '/games/test',
      activeStatus: true,
      minWager: 100,
      maxWager: 1000,
      monthPlayers: 0,
      keywords: ['test'],
      houseEdge: 0,
      gameSettings: {
        maxPlayers: 2,
        timeLimit: 300,
        minBalance: 100
      }
    };
    
    const { createSession } = useGameSession({});
    
    const sessionId = await createSession(gameConfig, 200);
    
    expect(mockDebitWager).toHaveBeenCalledWith(200, 'initial-session-id', 'test-game-id');
    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'gameSessions');
    expect(mockAddDoc).toHaveBeenCalled();
    expect(sessionId).toBe('new-session-id');
  });
  
  it('should join an existing session', async () => {
    const { joinSession } = useGameSession({});
    
    const result = await joinSession('test-session-id');
    
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'gameSessions', 'test-session-id');
    expect(mockGetDoc).toHaveBeenCalled();
    expect(mockDebitWager).toHaveBeenCalled();
    expect(mockUpdateDoc).toHaveBeenCalled();
    expect(result).toBe(true);
  });
  
  it('should handle session cancellation', async () => {
    mockOnSnapshot.mockImplementation((_, callback) => {
      callback({
        exists: () => true,
        id: 'test-session-id',
        data: () => ({
          ...mockSessionData,
          id: undefined
        })
      });
      return mockUnsubscribe;
    });
    
    const { cancelSession } = useGameSession({ sessionId: 'test-session-id' });
    
    // Wait for session to be loaded
    await vi.runAllTimersAsync();
    
    const result = await cancelSession();
    
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'gameSessions', 'test-session-id');
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        status: 'expired',
        'invite.status': 'expired'
      })
    );
    expect(mockRefundWager).toHaveBeenCalled();
    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(result).toBe(true);
  });
  
  it('should handle leaving a session with forfeit', async () => {
    // Mock an ongoing game
    mockOnSnapshot.mockImplementation((_, callback) => {
      callback({
        exists: () => true,
        id: 'test-session-id',
        data: () => ({
          ...mockSessionData,
          id: undefined,
          status: 'playing',
          players: {
            'test-user-id': {
              id: 'test-user-id',
              nickname: 'Test User',
              avatarUrl: '/images/avatars/default.png',
              isBot: false,
              status: 'active'
            },
            'opponent-id': {
              id: 'opponent-id',
              nickname: 'Opponent',
              avatarUrl: '/images/avatars/default.png',
              isBot: false,
              status: 'active'
            }
          },
          wagersPaid: {
            'test-user-id': true,
            'opponent-id': true
          }
        })
      });
      return mockUnsubscribe;
    });
    
    const { leaveSession } = useGameSession({ sessionId: 'test-session-id' });
    
    // Wait for session to be loaded
    await vi.runAllTimersAsync();
    
    const result = await leaveSession();
    
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'gameSessions', 'test-session-id');
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        winner: 'opponent-id',
        status: 'finished'
      })
    );
    expect(mockCreditWinnings).toHaveBeenCalledWith(400, 'test-session-id', 'forfeit', 'test-game-id');
    expect(mockUnsubscribe).toHaveBeenCalled();
    expect(result).toBe(true);
  });
  
  it('should update game state', async () => {
    mockOnSnapshot.mockImplementation((_, callback) => {
      callback({
        exists: () => true,
        id: 'test-session-id',
        data: () => ({
          ...mockSessionData,
          id: undefined,
          gameState: {
            score: {
              'test-user-id': 10
            }
          }
        })
      });
      return mockUnsubscribe;
    });
    
    const { updateGameState } = useGameSession({ sessionId: 'test-session-id' });
    
    // Wait for session to be loaded
    await vi.runAllTimersAsync();
    
    const result = await updateGameState({
      score: {
        'test-user-id': 20
      }
    });
    
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'gameSessions', 'test-session-id');
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        gameState: {
          score: {
            'test-user-id': 20
          }
        }
      })
    );
    expect(result).toBe(true);
  });
  
  it('should add game actions', async () => {
    mockOnSnapshot.mockImplementation((_, callback) => {
      callback({
        exists: () => true,
        id: 'test-session-id',
        data: () => ({
          ...mockSessionData,
          id: undefined,
          moves: []
        })
      });
      return mockUnsubscribe;
    });
    
    const { addGameAction } = useGameSession({ sessionId: 'test-session-id' });
    
    // Wait for session to be loaded
    await vi.runAllTimersAsync();
    
    const result = await addGameAction({
      playerId: 'test-user-id',
      action: 'move',
      data: { x: 1, y: 2 }
    });
    
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'gameSessions', 'test-session-id');
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        moves: [
          expect.objectContaining({
            playerId: 'test-user-id',
            action: 'move',
            data: { x: 1, y: 2 }
          })
        ]
      })
    );
    expect(result).toBe(true);
  });
  
  it('should identify opponent correctly', async () => {
    mockOnSnapshot.mockImplementation((_, callback) => {
      callback({
        exists: () => true,
        id: 'test-session-id',
        data: () => ({
          ...mockSessionData,
          id: undefined,
          players: {
            'test-user-id': {
              id: 'test-user-id',
              nickname: 'Test User',
              avatarUrl: '/images/avatars/default.png',
              isBot: false,
              status: 'active'
            },
            'opponent-id': {
              id: 'opponent-id',
              nickname: 'Opponent',
              avatarUrl: '/images/avatars/default.png',
              isBot: false,
              status: 'active'
            }
          }
        })
      });
      return mockUnsubscribe;
    });
    
    const { opponent } = useGameSession({ sessionId: 'test-session-id' });
    
    // Wait for session to be loaded
    await vi.runAllTimersAsync();
    
    expect(opponent).toEqual({
      id: 'opponent-id',
      name: 'Opponent',
      avatar: '/images/avatars/default.png',
      wager: 200,
      isBot: false
    });
  });
});