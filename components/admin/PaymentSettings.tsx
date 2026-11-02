"use client"

import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from "@/components/ui/button"; 
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from 'lucide-react';

interface PaymentProcessor {
  id: string; 
  name: string;
  isEnabled: boolean;
  testMode: boolean;
  credentials: {
    publicKey: string;
    secretKey: string;
  };
}

export default function PaymentSettings() {
  const { toast } = useToast();
  // Remove: const firestore = useFirestore();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/payment/settings');
        if (res.ok) {
          const data = await res.json();
          setSettings(data.settings || null);
        } else {
          setError('Failed to fetch payment settings');
        }
      } catch (err) {
        setError('Failed to fetch payment settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Add update logic as needed

  if (loading) return <div>Loading payment settings...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h2>Payment Settings</h2>
      {/* Render and update payment settings here */}
    </div>
  );
}
