"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SettledUser {
  id: string;
  userId: string;
  nickname: string;
  email: string;
  amount: number;
  createdAt: string;
}

interface Props {
  settlementId: string | null;
  open: boolean;
  onClose: () => void;
  fetchSettledUsers: (settlementId: string) => Promise<SettledUser[]>;
}

export default function SettledUsersModal({ settlementId, open, onClose, fetchSettledUsers }: Props) {
  const [users, setUsers] = useState<SettledUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settlementId || !open) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchSettledUsers(settlementId);
        setUsers(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [settlementId, open, fetchSettledUsers]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Settled Users</DialogTitle>
        </DialogHeader>

        {loading && <p className="p-4 text-center">Loading...</p>}
        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!loading && !error && users.length === 0 && (
          <p className="p-4 text-center">No settled users found</p>
        )}

        {!loading && users.length > 0 && (
          <div className="divide-y">
            <div className="grid grid-cols-4 font-semibold py-2">
              <div>User</div>
              <div>Email</div>
              <div>Amount</div>
              <div>Date</div>
            </div>
            {users.map((u) => (
              <div key={u.id} className="grid grid-cols-4 py-2 text-sm">
                <div>{u.nickname}</div>
                <div>{u.email}</div>
                <div>₦{u.amount.toLocaleString()}</div>
                <div>{new Date(u.createdAt).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
