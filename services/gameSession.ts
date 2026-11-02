import { collection, doc, setDoc, updateDoc, getDoc, query, where, getDocs, Firestore } from '@firebase/firestore';
import { getFirestore } from '@firebase/firestore';
import { initializeApp } from '@firebase/app';
import firebaseConfig from '@/lib/firebase-config';
import { GameSession, GameConfig } from '@/types/game.types';
import { SessionState, SessionOptions, DEFAULT_SESSION_OPTIONS } from '@/types/session.types';

// Initialize Firebase for services
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export async function validateInviteState(sessionId: string, options: SessionOptions = DEFAULT_SESSION_OPTIONS) {
  const sessionRef = doc(firestore, 'gameSessions', sessionId);
  const sessionDoc = await getDoc(sessionRef);
 
  if (!sessionDoc.exists()) {
    return { valid: false, error: 'Session not found' };
  }
 
  const session = sessionDoc.data() as SessionState;
  
  // First check if invite exists
  const invite = session.invite;
  if (!invite) {
    return { valid: false, error: 'Not an invite session' };
  }
 
  if (session.networkStatus === 'disconnected' && 
      session.reconnectionStartTime && 
      Date.now() - session.reconnectionStartTime > (options.sessionTimeout || DEFAULT_SESSION_OPTIONS.sessionTimeout!)) {
    return { valid: false, error: 'Session disconnected too long' };
  }
 
  if (invite.status !== 'pending') {
    return { valid: false, error: `Invite is ${invite.status}` };
  }
 
  if (invite.expiresAt < Date.now()) {
    await updateDoc(sessionRef, {
      'invite.status': 'expired'
    });
    return { valid: false, error: 'Invite has expired' };
  }
 
  return { valid: true, session };
}


export async function createGameSession(
  gameSlug: string,
  userId: string,
  userName: string,
  userAvatar: string,
  wager: number,
  gameConfig: GameConfig,
  isRandom: boolean = false,
  inviteeId?: string
) {
  console.log('[GameSession] Creating new session...', {
    gameSlug,
    userId,
    wager,
    isRandom,
    inviteeId
  });
  const sessionId = crypto.randomUUID();
  const now = Date.now();
  
  const session: SessionState = {
    id: sessionId,
    gameId: gameSlug,
    status: 'waiting',
    initiator: {
      id: userId,
      nickname: userName,
      avatarUrl: userAvatar
    },
    players: {
      [userId]: {
        id: userId,
        nickname: userName,
        avatarUrl: userAvatar,
        isBot: false,
        status: 'active',
        role: 'initiator', // Add the required role
        joinedAt: now // Add the required joinedAt timestamp
      }
    },
    wager,
    winner: null,
    currentTurn: null,
    startTime: now,
    lastActivityTime: now,
    endTime: null,
    gameState: {},
    moves: [],
    networkStatus: 'connected',
    reconnectionStartTime: undefined,
    expiresAt: now + (10 * 60 * 1000), // 10 minutes expiry for session
    isRandomMatch: isRandom,
    config: gameConfig,
    invite: inviteeId ? {
      status: 'pending',
      inviterId: userId,
      inviteeId,
      createdAt: now,
      expiresAt: now + (24 * 60 * 60 * 1000) // 24 hours expiry for invite
    } : undefined,
    lastUpdateTimestamp: now
  };

  try {
    await setDoc(doc(firestore, 'gameSessions', sessionId), session);
    console.log('[GameSession] Session created successfully', { sessionId });
    return sessionId;
  } catch (error) {
    console.error('[GameSession] Failed to create session:', error);
    throw error;
  }
}

export async function createRandomMatch(
  gameSlug: string,
  userId: string,
  userName: string,
  userAvatar: string,
  wager: number,
  gameConfig: GameConfig
) {
  console.log('[GameSession] Creating random match...');
  const botNumber = Math.floor(Math.random() * 14) + 1;
  const botAvatar = `/images/avatars/avi-${botNumber}.png`;
  const botName = `Player${Math.floor(Math.random() * 9999)}`;
  const sessionId = await createGameSession(gameSlug, userId, userName, userAvatar, wager, gameConfig, true);

  // Add bot player immediately
  await updateDoc(doc(firestore, 'gameSessions', sessionId), {
    [`players.bot`]: {
      id: 'bot',
      nickname: botName,
      avatarUrl: botAvatar,
      isBot: true,
      status: 'active'
    },
    status: 'playing',
    currentTurn: userId,
    lastActivityTime: Date.now()
  });

  return {
    sessionId,
    opponent: {
      id: 'bot',
      name: botName,
      avatar: botAvatar
    }
  };
}

export async function joinGameSession(
  sessionId: string,
  userId: string,
  userName: string,
  userAvatar: string
) {
  console.log('[GameSession] Joining session...', { sessionId, userId });
  const sessionRef = doc(firestore, 'gameSessions', sessionId);
  const session = await getDoc(sessionRef);

  if (!session.exists()) {
    throw new Error('Game session not found');
  }

  const sessionData = session.data() as GameSession;

  if (sessionData.status !== 'waiting' || Object.keys(sessionData.players).length >= 2) {
    throw new Error('Game session is no longer available');
  }

  if (Date.now() > sessionData.expiresAt) {
    throw new Error('Game session has expired');
  }

  await updateDoc(sessionRef, {
    [`players.${userId}`]: {
      id: userId,
      nickname: userName,
      avatarUrl: userAvatar,
      isBot: false,
      status: 'active'
    },
    status: 'playing',
    currentTurn: Object.keys(sessionData.players)[0],
    lastActivityTime: Date.now()
  });

  return sessionData;
}

