'use client';

import React from 'react';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronRight, Users, UserCheck, Mail, Smartphone, PlusCircle, MinusCircle, DollarSign, Percent, LucideIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import siteData from '@/components/site-data.json';

interface Transaction {
  id: string;
  userId: string;
  type: 'wager' | 'deposit' | 'withdrawal';  // Ensure these strings match exactly what's in your data
  amount: number;
  status: 'completed' | 'pending' | 'failed';  // Make this required since it appears to be
  date: string;
  game?: string;          // Optional game property
  result?: 'win' | 'loss';  // Optional result for wagers
  winAmount?: number;     // Optional win amount for wagers
}

interface User {
  lastLogin?: string;
  emailVerified: boolean;
  phoneNumber?: string;
}

const DashboardPage = () => {
  const users = siteData.users;

  const transactions: Transaction[] = siteData.transactions.map(t => {
    if (!['wager', 'deposit', 'withdrawal'].includes(t.type)) {
      throw new Error(`Invalid transaction type: ${t.type}`);
    }
    if (!['completed', 'pending', 'rejected'].includes(t.status)) {
      throw new Error(`Invalid transaction status: ${t.status}`);
    }
    return t as Transaction;
  });

  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.lastLogin && new Date(user.lastLogin) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;
  const emailUnverifiedUsers = users.filter(user => !user.emailVerified).length;
  const mobileUnverifiedUsers = users.filter(user => !user.phoneNumber).length;

  const totalDeposited = transactions.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const pendingDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'pending').length;
  const rejectedDeposits = transactions.filter(t => t.type === 'deposit' && t.status === 'failed').length;
  const depositCharges = 0;

  const totalWithdrawn = transactions.filter(t => t.type === 'withdrawal' && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0);
  const pendingWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'pending').length;
  const rejectedWithdrawals = transactions.filter(t => t.type === 'withdrawal' && t.status === 'failed').length;
  const withdrawalCharges = 20;

  const totalWagered = transactions.filter(t => t.type === 'wager').reduce((sum, t) => sum + t.amount, 0);
  const totalWon = transactions
  .filter(t => t.type === 'wager' && t.result === 'win')
  .reduce((sum, t) => sum + (t.winAmount || 0), 0);
  const totalLost = transactions.filter(t => t.type === 'wager' && t.result === 'loss').reduce((sum, t) => sum + t.amount, 0);
  const totalProfit = totalWon - totalLost;

  const transactionData = transactions.reduce((acc, t) => {
    const date = new Date(t.date).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = { date, deposits: 0, withdrawals: 0 };
    }
    if (t.type === 'deposit' && t.status === 'completed') {
      acc[date].deposits += t.amount;
    } else if (t.type === 'withdrawal' && t.status === 'completed') {
      acc[date].withdrawals += t.amount;
    }
    return acc;
  }, {} as Record<string, { date: string; deposits: number; withdrawals: number }>);

  const chartData = Object.values(transactionData);

  const iconColors: Record<string, string> = {
    Users: 'text-blue-500 bg-blue-100',
    UserCheck: 'text-green-500 bg-green-100',
    Mail: 'text-yellow-500 bg-yellow-100',
    Smartphone: 'text-purple-500 bg-purple-100',
    PlusCircle: 'text-emerald-500 bg-emerald-100',
    MinusCircle: 'text-red-500 bg-red-100',
    DollarSign: 'text-indigo-500 bg-indigo-100',
    Percent: 'text-pink-500 bg-pink-100',
  };

  interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    onClick: () => void;
  }

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, onClick }) => (
    <Card 
      className="cursor-pointer transition-all duration-300 hover:shadow-lg" 
      onClick={onClick}
    >
      <CardContent className="flex items-center justify-between p-6">
        <div className="flex items-center">
        <div className={`rounded-full p-3 mr-4 ${iconColors[Icon.displayName as keyof typeof iconColors] || ''}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <h3 className="text-2xl font-bold">{value}</h3>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-gray-400" />
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Users" value={totalUsers} icon={Users} onClick={() => {}} />
        <StatCard title="Active Users" value={activeUsers} icon={UserCheck} onClick={() => {}} />
        <StatCard title="Email Unverified Users" value={emailUnverifiedUsers} icon={Mail} onClick={() => {}} />
        <StatCard title="Mobile Unverified Users" value={mobileUnverifiedUsers} icon={Smartphone} onClick={() => {}} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Deposits</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard title="Total Deposited" value={`₦${totalDeposited.toFixed(2)}`} icon={PlusCircle} onClick={() => {}} />
            <StatCard title="Pending Deposits" value={pendingDeposits} icon={DollarSign} onClick={() => {}} />
            <StatCard title="Rejected Deposits" value={rejectedDeposits} icon={MinusCircle} onClick={() => {}} />
            <StatCard title="Deposit Charges" value={`₦${depositCharges.toFixed(2)}`} icon={Percent} onClick={() => {}} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Withdrawals</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard title="Total Withdrawn" value={`₦${totalWithdrawn.toFixed(2)}`} icon={MinusCircle} onClick={() => {}} />
            <StatCard title="Pending Withdrawals" value={pendingWithdrawals} icon={DollarSign} onClick={() => {}} />
            <StatCard title="Rejected Withdrawals" value={rejectedWithdrawals} icon={MinusCircle} onClick={() => {}} />
            <StatCard title="Withdrawal Charges" value={`₦${withdrawalCharges.toFixed(2)}`} icon={Percent} onClick={() => {}} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Wagered" value={`₦${totalWagered.toFixed(2)}`} icon={DollarSign} onClick={() => window.location.href = '/admin/wagers'} />
        <StatCard title="Total Won" value={`₦${totalWon.toFixed(2)}`} icon={PlusCircle} onClick={() => {}} />
        <StatCard title="Total Lost" value={`₦${totalLost.toFixed(2)}`} icon={MinusCircle} onClick={() => {}} />
        <StatCard title="Total Profit" value={`₦${totalProfit.toFixed(2)}`} icon={Percent} onClick={() => {}} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Deposit and Withdrawal Report</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="deposits" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="withdrawals" stroke="#82ca9d" fill="#82ca9d" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default DashboardPage;
