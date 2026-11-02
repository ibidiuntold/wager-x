'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { useTheme } from "@/contexts/ThemeContext";
import { getFirestore, collection, query, getDocs, doc, updateDoc, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { useToast } from "@/contexts/ToastContext";

interface Page {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  lastModified: string;
  metaDescription: string;
  metaKeywords: string;
}

const defaultPage: Omit<Page, 'id'> = {
  title: '',
  slug: '',
  content: '',
  isPublished: false,
  lastModified: new Date().toISOString(),
  metaDescription: '',
  metaKeywords: ''
};

const sanitizeMetaTag = (value: string): string => {
  return value.replace(/[<>"']/g, '').trim();
};

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function PageManagement() {
  const [pages, setPages] = useState<Page[]>([]);
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchPages() {
      try {
        setError(null);
        const db = getFirestore();
        const pagesQuery = query(collection(db, 'pages'), orderBy('lastModified', 'desc'));
        const querySnapshot = await getDocs(pagesQuery);
        const pagesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Page[];
        setPages(pagesData);
      } catch (err) {
        setError('Failed to load pages');
        console.error('Error loading pages:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchPages();
  }, []);

  const handlePageStatusChange = async (pageId: string, isPublished: boolean) => {
    try {
      const db = getFirestore();
      await updateDoc(doc(db, 'pages', pageId), {
        isPublished,
        lastModified: new Date().toISOString()
      });
      
      setPages(prev => prev.map(page => 
        page.id === pageId 
          ? { ...page, isPublished, lastModified: new Date().toISOString() }
          : page
      ));

      toast({
        title: "Success",
        description: `Page ${isPublished ? 'published' : 'unpublished'} successfully`,
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to update page status",
        variant: "destructive",
      });
    }
  };

  const validatePage = (page: Page) => {
    if (!page.title.trim()) {
      throw new Error('Title is required');
    }
    if (!page.slug.trim()) {
      throw new Error('Slug is required');
    }
    if (!page.content.trim()) {
      throw new Error('Content is required');
    }
    // Validate slug format
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(page.slug)) {
      throw new Error('Invalid slug format. Use lowercase letters, numbers, and hyphens only');
    }
    // Check for duplicate slug
    const existingPage = pages.find(p => p.slug === page.slug && p.id !== page.id);
    if (existingPage) {
      throw new Error('A page with this slug already exists');
    }
    // Validate meta description length
    if (page.metaDescription && page.metaDescription.length > 160) {
      throw new Error('Meta description should not exceed 160 characters');
    }
  };

  const handleSavePage = async () => {
    if (!selectedPage) return;

    try {
      setSaving(true);
      setError(null);

      const pageToSave = {
        ...selectedPage,
        metaDescription: sanitizeMetaTag(selectedPage.metaDescription),
        metaKeywords: sanitizeMetaTag(selectedPage.metaKeywords),
        lastModified: new Date().toISOString()
      };

      validatePage(pageToSave);

      const db = getFirestore();

      if (selectedPage.id) {
        await updateDoc(doc(db, 'pages', selectedPage.id), pageToSave);
        setPages(prev => prev.map(page => 
          page.id === selectedPage.id ? pageToSave : page
        ));
      } else {
        const docRef = doc(collection(db, 'pages'));
        await setDoc(docRef, pageToSave);
        setPages(prev => [...prev, { ...pageToSave, id: docRef.id }]);
      }

      toast({
        title: "Success",
        description: `Page ${selectedPage.id ? 'updated' : 'created'} successfully`,
        variant: "default",
      });
      setSelectedPage(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save page';
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePage = () => {
    setSelectedPage({
      ...defaultPage,
      id: '',
      lastModified: new Date().toISOString()
    });
  };

  const handleDeletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const db = getFirestore();
      await deleteDoc(doc(db, 'pages', pageId));
      setPages(prev => prev.filter(page => page.id !== pageId));
      
      toast({
        title: "Success",
        description: "Page deleted successfully",
        variant: "default",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to delete page",
        variant: "destructive",
      });
    }
  };

  const handleViewPage = (slug: string) => {
    try {
      window.open(`/${slug}`, '_blank')?.focus();
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to open page in new tab",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="border-none shadow-md dark:bg-gray-800/50">
          <CardHeader>
            <Skeleton className="h-8 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!selectedPage ? (
        <Card className="border-none shadow-md dark:bg-gray-800/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-xl font-semibold dark:text-white">Pages</CardTitle>
            <Button 
              onClick={handleCreatePage}
              className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              Create New Page
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-400">Title</TableHead>
                    <TableHead className="dark:text-gray-400">Slug</TableHead>
                    <TableHead className="dark:text-gray-400">Status</TableHead>
                    <TableHead className="dark:text-gray-400">Last Modified</TableHead>
                    <TableHead className="dark:text-gray-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id} className="dark:border-gray-700">
                      <TableCell className="dark:text-gray-300">{page.title}</TableCell>
                      <TableCell className="dark:text-gray-300">{page.slug}</TableCell>
                      <TableCell>
                        <Switch
                          checked={page.isPublished}
                          onCheckedChange={(checked) => handlePageStatusChange(page.id, checked)}
                          className="data-[state=checked]:bg-green-500 dark:data-[state=checked]:bg-green-400"
                        />
                      </TableCell>
                      <TableCell className="dark:text-gray-300">
                        {new Date(page.lastModified).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedPage(page)}
                            className="dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600"
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleViewPage(page.slug)}
                            className="dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeletePage(page.id)}
                            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-gray-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card className="border-none shadow-md dark:bg-gray-800/50">
            <CardHeader>
              <CardTitle className="text-xl font-semibold dark:text-white">
                {selectedPage.id ? 'Edit Page' : 'Create New Page'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="dark:text-gray-300">Title</Label>
                  <Input
                    id="title"
                    value={selectedPage.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setSelectedPage({
                        ...selectedPage,
                        title,
                        slug: selectedPage.id ? selectedPage.slug : generateSlug(title)
                      });
                    }}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug" className="dark:text-gray-300">Slug</Label>
                  <Input
                    id="slug"
                    value={selectedPage.slug}
                    onChange={(e) => setSelectedPage({
                      ...selectedPage,
                      slug: generateSlug(e.target.value)
                    })}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="page-url-slug"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="dark:text-gray-300">Content</Label>
                  <Textarea
                    id="content"
                    rows={15}
                    value={selectedPage.content}
                    onChange={(e) => setSelectedPage({...selectedPage, content: e.target.value})}
                    className="font-mono dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription" className="dark:text-gray-300">
                    Meta Description (max 160 characters)
                  </Label>
                  <Input
                    id="metaDescription"
                    value={selectedPage.metaDescription}
                    onChange={(e) => setSelectedPage({...selectedPage, metaDescription: e.target.value})}
                    maxLength={160}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedPage.metaDescription.length}/160 characters
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaKeywords" className="dark:text-gray-300">Meta Keywords (comma-separated)</Label>
                  <Input
                    id="metaKeywords"
                    value={selectedPage.metaKeywords}
                    onChange={(e) => setSelectedPage({...selectedPage, metaKeywords: e.target.value})}
                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="keyword1, keyword2, keyword3"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isPublished"
                    checked={selectedPage.isPublished}
                    onCheckedChange={(checked) => setSelectedPage({...selectedPage, isPublished: checked})}
                    className="data-[state=checked]:bg-green-500 dark:data-[state=checked]:bg-green-400"
                  />
                  <Label htmlFor="isPublished" className="dark:text-gray-300">Published</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button 
              variant="outline" 
              onClick={() => setSelectedPage(null)}
              className="dark:text-gray-300 dark:hover:bg-gray-700 dark:border-gray-600"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSavePage}
              disabled={saving}
              className="dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              {saving ? 'Saving...' : (selectedPage.id ? 'Save Changes' : 'Create Page')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
