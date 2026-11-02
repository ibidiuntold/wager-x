'use client';

import React, { useEffect, useState } from 'react';
import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import dynamic from 'next/dynamic';

// Import TinyMCE with SSR disabled
const Editor = dynamic(() => 
  import('@tinymce/tinymce-react').then(mod => {
    const { Editor } = mod;
    return function EditorWrapper(props: any) {
      return <Editor {...props} />;
    };
  }), {
  ssr: false,
  loading: () => <div className="min-h-[400px] border rounded-md bg-muted/10" />
});

interface Subscriber {
  id: string;
  email: string;
  createdAt: any; // Changed from Timestamp to any as per new_code
  selected?: boolean;
}

export default function AdminBroadcastPage() {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
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

  const filteredSubscribers = subscribers.filter(sub => 
    sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSelected = (id: string) => selectedIds.has(id);
  const isAllSelected = filteredSubscribers.length > 0 && filteredSubscribers.every(sub => isSelected(sub.id));

  const handleSelectAll = (checked: boolean | 'indeterminate'): void => {
    if (checked === true) {
      setSelectedIds(new Set(filteredSubscribers.map(sub => sub.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSubscriberSelect = (id: string, checked: boolean | 'indeterminate'): void => {
    const newSelectedIds = new Set(selectedIds);
    if (checked === true) {
      newSelectedIds.add(id);
    } else {
      newSelectedIds.delete(id);
    }
    setSelectedIds(newSelectedIds);
  };

  const handleBroadcast = async () => {
    if (!subject.trim()) {
      toast({
        title: "Error",
        description: "Please enter a subject",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter some content",
      });
      return;
    }

    const selectedEmails = subscribers.filter(sub => isSelected(sub.id)).map(sub => sub.email);
    if (selectedEmails.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one subscriber",
      });
      return;
    }

    setBroadcasting(true);
    try {
      const res = await fetch('/api/admin/newsletter/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content, recipients: selectedEmails }),
      });
      if (!res.ok) throw new Error('Failed to send broadcast');

      toast({
        title: "Success",
        description: "Newsletter sent successfully",
      });

      // Reset form
      setSubject('');
      setContent('');
      setSelectedIds(new Set());
    } catch (err) {
      setError('Failed to send broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  if (loading) return <div>Loading subscribers...</div>;
  if (error) return <div>{error}</div>;

  return (
      <div className="p-6">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Send Newsletter</h1>
          </div>

          <div className="flex gap-6">
            {/* Editor Section */}
            <div className="flex-1 space-y-6">
              {/* Subject */}
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Newsletter subject"
                />
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label>Content</Label>
                <div className="min-h-[400px] border rounded-md">
                  <Editor
                    apiKey="ek029vjhcppuq6b0p0xmvmdgs5nro99hcazb4vtypwzk2855"
                    value={content}
                    onEditorChange={(newContent: string) => setContent(newContent)}
                    init={{
                      height: 400,
                      menubar: true,
                      plugins: [
                        'anchor', 'autolink', 'charmap', 'codesample', 'emoticons', 'image', 'link', 'lists', 'media', 'searchreplace', 'table', 'visualblocks', 'wordcount',
                        'checklist', 'mediaembed', 'casechange', 'export', 'formatpainter', 'pageembed', 'a11ychecker', 'tinymcespellchecker', 'permanentpen', 'powerpaste', 'advtable', 'advcode', 'editimage', 'advtemplate', 'ai', 'mentions', 'tinycomments', 'tableofcontents', 'footnotes', 'mergetags', 'autocorrect', 'typography', 'inlinecss', 'markdown', 'importword', 'exportword', 'exportpdf'
                      ],
                      toolbar: 'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table mergetags | addcomment showcomments | spellcheckdialog a11ycheck typography | align lineheight | checklist numlist bullist indent outdent | emoticons charmap | removeformat',
                      tinycomments_mode: 'embedded',
                      tinycomments_author: 'Author name',
                      mergetags_list: [
                        { value: 'First.Name', title: 'First Name' },
                        { value: 'Email', title: 'Email' },
                      ],
                      ai_request: (request: any, respondWith: any) => respondWith.string(() => Promise.reject('See docs to implement AI Assistant')),
                    }}
                  />
                </div>
              </div>

              {/* Send Button */}
              <Button
                onClick={handleBroadcast}
                disabled={broadcasting}
                className="w-full"
              >
                {broadcasting ? "Sending..." : "Send Newsletter"}
              </Button>
            </div>

            {/* Recipients Section */}
            <div className="w-80 space-y-4">
              <div className="flex items-center gap-2">
                <Label>Recipients</Label>
                <span className="text-sm text-muted-foreground">
                  ({selectedIds.size} selected)
                </span>
              </div>

              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subscribers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="border rounded-md max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : filteredSubscribers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-8">
                          {searchQuery ? 'No matching subscribers' : 'No subscribers found'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                          <TableCell>
                            <Checkbox
                              checked={isSelected(subscriber.id)}
                              onCheckedChange={(checked: boolean | 'indeterminate') => 
                                handleSubscriberSelect(subscriber.id, checked)
                              }
                            />
                          </TableCell>
                          <TableCell>{subscriber.email}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </Card>
      </div>
  );
}
