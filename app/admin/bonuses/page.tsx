'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Button,
} from "@/components/ui/button";
import {
  Input,
} from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Trash2, Pencil, Plus, RefreshCcw, Search } from "lucide-react";
import { useAdminBonus } from "@/hooks/admin/useAdminBonus";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";

export default function AdminBonusesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const {
    bonuses,
    pagination,
    loading,
    error,
    fetchBonuses,
    createBonus,
    updateBonus,
    deleteBonus,
    setFilters,
  } = useAdminBonus();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) router.push("/admin/login");
  }, [user, router]);

  // Local states
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [targetFilter, setTargetFilter] = useState("all");

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({
    name: "",
    description: "",
    type: "signup",
    target: "all",
    amount: "",
  });

  // Handlers
  const handleSearch = (value: string) => {
    setSearch(value);
    setFilters((prev) => ({ ...prev, search: value }));
  };

  const handleTypeChange = (value: string) => {
    setTypeFilter(value);
    setFilters((prev) => ({ ...prev, type: value === "all" ? "" : value }));
  };

  const handleTargetChange = (value: string) => {
    setTargetFilter(value);
    setFilters((prev) => ({ ...prev, target: value === "all" ? "" : value }));
  };

  const handleCreateOrUpdate = async () => {
    try {
      if (!formData.name || !formData.type) return alert("Please fill required fields");

      if (isEditing && formData.id) {
        await updateBonus(formData.id, formData);
      } else {
        await createBonus(formData);
      }

      setIsDialogOpen(false);
      setFormData({ name: "", description: "", type: "signup", target: "all", amount: "" });
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving bonus:", err);
    }
  };

  const handleEdit = (bonus: any) => {
    setFormData(bonus);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this bonus?")) {
      await deleteBonus(id);
    }
  };

  if (!user) return null;

  return (
    <div className="p-6 space-y-6 min-h-screen bg-background">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          🎁 Bonuses Management
        </h2>
        <Button variant="outline" size="icon" onClick={() => fetchBonuses()}>
          <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bonuses..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 w-[250px] h-10"
          />
        </div>

        <Select value={typeFilter} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[150px] h-10">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="signup">Signup</SelectItem>
            <SelectItem value="deposit">Deposit</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>

        <Select value={targetFilter} onValueChange={handleTargetChange}>
          <SelectTrigger className="w-[150px] h-10">
            <SelectValue placeholder="Target" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Targets</SelectItem>
            <SelectItem value="new_users">New Users</SelectItem>
            <SelectItem value="selected">Selected</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
            <SelectItem value="referrals">Referrals</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Bonus
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Bonus" : "Create Bonus"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Input
                  value={formData.description || ""}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="signup">Signup</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Target</Label>
                  <Select
                    value={formData.target}
                    onValueChange={(value) => setFormData({ ...formData, target: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="new_users">New Users</SelectItem>
                      <SelectItem value="selected">Selected</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="referrals">Referrals</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={formData.amount || ""}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>

              <Button className="w-full mt-2" onClick={handleCreateOrUpdate}>
                {isEditing ? "Update Bonus" : "Create Bonus"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bonuses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Bonuses List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-4 p-4 bg-muted/50 font-medium border-t border-s border-e rounded-t-lg">
            <div>ID</div>
            <div>Name</div>
            <div>Type</div>
            <div>Target</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Actions</div>
          </div>

          {loading ? (
            <div className="p-6 text-center">Loading bonuses...</div>
          ) : Array.isArray(bonuses) && bonuses.length === 0 ? (
            <div className="p-6 text-center">No bonuses found</div>
          ) : Array.isArray(bonuses) ? (
            bonuses.map((bonus) => (
              <div
                key={bonus.id}
                className="grid grid-cols-7 gap-4 p-4 items-center hover:bg-muted/50 border"
              >
                <div>{bonus.id?.slice(0, 6)}...</div>
                <div>{bonus.name}</div>
                <div>{bonus.type}</div>
                <div>{bonus.target}</div>
                <div>{bonus.amount || 0}</div>
                <div>{bonus.isActive ? "Active" : "Inactive"}</div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(bonus)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(bonus.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-muted-foreground">
              Unable to load bonuses
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
