"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useAdminSettlements } from "@/hooks/admin/useAdminSettlements";
import SettledUsersModal from "@/components/admin/SettledUsersModal";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  RefreshCcw,
  Eye,
  MoreHorizontal,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Ban,
  CheckCircle2,
  XCircle,
  Users,
  Wallet
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function AdminSettlementsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    settlements,
    stats,
    pagination,
    loading,
    error,
    setFilters,
    fetchSettlements,
    fetchSettlementStats,
    updateSettlement,
    fetchSettledUsers,
  } = useAdminSettlements();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedSettlementId, setSelectedSettlementId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!user) router.push("/admin/login");
  }, [user, router]);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setFilters((prev) => ({ ...prev, status: value === "all" ? "" : value }));
  };

  const handleViewUsers = (settlementId: string) => {
    setSelectedSettlementId(settlementId);
    setModalOpen(true);
  };

  if (!user) return null;

  return (
    <div className="p-6 space-y-8 min-h-screen bg-background">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="shadow rounded-md p-5 border space-y-4">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-x-3">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-xl">Settlements Overview</h2>
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10"
            onClick={fetchSettlementStats}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Users className="h-5 w-5" /> Total Settlements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.totalSettlements || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" /> Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.completedCount || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <XCircle className="h-5 w-5" /> Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.pendingCount || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-600">
                <Wallet className="h-5 w-5" /> Total Amount Settled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                ₦{Number(stats?.totalAmount || 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ===== Settlement Table ===== */}
      <Card className="shadow-md border border-border rounded-2xl">
        <CardHeader className="items-center pb-3 border-b">
          <CardTitle className="flex justify-between text-xl font-semibold w-full">
            <div>Settlements List</div>
            <Button variant="outline" size="icon" onClick={() => fetchSettlements()}>
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </CardTitle>

        </CardHeader>

        <CardContent className="pt-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex gap-3 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search settlements..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>

              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-8 font-semibold bg-muted/50 py-3 px-4">
              <div>ID</div>
              <div>Wager</div>
              <div>Creator</div>
              <div>Total</div>
              <div>Status</div>
              <div>Created</div>
              <div>Processed</div>
              <div>Actions</div>
            </div>

            {loading ? (
              <div className="p-6 text-center">Loading settlements...</div>
            ) : settlements.length === 0 ? (
              <div className="p-6 text-center">No settlements found</div>
            ) : (
              settlements.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-8 px-4 py-3 border-t items-center text-sm hover:bg-muted/30 transition-colors"
                >
                  <div>{s.id.slice(0, 6)}...</div>
                  <div>{s.wagerDescription || "N/A"}</div>
                  <div>{s.creatorName || "N/A"}</div>
                  <div>₦{s.totalAmount.toLocaleString()}</div>
                  <div className="capitalize">{s.status}</div>
                  <div>{new Date(s.createdAt).toLocaleDateString()}</div>
                  <div>{s.processedAt ? new Date(s.processedAt).toLocaleDateString() : "-"}</div>
                  <div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => handleViewUsers(s.id)}>
                          <Eye className="h-4 w-4 mr-2" /> View Users
                        </DropdownMenuItem>
                        {s.status === "pending" && (
                          <DropdownMenuItem
                            onClick={() => updateSettlement(s.id, "completed")}
                            className="text-green-600"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" /> Mark Complete
                          </DropdownMenuItem>
                        )}
                        {s.status !== "failed" && (
                          <DropdownMenuItem
                            onClick={() => updateSettlement(s.id, "failed")}
                            className="text-red-600"
                          >
                            <Ban className="h-4 w-4 mr-2" /> Mark Failed
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center p-4 border-t mt-4">
            <div className="text-sm text-muted-foreground">
              Page {pagination?.pageNumber} • Showing {settlements.length} of {pagination?.total}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination?.pageNumber === 1}
                onClick={() => fetchSettlements({ pageNumber: pagination!.pageNumber - 1 })}
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination?.pageNumber === pagination?.totalPages}
                onClick={() => fetchSettlements({ pageNumber: pagination!.pageNumber + 1 })}
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settled Users Modal */}
      <SettledUsersModal
        settlementId={selectedSettlementId}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        fetchSettledUsers={fetchSettledUsers}
      />
    </div>
  );
}
