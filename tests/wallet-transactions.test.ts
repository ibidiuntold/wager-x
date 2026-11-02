import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { useWalletOperations } from '@/hooks/useWalletOperations';

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

vi.mock('@/components/ui/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}));

// Mock Firestore
const mockDoc = vi.fn();
const mockUpdateDoc = vi.fn();
const mockGetDoc = vi.fn();
const mockRunTransaction = vi.fn();
const mockCollection = vi.fn();
const mockAddDoc = vi.fn();
const mockServerTimestamp = vi.fn();
const mockIncrement = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockGetDocs = vi.fn();
const mockQuery = vi.fn();

const mockFirestore = {
  // Add methods that should be available on the returned Firestore instance
};

// Mock the firebase/firestore module
vi.mock('firebase/firestore', () => ({
  doc: (...args: any[]) => {
    mockDoc(...args);
    return { id: 'mock-doc-id' };
  },
  updateDoc: mockUpdateDoc,
  getDoc: mockGetDoc,
  runTransaction: mockRunTransaction,
  collection: (...args: any[]) => {
    mockCollection(...args);
    return { id: 'mock-collection-id' };
  },
  addDoc: mockAddDoc,
  serverTimestamp: () => {
    mockServerTimestamp();
    return { _seconds: 1625097600, _nanoseconds: 0 };
  },
  increment: (val: number) => {
    mockIncrement(val);
    return val;
  },
  where: mockWhere,
  orderBy: mockOrderBy,
  limit: mockLimit,
  getDocs: mockGetDocs,
  query: mockQuery
}));

describe('useWalletOperations', () => {
  let mockToast: Mock;
  
  beforeEach(() => {
    vi.clearAllMocks();
    mockToast = vi.fn();
    
    // Set up the getDoc mock to return user data
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({
        walletBalance: 1000,
        currency: 'NGN'
      })
    });
    
    // Set up runTransaction mock to simulate successful transactions
    mockRunTransaction.mockImplementation(async (_, callback) => {
      const transaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({
            walletBalance: 1000,
            currency: 'NGN'
          })
        }),
        update: vi.fn(),
        set: vi.fn()
      };
      
      return callback(transaction);
    });
    
    // Mock useToast to return our mock toast function
    vi.mocked(require('@/components/ui/use-toast').useToast).mockReturnValue({
      toast: mockToast
    });
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should check wallet balance', async () => {
    const { checkWalletBalance } = useWalletOperations();
    
    const result = await checkWalletBalance();
    
    expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'users', 'test-user-id');
    expect(mockGetDoc).toHaveBeenCalled();
    expect(result).toEqual({
      walletBalance: 1000,
    });
  });
  
  it('should debit wallet for a wager', async () => {
    const { debitWager } = useWalletOperations();
    
    const result = await debitWager(300, 'test-session-id', 'test-game-id');
    
    expect(mockRunTransaction).toHaveBeenCalled();
    expect(result).toBe(true);
  });
  
  it('should handle insufficient funds when debiting wallet', async () => {
    const { debitWager } = useWalletOperations();
    
    // Override the runTransaction implementation for this specific test
    mockRunTransaction.mockImplementationOnce(async (_, callback) => {
      const transaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({
            walletBalance: 50,
            currency: 'NGN'
          })
        }),
        update: vi.fn(),
        set: vi.fn()
      };
      
      try {
        return await callback(transaction);
      } catch (error) {
        throw error;
      }
    });
    
    const result = await debitWager(100, 'test-session-id', 'test-game-id');
    
    expect(mockRunTransaction).toHaveBeenCalled();
    expect(result).toBe(false);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Transaction Failed',
      variant: 'destructive'
    }));
  });
  
  it('should credit winnings to wallet', async () => {
    const { creditWinnings } = useWalletOperations();
    
    const result = await creditWinnings(600, 'test-session-id', 'win', 'test-game-id');
    
    expect(mockRunTransaction).toHaveBeenCalled();
    expect(result).toBe(true);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Winner!'
    }));
  });
  
  it('should use bonus balance first when debiting', async () => {
    const { debitWager } = useWalletOperations();
    
    let capturedUpdates: any = null;
    
    // Override to capture the specific update values
    mockRunTransaction.mockImplementationOnce(async (_, callback) => {
      const transaction = {
        get: vi.fn().mockResolvedValue({
          exists: () => true,
          data: () => ({
            walletBalance: 1000,
            currency: 'NGN'
          })
        }),
        update: vi.fn((_, updates) => {
          capturedUpdates = updates;
        }),
        set: vi.fn()
      };
      
      return callback(transaction);
    });
    
    await debitWager(500, 'test-session-id', 'test-game-id');
    
    // We expect it to use all 200 from bonus, and 300 from wallet
    expect(mockIncrement).toHaveBeenCalledTimes(2);
    expect(mockIncrement).toHaveBeenNthCalledWith(1, -200); // Bonus
    expect(mockIncrement).toHaveBeenNthCalledWith(2, -300); // Wallet
  });
  
  it('should refund wager amount', async () => {
    const { refundWager } = useWalletOperations();
    
    const result = await refundWager(300, 'test-session-id', 'test-game-id');
    
    expect(mockRunTransaction).toHaveBeenCalled();
    expect(result).toBe(true);
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Wager Refunded'
    }));
  });
  
  it('should fetch transaction history', async () => {
    // Setup mock for query and getDocs
    mockQuery.mockReturnValue('mock-query-result');
    mockGetDocs.mockResolvedValue({
      docs: [
        {
          data: () => ({
            userId: 'test-user-id',
            type: 'deposit',
            amount: 100,
            date: '2023-01-01T00:00:00Z',
            status: 'success',
            provider: 'manual',
            reference: 'tx1'
          })
        },
        {
          data: () => ({
            userId: 'test-user-id',
            type: 'withdrawal',
            amount: 200,
            date: '2023-01-02T00:00:00Z',
            status: 'success',
            provider: 'manual',
            reference: 'tx2'
          })
        }
      ]
    });
    
    const { getTransactionHistory } = useWalletOperations();
    
    const result = await getTransactionHistory(5);
    
    expect(mockCollection).toHaveBeenCalledWith(expect.anything(), 'transactions');
    expect(mockQuery).toHaveBeenCalled();
    expect(mockGetDocs).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0].userId).toBe('test-user-id');
    expect(result[0].amount).toBe(100);
    expect(result[1].userId).toBe('test-user-id');
    expect(result[1].amount).toBe(200);
  });
});