export async function updateSessionState(
  sessionId: string,
  updates: Partial<SessionState>,
  options: SessionOptions = DEFAULT_SESSION_OPTIONS
) {
  console.log('[GameSession] Updating session state...', { sessionId, updates });
  const sessionRef = doc(firestore, 'gameSessions', sessionId);
  const now = Date.now();
  if (updates.networkStatus === 'disconnected') {
    updates.reconnectionStartTime = Date.now();
  }
  
  // Validate session still exists and is valid
  const { valid, session } = await validateInviteState(sessionId, options);
  if (valid && session?.invite) {
    // Don't update if invite is pending unless explicitly handling invite
    if (session.invite.status === 'pending' && !updates.invite) {
      return;
    }
  }

  await updateDoc(sessionRef, {
    ...updates,
    lastActivityTime: now
  });
}

export async function endSession(
  sessionId: string,
  winner: string | null = null
) {
  console.log('[GameSession] Ending session...', { sessionId, winner });
  const sessionRef = doc(firestore, 'gameSessions', sessionId);
  const now = Date.now();
  
  await updateDoc(sessionRef, {
    status: 'finished',
    endTime: now,
    winner,
    lastActivityTime: now,
    'invite.status': 'cancelled' // Cancel any pending invites
  });
}

export async function findActiveSession(userId: string): Promise<GameSession | null> {
  console.log('[GameSession] Finding active session for user...', { userId });
  const sessionsRef = collection(firestore, 'gameSessions');
  const cutoffTime = Date.now() - (5 * 60 * 1000); // 5 minutes ago
  
  // Query for sessions where user is player or invitee
  const activeSessionsQuery = query(
    sessionsRef,
    where(`players.${userId}.id`, '==', userId),
    where('status', 'in', ['waiting', 'playing'])
  );

  const inviteSessionsQuery = query(
    sessionsRef,
    where('invite.inviteeId', '==', userId),
    where('invite.status', '==', 'pending')
  );

  const [sessionSnapshot, inviteSnapshot] = await Promise.all([
    getDocs(activeSessionsQuery),
    getDocs(inviteSessionsQuery)
  ]);

  let mostRecentSession: GameSession | null = null;
  let mostRecentTime = 0;

  const checkSession = (doc: any) => {
    const sessionData = doc.data() as GameSession;
    if (sessionData.lastActivityTime > cutoffTime && sessionData.startTime > mostRecentTime) {
      mostRecentSession = sessionData;
      mostRecentTime = sessionData.startTime;
    }
  };

  sessionSnapshot.forEach(checkSession);
  inviteSnapshot.forEach(checkSession);

  return mostRecentSession;
}

export async function acceptGameInvite(
  sessionId: string,
  userId: string,
  userName: string,
  userAvatar: string
) {
  const sessionRef = doc(firestore, 'gameSessions', sessionId);
  const sessionDoc = await getDoc(sessionRef);

  if (!sessionDoc.exists()) {
    throw new Error('Session not found');
  }

  const session = sessionDoc.data() as GameSession;
  if (!session.invite) {
    throw new Error('Invalid invite session');
  }

  if (session.invite.status !== 'pending') {
    throw new Error('Invite is no longer valid');
  }

  if (session.invite.inviteeId && session.invite.inviteeId !== userId) {
    throw new Error('This invite is for another user');
  }

  // Check if session has expired
  if (Date.now() > session.expiresAt) {
    throw new Error('Session has expired');
  }

  const updates = {
    [`players.${userId}`]: {
      id: userId,
      nickname: userName,
      avatarUrl: userAvatar,
      isBot: false,
      status: 'active'
    },
    status: 'playing',
    currentTurn: session.invite.inviterId,
    lastActivityTime: Date.now(),
    'invite.status': 'accepted'
  };

  await updateDoc(sessionRef, updates);
  return { ...session, ...updates };
}

export async function cancelGameInvite(sessionId: string, userId: string) {
  const { valid, session, error } = await validateInviteState(sessionId);
  
  if (!valid || !session) {
    throw new Error(error || 'Invalid invite');
  }

  if (session.invite?.inviterId !== userId) {
    throw new Error('Only the inviter can cancel the invite');
  }

  const sessionRef = doc(firestore, 'gameSessions', sessionId);
  
  await updateDoc(sessionRef, {
    'invite.status': 'cancelled',
    status: 'finished',
    endTime: Date.now(),
    lastActivityTime: Date.now()
  });
}

export async function canJoinSession(sessionId: string, userId: string): Promise<boolean> {
  try {
    const sessionRef = doc(firestore, 'gameSessions', sessionId);
    const sessionDoc = await getDoc(sessionRef);
    
    if (!sessionDoc.exists()) {
      return false;
    }
    
    const session = sessionDoc.data() as GameSession;

    if (session.status !== 'waiting') {
      return false;
    }

    if (!session.invite) {
      return false;
    }

    if (session.invite.status !== 'pending') {
      return false;
    }

    if (session.invite.inviteeId && 
        session.invite.inviteeId !== userId && 
        session.invite.inviterId !== userId) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}
