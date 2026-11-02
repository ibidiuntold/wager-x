"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAdminTransactions } from "@/hooks/admin/useAdminTransactions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  MoreHorizontal,
  Eye,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  CircleDollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  Ban,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function TransactionsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    transactions,
    pagination,
    loading,
    error,
    fetchTransactions,
    // deleteTransaction,
    setFilters,
    stats,
    fetchTransactionStats,
  } = useAdminTransactions();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Auto-redirect if not logged in
  useEffect(() => {
    if (!user) router.push("/admin/login");
  }, [user, router]);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
  };

  // Handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setFilters((prev) => ({ ...prev, status: value }));
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setFilters((prev) => ({ ...prev, type: value }));
  };

  const handleStatsRefresh = () => {
    fetchTransactionStats();
  };

  if (!user) return null;

  return (
    <div className="p-6 space-y-6 min-h-screen bg-background">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={handleStatsRefresh}
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Section */}
      <div className="shadow rounded-md p-5 border space-y-2">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-x-3">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-xl">Transactions Stats</h2>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={handleStatsRefresh}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleDollarSign className="h-5 w-5 text-blue-600" />
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.totalTransactions || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5 text-green-600" />
                Deposits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.totalDeposits || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowUpCircle className="h-5 w-5 text-purple-600" />
                Withdrawals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.totalWithdrawals || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ban className="h-5 w-5 text-red-600" />
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.failedTransactions || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-col gap-4 p-4">
          {/* Title */}
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <CircleDollarSign className="h-5 w-5 text-primary" />
            Transactions List
          </CardTitle>

          {/* Filters + Refresh */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 w-full sm:w-[250px] h-10"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger className="w-full sm:w-[120px] h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="success">Success</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>

                {/* Type Filter */}
                <Select value={typeFilter} onValueChange={handleTypeChange}>
                  <SelectTrigger className="w-full sm:w-[150px] h-10">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="deposit">Deposit</SelectItem>
                    <SelectItem value="withdrawal">Withdrawal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Refresh */}
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={handleStatsRefresh}
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            {/* Table Header */}
            <div className="min-w-[700px]">
              <div className="grid grid-cols-[80px_1fr_100px_100px_110px_80px_90px_60px] gap-3 px-4 py-3 bg-slate-100 dark:bg-slate-900 rounded-t-lg border-t border-x font-medium text-sm text-muted-foreground">
                <div>ID</div>
                <div>Account</div>
                <div>Type</div>
                <div>Status</div>
                <div>Amount</div>
                <div>User</div>
                <div>Created</div>
                <div>Actions</div>
              </div>

              {/* Table Rows */}
              <div className="divide-y border-x border-b rounded-b-lg overflow-hidden">
                {loading ? (
                  <div className="p-6 text-center">Loading transactions...</div>
                ) : transactions.length === 0 ? (
                  <div className="p-6 text-center">No transactions found</div>
                ) : (
                  transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="grid grid-cols-[80px_1fr_100px_100px_110px_80px_90px_60px] gap-3 px-4 py-3 items-center hover:bg-muted/50 text-sm"
                    >
                      <div className="truncate text-xs text-muted-foreground font-mono" title={tx.id}>
                        {tx.id.slice(0, 8)}…
                      </div>
                      <div className="truncate">{tx.accountName}</div>
                      <div className="capitalize">{tx.type}</div>
                      <div>{tx.status}</div>
                      <div>₦{Number(tx.amount).toLocaleString()}</div>
                      <div className="truncate text-xs font-mono" title={tx.userId}>
                        {tx.userId.slice(0, 6)}…
                      </div>
                      <div>{formatDate(tx.createdAt)}</div>
                      <div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <Link href={`/admin/transactions/${tx.id}`}>
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                            </Link>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-4 gap-3">
            <div className="text-sm text-muted-foreground">
              Page {pagination?.pageNumber || 1} · Showing {transactions.length} of{" "}
              {pagination?.total || 0}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination?.pageNumber === 1}
                onClick={() =>
                  fetchTransactions({ page: (pagination?.pageNumber || 1) - 1 })
                }
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination?.pageNumber === pagination?.totalPages}
                onClick={() =>
                  fetchTransactions({ page: (pagination?.pageNumber || 1) + 1 })
                }
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
