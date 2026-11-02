'use client';

import React, { useState } from 'react';
import { Scale, Plus, Trash } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface WagerOption {
  name: string;
  odds: number;
}

interface AddWagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddWagerModal({ isOpen, onClose, onSuccess }: AddWagerModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [wager, setWager] = useState({
    title: '',
    description: '',
    category: '',
    status: 'open',
    image: '',
    options: [] as WagerOption[],
    totalPool: 0,
    expiresAt: '',
    slug: '',
    wagerType: 'p2p' as 'p2p' | 'event',
  });
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  const handleSubmit = async () => {
    if (!wager.title || !wager.description || !wager.category || !wager.slug) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/wagers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...wager }),
      });
      if (!res.ok) throw new Error('Failed to add wager');

      toast({
        title: "Wager created successfully",
        description: "The new wager has been added.",
      });
      
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating wager:', error);
      toast({
        title: "Error creating wager",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddOption = () => {
    setWager({
      ...wager,
      options: [...wager.options, { name: '', odds: 1 }]
    });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...wager.options];
    newOptions.splice(index, 1);
    setWager({
      ...wager,
      options: newOptions
    });
  };

  const handleOptionChange = (index: number, field: keyof WagerOption, value: string) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Add New Wager
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={wager.title}
                onChange={(e) => setWager({ ...wager, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={wager.slug}
                onChange={(e) => setWager({ ...wager, slug: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={wager.description}
              onChange={(e) => setWager({ ...wager, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              {!showCustomCategory ? (
                <Select 
                  value={wager.category} 
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setShowCustomCategory(true);
                    } else {
                      setWager({ ...wager, category: value });
                    }
                  }}
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
                    <SelectItem value="custom">Add Custom Category</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter custom category"
                    value={customCategory}
                    onChange={(e) => {
                      setCustomCategory(e.target.value);
                      setWager({ ...wager, category: e.target.value });
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowCustomCategory(false);
                      setCustomCategory('');
                      setWager({ ...wager, category: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={wager.status} 
                onValueChange={(value) => setWager({ ...wager, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
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
              value={0}
              disabled
              className="bg-gray-100 dark:bg-gray-800"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Total pool is automatically calculated based on user wagers
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wagerType">Wager Type</Label>
              <Select
                value={wager.wagerType}
                onValueChange={(value: 'p2p' | 'event') =>
                  setWager({ ...wager, wagerType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="p2p">P2P (Pool-based)</SelectItem>
                  <SelectItem value="event">Event (Fixed Odds)</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
                      min="1"
                      value={option.odds}
                      disabled={wager.wagerType === 'p2p'}
                      className={`mt-2 ${wager.wagerType === 'p2p' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                      onChange={(e) => handleOptionChange(index, 'odds', e.target.value)}
                    />
                    {wager.wagerType === 'p2p' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Odds are automatically calculated based on user activity
                      </p>
                    )}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Wager'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
