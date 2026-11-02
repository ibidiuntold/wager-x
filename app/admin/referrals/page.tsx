"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAdminReferrals } from "@/hooks/admin/useAdminReferrals";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Search,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Users,
  LinkIcon,
  RefreshCcw,
  Ban,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminReferralsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    referrals,
    pagination,
    stats,
    loading,
    error,
    fetchReferrals,
    fetchReferralStats,
    deleteReferral,
    updateReferral,
    setFilters,
  } = useAdminReferrals();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!user) router.push("/admin/login");
  }, [user, router]);

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
  };

  // Filter handlers
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setFilters((prev) => ({
      ...prev,
      isActive:
        value === "all" ? undefined : value === "active" ? true : false,
    }));
  };

  const handleStatsRefresh = () => {
    fetchReferralStats();
    fetchReferrals();
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
      <div className="shadow rounded-md p-5 border space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-x-3">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-xl">Referral Stats</h2>
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

        <div className="grid grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <LinkIcon className="h-5 w-5" /> Total Referrals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.totalReferrals || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <Users className="h-5 w-5" /> Active
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.activeReferrals || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <Ban className="h-5 w-5" /> Inactive
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.inactiveReferrals || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <Users className="h-5 w-5" /> Total Uses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.totalUses || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Table Section */}
      <Card>
        <CardHeader className="flex flex-col gap-4 p-4">
          <CardTitle className="flex items-center gap-2 text-xl font-semibold">
            <LinkIcon className="h-5 w-5 text-primary" />
            Referrals Management
          </CardTitle>

          {/* Filters */}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by code or referrer..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 w-[250px] h-10"
                />
              </div>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[120px] h-10">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Max Uses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading && referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    Loading referrals...
                  </TableCell>
                </TableRow>
              ) : referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No referrals found
                  </TableCell>
                </TableRow>
              ) : (
                referrals.map((ref) => (
                  <TableRow key={ref.id}>
                    <TableCell className="font-medium">
                      {ref.referralCode}
                    </TableCell>
                    <TableCell>
                      {ref.referrerName ? (
                        <Link
                          href={`/admin/users/${ref.referrerId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {ref.referrerName}
                        </Link>
                      ) : (
                        ref.referrerId
                      )}
                    </TableCell>
                    <TableCell>{ref.uses}</TableCell>
                    <TableCell>{ref.maxUses ?? "∞"}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          ref.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                        }
                      >
                        {ref.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(ref.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white dark:bg-gray-800">
                          <DropdownMenuItem
                            onClick={() =>
                              navigator.clipboard.writeText(
                                `${window.location.origin}/ref/${ref.referralCode}`
                              )
                            }
                          >
                            Copy Link
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              updateReferral(ref.id, {
                                isActive: !ref.isActive,
                              })
                            }
                          >
                            {ref.isActive ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => deleteReferral(ref.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && (
            <div className="flex items-center justify-between px-2 py-4 mt-4">
              <div className="text-sm text-muted-foreground">
                Page {pagination.pageNumber} of {pagination.totalPages}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.pageNumber === 1 || loading}
                  onClick={() =>
                    fetchReferrals({ pageNumber: pagination.pageNumber - 1 })
                  }
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    pagination.pageNumber === pagination.totalPages || loading
                  }
                  onClick={() =>
                    fetchReferrals({ pageNumber: pagination.pageNumber + 1 })
                  }
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}