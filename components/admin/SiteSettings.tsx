"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DynamicSettingsTab from "@/components/admin/DynamicSettingsTab";

export default function SiteSettings() {
  return (
    <div className="p-4">
      <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="payment">Payment Gateways</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="smtp">SMTP</TabsTrigger>
          <TabsTrigger value="social">Social Links</TabsTrigger>
        </TabsList>

        <div className="mt-4 space-y-4">
          <TabsContent value="system" className="rounded-xl bg-white dark:bg-gray-800 p-4">
            <DynamicSettingsTab endpoint="settings/system" title="System Settings" />
          </TabsContent>

          <TabsContent value="payment" className="rounded-xl bg-white dark:bg-gray-800 p-4">
            <DynamicSettingsTab endpoint="settings/payment-gateways" title="Payment Gateways" />
          </TabsContent>

          <TabsContent value="seo" className="rounded-xl bg-white dark:bg-gray-800 p-4">
            <DynamicSettingsTab endpoint="settings/seo" title="SEO Settings" />
          </TabsContent>

          <TabsContent value="smtp" className="rounded-xl bg-white dark:bg-gray-800 p-4">
            <DynamicSettingsTab endpoint="settings/smtp" title="SMTP Settings" />
          </TabsContent>

          <TabsContent value="social" className="rounded-xl bg-white dark:bg-gray-800 p-4">
            <DynamicSettingsTab endpoint="settings/social-links" title="Social Links" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
