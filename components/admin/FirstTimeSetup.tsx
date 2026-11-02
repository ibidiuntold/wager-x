import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield } from "lucide-react";

export default function FirstTimeSetup() {
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-blue-500" />
          <CardTitle>First Time Admin Setup</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Alert>
          <AlertTitle>Welcome to the Admin Setup</AlertTitle>
          <AlertDescription>
            You are about to create the first admin account for this system. This account will have full administrative privileges and can manage other admin accounts. Please use a secure email and password combination.
          </AlertDescription>
        </Alert>
        
        <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>As the super admin, you will be able to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Manage user accounts and roles</li>
            <li>Configure system settings</li>
            <li>Manage payment gateways</li>
            <li>Control game settings</li>
            <li>Edit site content</li>
            <li>Grant admin access to other users</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
