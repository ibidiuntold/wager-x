import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from './useFirestore';

interface InviteCallbacks {
  setModalState?: (state: { wagerModal: boolean; matchModal: boolean; }) => void;
  setOpponentData?: (data: any | null) => void;
}

export const useInviteActions = () => {
  const firestore = useFirestore();

  const acceptInvite = async (sessionId: string, callbacks?: InviteCallbacks) => {
    try {
      const sessionRef = doc(firestore, 'gameSessions', sessionId);
      await updateDoc(sessionRef, {
        'invite.status': 'accepted',
        lastActivityTime: Date.now()
      });

      if (callbacks?.setModalState) {
        callbacks.setModalState({ wagerModal: false, matchModal: false });
      }
      if (callbacks?.setOpponentData) {
        callbacks.setOpponentData(null);
      }
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to accept invite');
    }
  };

  return {
    acceptInvite
  };
};
