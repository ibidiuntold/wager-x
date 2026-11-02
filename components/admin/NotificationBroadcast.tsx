'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNotification } from '@/contexts/NotificationContext';
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function NotificationBroadcast() {
  const { broadcastNotification } = useNotification();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [category, setCategory] = useState<'dropdown' | 'toast' | 'push'>('dropdown');
  const [buttonText, setButtonText] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [includeButton, setIncludeButton] = useState(false);

  const handleBroadcast = async () => {
    if (!title || !message) {
      toast({
        title: "Error",
        description: "Title and message are required",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Prepare notification object
      const notification = {
        title,
        message,
        type,
        category,
        scope: 'global' as const,
        buttons: includeButton && buttonText && buttonLink 
          ? [{ text: buttonText, link: buttonLink }] 
          : undefined
      };

      await broadcastNotification(notification);
      
      // Reset form
      setTitle('');
      setMessage('');
      setType('info');
      setCategory('dropdown');
      setButtonText('');
      setButtonLink('');
      setIncludeButton(false);
      
      // Show success message
      toast({
        title: "Success",
        description: "Notification has been sent to all users",
        variant: "default"
      });
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      toast({
        title: "Error",
        description: "Failed to send notification. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Broadcast Notification</CardTitle>
        <CardDescription>Send notifications to all users</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input 
            id="title" 
            placeholder="Notification title" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea 
            id="message" 
            placeholder="Enter your notification message" 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select 
              value={type} 
              onValueChange={(value) => setType(value as any)}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              value={category} 
              onValueChange={(value) => setCategory(value as any)}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dropdown">Dropdown Only</SelectItem>
                <SelectItem value="toast">Toast</SelectItem>
                <SelectItem value="push">Push Notification</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox" 
              id="includeButton" 
              checked={includeButton}
              onChange={(e) => setIncludeButton(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <Label htmlFor="includeButton">Include Action Button</Label>
          </div>
          
          {includeButton && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="buttonText">Button Text</Label>
                <Input 
                  id="buttonText" 
                  placeholder="Click Here" 
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buttonLink">Button Link</Label>
                <Input 
                  id="buttonLink" 
                  placeholder="https://example.com" 
                  value={buttonLink}
                  onChange={(e) => setButtonLink(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleBroadcast} 
          disabled={isLoading || !title || !message}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            'Send Notification'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}