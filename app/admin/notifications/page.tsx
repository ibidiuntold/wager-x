'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card";
import NotificationBroadcast from '@/components/admin/NotificationBroadcast';
import NotificationTest from '@/components/notification/NotificationTest';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NotificationsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Notification Management</h1>
      
      <Tabs defaultValue="broadcast" className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="broadcast">
          <div className="max-w-2xl mx-auto">
            <NotificationBroadcast />
          </div>
        </TabsContent>
        
        <TabsContent value="test">
          <div className="max-w-2xl mx-auto">
            <NotificationTest />
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Notification History</CardTitle>
              <CardDescription>View past notifications sent to users</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Notification history will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure global notification settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Notification settings will be implemented in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}