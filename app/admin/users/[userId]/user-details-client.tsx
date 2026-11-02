'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { ArrowLeft, User, Calendar, Mail, Clock, Ban, Wallet, Phone, Award, Hash, UserCog, Bell, Pencil } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ConfirmationModal } from './confirmation-modal';
import { EditBalanceModal } from './edit-balance-modal';
import { EditUserModal } from './edit-user-modal';

interface UserDetails {
  id: string;
  email: string;
  nickname: string;
  firstName: string;
  lastName: string;
  dob: string;
  phoneNumber: string;
  lastLogin: string;
  lastActivity: string;
  createdAt: string;
  isActive: boolean;
  walletBalance: number;
  gamePoints: number;
  emailVerified: boolean;
  referralCode: string;
  role: string;
  mailingSettings: {
    personalBonuses: boolean;
    pushNotifications: boolean;
    emailDistribution: boolean;
    systemMessages: boolean;
  };
}

interface UserDetailsClientProps {
  userId: string;
}

export default function UserDetailsClient({ userId }: UserDetailsClientProps) {
  const [user, setUser] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user: currentUser } = useAuth();

  // Modal states
  const [showEditUser, setShowEditUser] = useState(false);
  const [showEditBalance, setShowEditBalance] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      router.push('/admin/login');
      return;
    }

    async function fetchUserDetails() {
      try {
        const db = getFirestore(getApp());
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists()) {
          setUser({
            id: userDoc.id,
            ...userDoc.data(),
          } as UserDetails);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setLoading(false);
      }
    }

    fetchUserDetails();
  }, [currentUser, userId, router]);

  const handleUpdateUserInfo = async (info: {
    firstName: string;
    lastName: string;
    nickname: string;
    email: string;
    phoneNumber: string;
  }) => {
    if (!user) return;
    try {
      const db = getFirestore(getApp());
      await updateDoc(doc(db, 'users', userId), info);
      setUser({ ...user, ...info });
    } catch (error) {
      console.error('Error updating user info:', error);
    }
  };

  const handleUpdateBalance = async (newBalance: number) => {
    if (!user) return;
    try {
      const db = getFirestore(getApp());
      await updateDoc(doc(db, 'users', userId), {
        walletBalance: newBalance
      });
      setUser({ ...user, walletBalance: newBalance });
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    try {
      const db = getFirestore(getApp());
      await updateDoc(doc(db, 'users', userId), {
        isActive: !user.isActive
      });
      setUser({ ...user, isActive: !user.isActive });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDeleteUser = async () => {
    try {
      const db = getFirestore(getApp());
      await updateDoc(doc(db, 'users', userId), {
        isActive: false,
        deleted: true
      });
      router.push('/admin/users');
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 w-full bg-muted rounded"></div>
            <div className="h-4 w-5/6 bg-muted rounded"></div>
            <div className="h-4 w-4/6 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              User not found
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          className="gap-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-4 flex-1">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Name</div>
                  <div className="mt-1">{user.firstName} {user.lastName}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Nickname</div>
                  <div className="mt-1">{user.nickname}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Email</div>
                  <div className="mt-1 flex items-center gap-2">
                    {user.email}
                    {user.emailVerified && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        Verified
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Date of Birth</div>
                  <div className="mt-1">{new Date(user.dob).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Phone</div>
                  <div className="mt-1">{user.phoneNumber}</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowEditUser(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              Account Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Role</div>
              <div className="mt-1 capitalize">{user.role}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div className="mt-1">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Referral Code</div>
              <div className="mt-1">{user.referralCode}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Joined</div>
              <div className="mt-1">{new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Last Active</div>
              <div className="mt-1">{new Date(user.lastActivity).toLocaleDateString()}</div>
            </div>
          </CardContent>
        </Card>

        {/* Balance & Points */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              Balance & Points
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Wallet Balance</div>
              <div className="mt-1 flex items-center gap-4">
                ₦{user.walletBalance.toLocaleString()}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setShowEditBalance(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Bonus Balance</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Game Points</div>
              <div className="mt-1">{user.gamePoints.toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        {/* Mailing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Mailing Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">Personal Bonuses</div>
              <Switch checked={user.mailingSettings.personalBonuses} disabled />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">Push Notifications</div>
              <Switch checked={user.mailingSettings.pushNotifications} disabled />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">Email Distribution</div>
              <Switch checked={user.mailingSettings.emailDistribution} disabled />
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm">System Messages</div>
              <Switch checked={user.mailingSettings.systemMessages} disabled />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              className="gap-2 text-yellow-600 hover:text-yellow-700"
              onClick={() => setShowStatusConfirm(true)}
            >
              <Ban className="h-4 w-4" />
              {user.isActive ? 'Deactivate' : 'Activate'} User
            </Button>
            <Button
              variant="destructive"
              className="gap-2"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <EditUserModal
        isOpen={showEditUser}
        onClose={() => setShowEditUser(false)}
        onConfirm={handleUpdateUserInfo}
        currentInfo={{
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          nickname: user.nickname || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          dob: user.dob || '',
        }}
      />
      <EditBalanceModal
        isOpen={showEditBalance}
        onClose={() => setShowEditBalance(false)}
        onConfirm={handleUpdateBalance}
        currentBalance={user.walletBalance}
      />

      <ConfirmationModal
        isOpen={showStatusConfirm}
        onClose={() => setShowStatusConfirm(false)}
        onConfirm={handleToggleStatus}
        title={`${user.isActive ? 'Deactivate' : 'Activate'} User`}
        description={`Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} this user? ${
          user.isActive ? 'They will not be able to access their account.' : 'They will regain access to their account.'
        }`}
        variant={user.isActive ? 'destructive' : 'default'}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        description="Are you sure you want to delete this user? This action cannot be undone."
        variant="destructive"
        confirmText="Delete"
      />
    </div>
  );
}
