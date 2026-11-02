import { Firestore, collection, query, where, getDocs, writeBatch, updateDoc, doc, getDoc } from 'firebase/firestore';
import { SessionState, SessionOptions, DEFAULT_SESSION_OPTIONS } from '@/types/session.types';

const { sessionTimeout, inviteTimeout } = DEFAULT_SESSION_OPTIONS as Required<Pick<SessionOptions, 'sessionTimeout' | 'inviteTimeout'>>;

export async function cleanupInactiveSessions(firestore: Firestore) {
 const now = Date.now();
 const sessionCutoffTime = now - sessionTimeout;
 const inviteCutoffTime = now - inviteTimeout;

 try {
   const sessionsRef = collection(firestore, 'gameSessions'); 
   
   // Query for inactive regular sessions
   const inactiveSessionsQuery = query(
     sessionsRef,
     where('status', 'in', ['waiting', 'playing']),
     where('lastActivityTime', '<', sessionCutoffTime)
   );

   // Query for expired invite sessions
   const expiredInvitesQuery = query(
     sessionsRef,
     where('invite.status', '==', 'pending'),
     where('invite.createdAt', '<', inviteCutoffTime)
   );

   const [inactiveSnapshot, expiredInvitesSnapshot] = await Promise.all([
     getDocs(inactiveSessionsQuery),
     getDocs(expiredInvitesQuery)
   ]);

   const batch = writeBatch(firestore);

   inactiveSnapshot.docs.forEach((doc) => {
     const session = doc.data() as SessionState;
     if (session.invite?.status === 'pending') {
       batch.update(doc.ref, {
         status: 'finished',
         'invite.status': 'expired',
         lastActivityTime: now
       });
     } else {
       batch.delete(doc.ref);
     }
   });

   expiredInvitesSnapshot.docs.forEach((doc) => {
     batch.update(doc.ref, {
       status: 'finished',
       'invite.status': 'expired',
       lastActivityTime: now
     });
   });
   
   await Promise.all(inactiveSnapshot.docs.map(doc => handleDisconnectedPlayers(firestore, doc.data() as SessionState)));
   await batch.commit();
 } catch (error) {
   console.error('Error cleaning up sessions:', error);
 }
}

export function isSessionInactive(session: SessionState): boolean {
 const lastActivity = session.lastActivityTime || session.startTime;
 
 if (session.invite?.status === 'pending') {
   return Date.now() - (session.invite?.createdAt || 0) > inviteTimeout;
 }
 
 return Date.now() - lastActivity > sessionTimeout;
}

export function isInviteExpired(session: SessionState): boolean {
 if (!session.invite) return false;
 
 return (
   session.invite.status === 'pending' &&
   Date.now() > session.invite.expiresAt
 );
}

export async function cleanupSessionInvites(firestore: Firestore, sessionId: string, options: SessionOptions = DEFAULT_SESSION_OPTIONS) {
 try {
   const sessionRef = doc(firestore, 'gameSessions', sessionId);
   const sessionDoc = await getDoc(sessionRef);
   
   if (!sessionDoc.exists()) return;
   
   const session = sessionDoc.data() as SessionState;
   const invite = session.invite;

   if (invite && invite.status === 'pending') {
     await updateDoc(sessionRef, {
       status: 'finished',
       'invite.status': 'expired',
       lastActivityTime: Date.now()
     });
   }
 } catch (error) {
   console.error('Error cleaning up session invites:', error);
 }
}

export async function handleDisconnectedPlayers(firestore: Firestore, session: SessionState) {
 const now = Date.now();
 const updatedPlayers = { ...session.players };
 let needsUpdate = false;

 Object.entries(updatedPlayers).forEach(([playerId, player]) => {
   if (player.status === 'disconnected' && player.lastActive) {
     const disconnectedTime = now - player.lastActive;
     if (disconnectedTime > sessionTimeout) {
       updatedPlayers[playerId].status = 'disconnected';
       needsUpdate = true;
     }
   }
 });

 if (needsUpdate) {
   const sessionRef = doc(firestore, 'gameSessions', session.id);
   await updateDoc(sessionRef, { players: updatedPlayers });
 }
}
