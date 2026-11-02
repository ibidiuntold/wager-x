'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Scale, Save, ArrowLeft, Upload, Plus, Trash } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WagerOption {
  name: string;
  odds: number;
}

interface Wager {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  image: string;
  options: WagerOption[];
  totalPool: number;
  expiresAt: string;
  slug: string;
}

const defaultWager = {
  title: '',
  description: '',
  category: '',
  status: 'open',
  image: '',
  options: [],
  totalPool: 0,
  expiresAt: '',
  slug: ''
};

export default function WagerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [wager, setWager] = useState<Wager | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { auth } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth.currentUser) {
      router.push('/admin/login');
      return;
    }

    async function fetchWager() {
      try {
        const db = getFirestore(getApp());
        const wagerRef = doc(db, 'wagers', id);
        const wagerDoc = await getDoc(wagerRef);
        
        if (wagerDoc.exists()) {
          const data = wagerDoc.data();
          setWager({
            id: id,
            title: data.title || '',
            description: data.description || '',
            category: data.category || '',
            status: data.status || 'open',
            image: data.image || '',
            options: data.options || [],
            totalPool: Number(data.totalPool) || 0,
            expiresAt: data.expiresAt || '',
            slug: data.slug || ''
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching wager:', error);
        setLoading(false);
      }
    }

    fetchWager();
  }, [auth.currentUser, id, router]);

  const handleSave = async () => {
    if (!wager) return;

    try {
      setSaving(true);
      const db = getFirestore(getApp());
      const wagerRef = doc(db, 'wagers', wager.id);
      
      await updateDoc(wagerRef, {
        id: id, // Ensure the id field matches the document ID
        title: wager.title,
        description: wager.description,
        category: wager.category,
        status: wager.status,
        image: wager.image,
        options: wager.options,
        totalPool: Number(wager.totalPool),
        expiresAt: wager.expiresAt,
        slug: wager.slug
      });

      toast({
        title: "Changes saved successfully",
        description: "The wager has been updated.",
      });
      
      setSaving(false);
      router.push('/admin/wagers');
    } catch (error) {
      console.error('Error saving wager:', error);
      toast({
        title: "Error saving changes",
        description: "Please try again.",
        variant: "destructive",
      });
      setSaving(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploading(true);
      const storage = getStorage(getApp());
      const storageRef = ref(storage, `wagers/${id}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setWager(prev => prev ? { ...prev, image: url } : null);
      toast({
        title: "Image uploaded successfully",
        description: "The wager image has been updated.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error uploading image",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleAddOption = () => {
    if (!wager) return;
    setWager({
      ...wager,
      options: [...wager.options, { name: '', odds: 1 }]
    });
  };

  const handleRemoveOption = (index: number) => {
    if (!wager) return;
    const newOptions = [...wager.options];
    newOptions.splice(index, 1);
    setWager({
      ...wager,
      options: newOptions
    });
  };

  const handleOptionChange = (index: number, field: keyof WagerOption, value: string) => {
    if (!wager) return;
    const newOptions = [...wager.options];
    newOptions[index] = {
      ...newOptions[index],
      [field]: field === 'odds' ? parseFloat(value) : value
    };
    setWager({
      ...wager,
      options: newOptions
    });
  };

  const handleStatusChange = (checked: boolean) => {
    if (!wager) return;
    const newStatus = checked ? 'open' : 'closed';
    
    // If closing the wager and no expiry date is set, set it to current date/time
    let newExpiresAt = wager.expiresAt;
    if (newStatus === 'closed' && !wager.expiresAt) {
      const now = new Date();
      newExpiresAt = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    }

    setWager({
      ...wager,
      status: newStatus,
      expiresAt: newExpiresAt
    });
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        Loading wager details...
      </div>
    );
  }

  if (!wager) {
    return (
      <div className="p-6 text-center">
        Wager not found
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-background">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/wagers')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Wagers
        </Button>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Image Upload Section */}
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Wager Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary cursor-pointer transition-colors duration-200"
              onClick={() => fileInputRef.current?.click()}
            >
              {wager.image ? (
                <Image
                  src={wager.image}
                  alt={wager.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Upload className="h-12 w-12 text-gray-400" />
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
            <p className="text-sm text-center text-muted-foreground mt-2">
              Click to upload or drag and drop
            </p>
          </CardContent>
        </Card>

        {/* Wager Details Section */}
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Scale className="h-5 w-5 text-primary" />
              Wager Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={wager.title}
                  onChange={(e) => setWager({ ...wager, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={wager.slug}
                  onChange={(e) => setWager({ ...wager, slug: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={wager.description}
                onChange={(e) => setWager({ ...wager, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={wager.category} 
                  onValueChange={(value) => setWager({ ...wager, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="politics">Politics</SelectItem>
                    <SelectItem value="sports">Sports</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="status">Status</Label>
                  <Switch
                    id="status"
                    checked={wager.status === 'open'}
                    onCheckedChange={handleStatusChange}
                    className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-gray-200 dark:data-[state=unchecked]:bg-gray-700"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {wager.status === 'open' ? 'Wager is open for betting' : 'Wager is closed'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expires At</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={wager.expiresAt}
                onChange={(e) => setWager({ ...wager, expiresAt: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalPool">Total Pool (₦)</Label>
              <Input
                id="totalPool"
                type="number"
                value={wager.totalPool}
                disabled
                className="bg-gray-100 dark:bg-gray-800"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Total pool is automatically calculated based on user wagers
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Wager Options</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Option
                </Button>
              </div>
              
              <div className="space-y-4">
                {wager.options.map((option, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-1">
                      <Label htmlFor={`option-name-${index}`}>Option Name</Label>
                      <Input
                        id={`option-name-${index}`}
                        value={option.name}
                        onChange={(e) => handleOptionChange(index, 'name', e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`option-odds-${index}`}>Odds</Label>
                      <Input
                        id={`option-odds-${index}`}
                        type="number"
                        step="0.1"
                        value={option.odds}
                        disabled
                        className="mt-2 bg-gray-100 dark:bg-gray-800"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Odds are automatically calculated based on user activity
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      className="mt-8"
                    >
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
