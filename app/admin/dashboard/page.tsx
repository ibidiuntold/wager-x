"use client";

import { Suspense, useMemo } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  TrendingUp,
  Coins,
  ArrowUpCircle,
  ArrowDownCircle,
} from "lucide-react";
import { DashboardCard } from "@/components/admin/common/AdminDashboardComponents";
import { cardColors } from "@/lib/admin/config";
import { useAdminUsers } from "@/hooks/admin/useAdminUsers";
import { useAdminWagers } from "@/hooks/admin/useAdminWagers";
import { useAdminTransactions } from "@/hooks/admin/useAdminTransactions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

// Lazy load charts
const ChartComponents = dynamic(
  () => import("@/components/admin/charts/DashboardCharts"),
  {
    loading: () => (
      <Card className="shadow-md">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    ),
    ssr: false,
  }
);

function DashboardContent() {
  const router = useRouter();
  const { userRole } = useAuth();

  // Hooks
  const { usersStats, loading: usersLoading } = useAdminUsers();
  const { stats: wagersStats, wagers, loading: wagersLoading } = useAdminWagers();
  const { stats: txStats, transactions, loading: transactionsLoading } = useAdminTransactions();

  const loading = usersLoading || wagersLoading || transactionsLoading;

  // Combine stats
  const stats = useMemo(() => {
    if (!usersStats || !wagersStats || !txStats) return null;

    return {
      totalUsers: usersStats.totalUsers,
      activeUsers: usersStats.activeUsers,
      registeredThisMonth: usersStats.registeredThisMonth,

      totalWagers: wagersStats.totalWagers,
      activeWagers: wagersStats.activeWagers,
      completedWagers: wagersStats.completedWagers,
      cancelledWagers: wagersStats.cancelledWagers,
      totalVolumeStaked: wagersStats.totalVolumeStaked,

      totalDeposits: txStats.totalDeposits || 0,
      totalWithdrawals: txStats.totalWithdrawals || 0,
      totalTransactions: txStats.totalTransactions || 0,
      totalVolume: txStats.totalVolume || 0,
      totalFees: txStats.totalFees || 0,
      netVolume: txStats.netVolume || 0,
    };
  }, [usersStats, wagersStats, txStats]);

  if (loading && !stats) {
    return (
      <div className="p-6 space-y-6 bg-background">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="shadow-md">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Skeleton className="h-5 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-36" />
                <Skeleton className="h-4 w-28 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6 space-y-6">
        <p className="text-red-500">Failed to load dashboard stats.</p>
      </div>
    );
  }

  // Card data
  const cardData = {
    users: {
      title: "Total Users",
      value: stats.totalUsers.toLocaleString(),
      subtitle: `${stats.activeUsers} active · ${stats.registeredThisMonth} new this month`,
      icon: <Users className="h-4 w-4 text-white/70" />,
      href: "/admin/users",
    },
    wagers: {
      title: "Total Wagers",
      value: stats.totalWagers.toLocaleString(),
      subtitle: `${stats.activeWagers} active · ${stats.completedWagers} completed`,
      icon: <TrendingUp className="h-4 w-4 text-white/70" />,
      href: "/admin/wagers",
    },
    volume: {
      title: "Volume Staked",
      value: `₦${stats.totalVolumeStaked.toLocaleString()}`,
      subtitle: "Total value of wagers",
      icon: <Coins className="h-4 w-4 text-white/70" />,
    },
    deposits: {
      title: "Total Deposits",
      value: `₦${stats.totalDeposits.toLocaleString()}`,
      subtitle: `${stats.totalTransactions} total transactions`,
      icon: <ArrowUpCircle className="h-4 w-4 text-white/70" />,
      href: "/admin/transactions",
    },
    withdrawals: {
      title: "Total Withdrawals",
      value: `₦${stats.totalWithdrawals.toLocaleString()}`,
      subtitle: `${stats.totalFees} fees charged`,
      icon: <ArrowDownCircle className="h-4 w-4 text-white/70" />,
      href: "/admin/settlements",
    },
  };

  return (
    <div className="p-6 space-y-6 min-h-screen bg-background">
      {/* Refresh button */}
      <div className="flex justify-end">
        <button
          disabled={loading}
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {/* 🔹 Top 3 Cards (Full Width Even Layout) */}
      <div className="grid gap-4 md:grid-cols-3">
        <DashboardCard {...cardData.users} colorClass={cardColors.users} />
        <DashboardCard {...cardData.wagers} colorClass={cardColors.wagers} />
        <DashboardCard {...cardData.volume} colorClass={cardColors.amount} />
      </div>

      {/* 🔹 Deposits & Withdrawals Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <DashboardCard
          {...cardData.deposits}
          colorClass={cardColors.deposits}
          onClick={() => router.push(cardData.deposits.href!)}
        />
        <DashboardCard
          {...cardData.withdrawals}
          colorClass={cardColors.withdrawals}
          onClick={() => router.push(cardData.withdrawals.href!)}
        />
      </div>

      {/* 🔹 Tables Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Wagers Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Wagers</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {wagersLoading ? (
              <div className="space-y-3 p-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[420px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wagers?.slice(0, 5).map((wager) => (
                      <TableRow key={wager.id}>
                        <TableCell className="font-mono text-xs truncate max-w-[80px]" title={wager.id}>
                          {wager.id.slice(0, 8)}…
                        </TableCell>
                        <TableCell>{wager.category}</TableCell>
                        <TableCell>{wager.status}</TableCell>
                        <TableCell>
                          {new Date(wager.expiresAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {transactionsLoading ? (
              <div className="space-y-3 p-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[380px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions?.slice(0, 5).map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs truncate max-w-[80px]" title={tx.id}>
                          {tx.id.slice(0, 8)}…
                        </TableCell>
                        <TableCell className="capitalize">{tx.type}</TableCell>
                        <TableCell>{tx.status}</TableCell>
                        <TableCell>₦{tx.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <Suspense
      fallback={
        <div className="p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
