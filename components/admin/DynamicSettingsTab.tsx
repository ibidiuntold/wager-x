"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { settingsFieldMap, fieldTypeMap, FieldType } from "@/types/adminSettings";

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type DynamicSettingsTabProps = {
  endpoint: string; // e.g. "social-links" or "settings/seo"
  title?: string;
  pageSize?: number;
};

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = (e) => reject(e);
    fr.readAsDataURL(file);
  });
}

export default function DynamicSettingsTab({
  endpoint,
  title,
  pageSize = 10,
}: DynamicSettingsTabProps) {
  const normalizedEndpoint = useMemo(
    () => endpoint.replace(/^settings\//, "").replace(/^\//, ""),
    [endpoint]
  );
  const baseUrl = useMemo(() => `/api/${endpoint}`, [endpoint]);

  const [items, setItems] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [formState, setFormState] = useState<Record<string, any>>({});
  const [initialForm, setInitialForm] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchList = useCallback(
    async (pageToFetch = 1) => {
      try {
        setLoading(true);
        setError(null);
        const url = new URL(baseUrl, window.location.origin);
        url.searchParams.set("page", String(pageToFetch));
        url.searchParams.set("limit", String(pageSize));

        const res = await fetch(url.toString());
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || "Failed to fetch");

        const d = data.data ?? data.rows ?? data;
        const p = data.pagination ?? null;

        setItems(Array.isArray(d) ? d : []);
        setPagination(p);
        setPage(pageToFetch);
      } catch (err: any) {
        console.error("fetchList error:", err);
        setError(err.message || "Failed to fetch list");
      } finally {
        setLoading(false);
      }
    },
    [baseUrl, pageSize]
  );

  useEffect(() => {
    fetchList(1);
  }, [fetchList]);

  const handleOpenCreate = () => {
    setSelected(null);
    setFormState({});
    setInitialForm({});
    setIsCreating(true);
    setModalOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setSelected(item);
    const cloned: Record<string, any> = {};
    Object.keys(item).forEach((k) => (cloned[k] = item[k]));
    setFormState(cloned);
    setInitialForm(cloned);
    setIsCreating(false);
    setModalOpen(true);
  };

  const handleDelete = async (id: string | number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      setLoading(true);
      const res = await fetch(`${baseUrl}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Delete failed");
      await fetchList(page);
    } catch (err: any) {
      console.error("delete error:", err);
      setError(err.message || "Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const isDirty = useMemo(() => {
    const keys = new Set([...Object.keys(initialForm || {}), ...Object.keys(formState || {})]);
    for (const k of keys) {
      const a = initialForm?.[k];
      const b = formState?.[k];
      if (typeof a === "number" || typeof b === "number") {
        if (Number(a) !== Number(b)) return true;
      } else if (a !== b) return true;
    }
    return false;
  }, [initialForm, formState]);

  const handleFileChange = async (field: string, file?: File | null) => {
    if (!file) return;
    try {
      setLoading(true);
      const base64 = await readFileAsBase64(file);
      setFormState((prev) => ({ ...prev, [field]: base64 }));
    } catch {
      setError("Failed to read file");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) =>
    setFormState((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);

      const body = { ...formState };
      const method = selected?.id ? "PUT" : "POST";
      const url = selected?.id ? `${baseUrl}/${selected.id}` : baseUrl;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Save failed");

      setModalOpen(false);
      await fetchList(1);
    } catch (err: any) {
      console.error("save error:", err);
      setError(err.message || "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const sample = useMemo(() => {
    if (selected) return selected;
    if (items && items.length) return items[0];
    return { id: "" };
  }, [selected, items]);

  // Get field type from metadata
  const getFieldType = (key: string): FieldType => {
    const typeMap = fieldTypeMap[normalizedEndpoint];
    if (typeMap && typeMap[key]) {
      return typeMap[key];
    }
    
    // Fallback to sample-based detection for edit mode
    if (!isCreating && sample && sample[key] !== undefined) {
      const value = sample[key];
      if (typeof value === "boolean") return "boolean";
      if (typeof value === "number") return "number";
      if (typeof value === "string" && value.startsWith("data:")) return "file";
    }
    
    return "string";
  };

  const renderInputFor = (key: string) => {
    const value = formState[key] ?? sample?.[key] ?? "";
    const fieldType = getFieldType(key);

    if (fieldType === "file") {
      const preview = typeof value === "string" && value.startsWith("data:");
      return (
        <div key={key} className="space-y-2">
          <Label>{key}</Label>
          <div className="flex items-center gap-4">
            {preview && (
              <img
                src={value}
                alt={key}
                style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }}
              />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) await handleFileChange(key, f);
              }}
            />
          </div>
        </div>
      );
    }

    if (fieldType === "boolean") {
      return (
        <div key={key} className="space-y-2">
          <Label>{key}</Label>
          <Select
            value={String(value)}
            onValueChange={(v) => handleChange(key, v === "true")}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">true</SelectItem>
              <SelectItem value="false">false</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (fieldType === "number") {
      return (
        <div key={key} className="space-y-2">
          <Label>{key}</Label>
          <Input
            type="number"
            value={value ?? ""}
            onChange={(e) =>
              handleChange(key, e.target.value === "" ? null : Number(e.target.value))
            }
          />
        </div>
      );
    }

    return (
      <div key={key} className="space-y-2">
        <Label>{key}</Label>
        <Input
          type="text"
          value={value ?? ""}
          onChange={(e) => handleChange(key, e.target.value)}
        />
      </div>
    );
  };

  const createFields = settingsFieldMap[normalizedEndpoint];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title ?? normalizedEndpoint}</h3>
        <div className="flex gap-2">
          <Button onClick={() => fetchList(1)} variant="outline">
            Refresh
          </Button>
          <Button onClick={handleOpenCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Table */}
      <div className="overflow-x-auto border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              {Object.keys(sample || {}).map((k) => (
                <TableHead key={k}>{k}</TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={Object.keys(sample || {}).length + 1}>
                  Loading...
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Object.keys(sample || {}).length + 1}
                  className="text-center py-4"
                >
                  No items
                </TableCell>
              </TableRow>
            ) : (
              items.map((it) => (
                <TableRow key={it.id}>
                  {Object.keys(sample || {}).map((k) => (
                    <TableCell key={k}>
                      {(() => {
                        const v = it[k];
                        if (typeof v === "boolean") return String(v);
                        if (typeof v === "string" && v.startsWith("data:"))
                          return (
                            <img
                              src={v}
                              alt={k}
                              style={{
                                width: 40,
                                height: 24,
                                objectFit: "cover",
                                borderRadius: 4,
                              }}
                            />
                          );
                        return v ?? "-";
                      })()}
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(it)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(it.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogTrigger asChild>
          <span />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selected ? `Edit ${normalizedEndpoint}` : `Create ${normalizedEndpoint}`}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 max-h-[60vh] overflow-auto">
            {isCreating ? (
              createFields && createFields.length > 0 ? (
                createFields.map((field) => (
                  <React.Fragment key={field}>{renderInputFor(field)}</React.Fragment>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  No field configuration found for {normalizedEndpoint}
                </p>
              )
            ) : (
              Object.keys(sample || {}).map((k) => {
                if (k === "id")
                  return (
                    <div key={k} className="space-y-2">
                      <Label>{k}</Label>
                      <Input readOnly value={formState[k] ?? sample[k] ?? ""} />
                    </div>
                  );
                return renderInputFor(k);
              })
            )}
          </div>

          <DialogFooter className="mt-4 flex justify-between">
            {selected?.id && (
              <Button variant="destructive" onClick={() => handleDelete(selected.id)}>
                Delete
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={!isDirty || isSaving}>
                {isSaving ? "Saving..." : selected ? "Save changes" : "Create"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}