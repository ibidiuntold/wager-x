'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import UserManagement from "@/components/admin/UserManagement";
import GameManagement from "@/components/admin/GameManagement";
import WagerManagement from "@/components/admin/WagerManagement";
import SiteSettings from "@/components/admin/SiteSettings";
import PaymentSettings from "@/components/admin/PaymentSettings";
import PageManagement from "@/components/admin/PageManagement";

export default function AdminPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="w-full border-b">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="wagers">Wagers</TabsTrigger>
          <TabsTrigger value="site">Site Settings</TabsTrigger>
          <TabsTrigger value="payment">Payment Gateways</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="games" className="mt-4">
          <GameManagement />
        </TabsContent>

        <TabsContent value="wagers" className="mt-4">
          <WagerManagement />
        </TabsContent>

        <TabsContent value="site" className="mt-4">
          <SiteSettings />
        </TabsContent>

        <TabsContent value="payment" className="mt-4">
          <PaymentSettings />
        </TabsContent>

        <TabsContent value="pages" className="mt-4">
          <PageManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
