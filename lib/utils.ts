import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { sign } from 'jsonwebtoken';
import { 
  doc, 
  getDoc, 
  onSnapshot, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  Firestore, 
  DocumentReference,
  DocumentData,
  QueryConstraint,
  Unsubscribe,
  FirestoreError
} from 'firebase/firestore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export function generateToken(email: string, id: string): string {
  return sign(
    { 
      email,
      id,
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
    },
    JWT_SECRET
  );
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN'
  }).format(amount);
}

export function formatBalance(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    style: 'decimal'
  }).format(amount)
}

export function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function formatDate(input: string | number): string {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL || ''}${path}`;
}

export function generateReferralCode(): string {
  // Use only unambiguous characters (no 0/O, 1/I confusion)
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const length = 6; // 6 character referral code
  let code = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  
  return code;
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/&/g, '-and-')      // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')    // Remove all non-word characters
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

// ====== Efficient Firestore Access Helpers ======

/**
 * Types for Firestore operations
 */
export interface FirestoreDocumentOptions {
  idField?: string;
}

export interface FirestoreListenerOptions extends FirestoreDocumentOptions {
  onError?: (error: FirestoreError) => void;
}

export interface QueryOptions {
  constraints?: QueryConstraint[];
  limit?: number;
}

/**
 * Get a document from Firestore with optional error handling and retry logic
 */
export async function getFirestoreDocument<T = DocumentData>(
  firestore: Firestore,
  path: string,
  id: string,
  options: FirestoreDocumentOptions = {}
): Promise<T | null> {
  try {
    const docRef = doc(firestore, path, id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data() as DocumentData;
    const idField = options.idField || 'id';
    
    return {
      [idField]: docSnap.id,
      ...data
    } as unknown as T;
  } catch (error) {
    console.error(`Error fetching document ${path}/${id}:`, error);
    return null;
  }
}

/**
 * Setup a listener for a specific document with auto-detach capability
 */
export function setupFirestoreListener<T = DocumentData>(
  firestore: Firestore,
  path: string,
  id: string,
  callback: (data: T | null) => void,
  options: FirestoreListenerOptions = {}
): Unsubscribe {
  const docRef = doc(firestore, path, id);
  const { idField = 'id', onError } = options;

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      const data = snapshot.data();
      const result = {
        [idField]: snapshot.id,
        ...data
      } as unknown as T;

      callback(result);
    },
    (error) => {
      console.error(`Error in Firestore listener for ${path}/${id}:`, error);
      if (onError) {
        onError(error);
      }
    }
  );
}

/**
 * Setup a temporary listener that auto-detaches after a specific condition is met
 */
export function setupTemporaryListener<T = DocumentData>(
  firestore: Firestore,
  path: string,
  id: string,
  callback: (data: T | null) => void,
  condition: (data: T | null) => boolean,
  options: FirestoreListenerOptions = {}
): void {
  const unsubscribe = setupFirestoreListener<T>(
    firestore,
    path,
    id,
    (data) => {
      callback(data);
      
      // Check if condition is met to auto-detach
      if (condition(data)) {
        unsubscribe();
      }
    },
    options
  );
}

/**
 * Query documents with efficient handling of results
 */
export async function queryFirestoreDocuments<T = DocumentData>(
  firestore: Firestore,
  path: string,
  queryOptions: QueryOptions = {},
  documentOptions: FirestoreDocumentOptions = {}
): Promise<T[]> {
  try {
    const collectionRef = collection(firestore, path);
    const { constraints = [], limit: queryLimit } = queryOptions;
    
    // Build query with constraints
    let queryRef = query(collectionRef, ...constraints);
    
    // Add limit if specified
    if (queryLimit) {
      queryRef = query(queryRef, where('limit', '<=', queryLimit));
    }
    
    const querySnapshot = await getDocs(queryRef);
    const { idField = 'id' } = documentOptions;
    
    return querySnapshot.docs.map(doc => ({
      [idField]: doc.id,
      ...doc.data()
    })) as unknown as T[];
  } catch (error) {
    console.error(`Error querying Firestore collection ${path}:`, error);
    return [];
  }
}

/**
 * Update a document with optimistic UI capabilities
 */
export async function updateFirestoreDocument(
  firestore: Firestore,
  path: string,
  id: string,
  data: Partial<DocumentData>,
  optimisticUpdate?: () => void,
  onSuccess?: () => void,
  onError?: (error: Error) => void
): Promise<boolean> {
  try {
    // Apply optimistic update if provided
    if (optimisticUpdate) {
      optimisticUpdate();
    }
    
    const docRef = doc(firestore, path, id);
    await updateDoc(docRef, {
      ...data,
      lastUpdateTimestamp: Date.now()
    });
    
    if (onSuccess) {
      onSuccess();
    }
    
    return true;
  } catch (error) {
    console.error(`Error updating document ${path}/${id}:`, error);
    
    if (onError) {
      onError(error as Error);
    }
    
    return false;
  }
}

/**
 * Create a throttled Firestore listener that limits updates
 */
export function createThrottledListener<T = DocumentData>(
  firestore: Firestore,
  path: string,
  id: string,
  callback: (data: T | null) => void,
  throttleMs: number = 1000,
  options: FirestoreListenerOptions = {}
): Unsubscribe {
  let lastCallTime = 0;
  let pendingData: T | null = null;
  let timeoutId: NodeJS.Timeout | null = null;
  
  const processUpdate = () => {
    if (pendingData !== null) {
      callback(pendingData);
      pendingData = null;
    }
  };
  
  return setupFirestoreListener<T>(
    firestore,
    path,
    id,
    (data) => {
      pendingData = data;
      
      const now = Date.now();
      const timeSinceLastCall = now - lastCallTime;
      
      // Clear any pending timeout
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (timeSinceLastCall >= throttleMs) {
        // Update immediately if enough time has passed
        processUpdate();
        lastCallTime = now;
      } else {
        // Schedule update for later
        timeoutId = setTimeout(() => {
          processUpdate();
          lastCallTime = Date.now();
          timeoutId = null;
        }, throttleMs - timeSinceLastCall);
      }
    },
    options
  );
}

// ====== Game Session Helpers ======

/**
 * Check if a session is valid and active
 */
export async function isSessionValid(
  firestore: Firestore, 
  sessionId: string
): Promise<boolean> {
  try {
    const sessionRef = doc(firestore, 'gameSessions', sessionId);
    const sessionSnap = await getDoc(sessionRef);
    
    if (!sessionSnap.exists()) {
      return false;
    }
    
    const sessionData = sessionSnap.data();
    
    // Check if session has expired
    if (sessionData.status === 'expired' || sessionData.status === 'finished') {
      return false;
    }
    
    // Check if invite has expired
    if (sessionData.invite && sessionData.invite.expiresAt < Date.now()) {
      // Automatically update the session to expired
      await updateDoc(sessionRef, {
        status: 'expired',
        'invite.status': 'expired',
        lastUpdateTimestamp: Date.now()
      });
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking session validity:', error);
    return false;
  }
}

/**
 * Clean up user's old sessions (mark expired)
 */
export async function cleanupOldSessions(
  firestore: Firestore,
  userId: string
): Promise<void> {
  try {
    // Find sessions where the user is a participant that are not finished or expired
    const sessionsRef = collection(firestore, 'gameSessions');
    const q = query(
      sessionsRef,
      where(`players.${userId}.id`, '==', userId),
      where('status', 'not-in', ['finished', 'expired'])
    );
    
    const sessionsSnap = await getDocs(q);
    
    // Update sessions that are inactive for more than 30 minutes
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    
    for (const sessionDoc of sessionsSnap.docs) {
      const sessionData = sessionDoc.data();
      
      if (sessionData.lastActivityTime < thirtyMinutesAgo) {
        await updateDoc(doc(firestore, 'gameSessions', sessionDoc.id), {
          status: 'expired',
          lastUpdateTimestamp: Date.now()
        });
      }
    }
  } catch (error) {
    console.error('Error cleaning up old sessions:', error);
  }
}

/**
 * Validate session ID in URL
 */
export async function validateSessionIdInURL(
  firestore: Firestore,
  sessionId: string | null
): Promise<string | null> {
  if (!sessionId) return null;
  
  try {
    const isValid = await isSessionValid(firestore, sessionId);
    return isValid ? sessionId : null;
  } catch (error) {
    console.error('Error validating session ID:', error);
    return null;
  }
}

/**
 * Get opponent display name from session
 */
export function getOpponentDisplayName(
  session: any, 
  currentUserId: string
): { name: string; id: string | null } {
  if (!session || !session.players) {
    return { name: 'Opponent', id: null };
  }
  
  // Find opponent player
  const opponentId = Object.keys(session.players).find(id => id !== currentUserId);
  
  if (!opponentId) {
    return { name: 'Opponent', id: null };
  }
  
  const opponent = session.players[opponentId];
  const name = opponent.nickname || 'Opponent';
  
  // Remove 'Player-' prefix if present
  const formattedName = name.replace(/^Player-/, '');
  
  return { name: formattedName, id: opponentId };
}



// lib/utils.ts

/**
 * Checks if an item is a non-null object and not an array.
 * @param item The item to check.
 * @returns true if the item is an object, otherwise false.
 */
function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deep merges two objects, merging properties of the source object into the target object.
 * This function recursively merges objects and does not modify the original objects.
 * @param target The target object to merge into.
 * @param source The source object to merge from.
 * @returns A new object with the merged properties.
 */
export function deepMerge(target: any, source: any): any {
  // If source is null or undefined, return the target as is.
  if (!source) return target;
  
  // Create a new object to avoid modifying the original target.
  const output = { ...target };
  
  // Check if both are objects to perform a deep merge.
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      // If the source property is an object, recursively merge it.
      if (isObject(source[key])) {
        // If the key doesn't exist in the target, simply assign the source object.
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          // Otherwise, deep merge the nested objects.
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        // If the source property is not an object, simply assign its value.
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

export function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return date.toLocaleDateString();
}