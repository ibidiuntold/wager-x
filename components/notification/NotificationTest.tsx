'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useNotification } from '@/contexts/NotificationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';

export default function NotificationTest() {
  const { addNotification, requestPushPermission, isPushEnabled } = useNotification();
  const { toast } = useToast();
  const [title, setTitle] = useState('Test Notification');
  const [message, setMessage] = useState('This is a test notification message');
  const [type, setType] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  const [category, setCategory] = useState<'dropdown' | 'toast' | 'push'>('dropdown');
  const [buttonText, setButtonText] = useState('Learn More');
  const [buttonLink, setButtonLink] = useState('https://wagerx.ng');
  const [includeButton, setIncludeButton] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendNotification = async () => {
    setLoading(true);
    try {
      // Handle push notification permission if needed
      if (category === 'push' && !isPushEnabled) {
        const granted = await requestPushPermission();
        if (!granted) {
          toast({
            title: "Push permission denied",
            description: "Please enable notifications in your browser settings",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      // Prepare notification object
      const notification = {
        title,
        message,
        type,
        category,
        scope: 'personal' as const,
        buttons: includeButton && buttonText && buttonLink 
          ? [{ text: buttonText, link: buttonLink }] 
          : undefined
      };

      // Send notification
      await addNotification(notification);
      
      toast({
        title: "Success",
        description: "Test notification sent successfully",
        variant: "default"
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error",
        description: "Failed to send test notification",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Test Notification System</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification Title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Notification Message"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as any)}>
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
            <Select value={category} onValueChange={(value) => setCategory(value as any)}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dropdown">Dropdown</SelectItem>
                <SelectItem value="toast">Toast</SelectItem>
                <SelectItem value="push">Push</SelectItem>
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
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Button Text"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buttonLink">Button Link</Label>
                <Input
                  id="buttonLink"
                  value={buttonLink}
                  onChange={(e) => setButtonLink(e.target.value)}
                  placeholder="Button Link"
                />
              </div>
            </div>
          )}
        </div>

        <Button 
          className="w-full" 
          onClick={handleSendNotification}
          disabled={loading || !title || !message}
        >
          {loading ? "Sending..." : "Send Test Notification"}
        </Button>
      </CardContent>
    </Card>
  );
}