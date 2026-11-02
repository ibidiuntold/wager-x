'use client';

import React, { useEffect, useState } from 'react';
import { collection, Timestamp, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { Card } from "@/components/ui/card";
import { useToast } from "@/contexts/ToastContext";

interface Subscriber {
  id: string;
  email: string;
  createdAt: Timestamp;
}

export default function AdminSubscribersPage() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubscribers = async () => {
      try {
        const res = await fetch('/api/subscribers');
        if (res.ok) {
          const data = await res.json();
          setSubscribers(data.subscribers || []);
        } else {
          setError('Failed to fetch subscribers');
        }
      } catch (err) {
        setError('Failed to fetch subscribers');
      } finally {
        setLoading(false);
      }
    };
    fetchSubscribers();
  }, []);

  if (loading) return <div>Loading subscribers...</div>;
  if (error) return <div>{error}</div>;

  const handleDelete = async (subscriberId: string) => {
    try {
      const res = await fetch(`/api/subscribers/${subscriberId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setSubscribers(subscribers.filter((sub: any) => sub.id !== subscriberId));
        toast({
          title: "Success",
          description: "Subscriber deleted successfully",
        });
      } else {
        throw new Error('Failed to delete subscriber');
      }
    } catch (error) {
      console.error('Error deleting subscriber:', error);
      toast({
        title: "Error",
        description: "Failed to delete subscriber",
      });
    }
  };

  return (
    <div className="p-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Newsletter Subscribers</h1>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Date Subscribed</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : !subscribers?.length ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    No subscribers found
                  </TableCell>
                </TableRow>
              ) : (
                subscribers.map((subscriber: any) => (
                  <TableRow key={subscriber.id}>
                    <TableCell>{subscriber.email}</TableCell>
                    <TableCell>
                      {format(subscriber.createdAt.toDate?.() || new Date(subscriber.createdAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(subscriber.id)}
                        className="hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

      </Card>
    </div>
  );
}
