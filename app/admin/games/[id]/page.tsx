'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Gamepad2, Save, ArrowLeft, Upload } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { useParams } from 'next/navigation';

interface Game {
  id: string;
  title: string;
  image: string;
  description: string;
  instructions: string;
  keywords: string[];
  activeStatus: boolean;
  slug: string;
  gameSettings: {
    maxPlayers: number;
    minBalance: number;
    turnDuration: number;
    houseEdge: number;
    minWager: number;
    maxWager: number;
  };
}

export default function GameDetailPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [game, setGame] = useState<Game | null>(null);
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

    async function fetchGame() {
      try {
        const db = getFirestore(getApp());
        const gameRef = doc(db, 'games', id);
        const gameDoc = await getDoc(gameRef);
        
        if (gameDoc.exists()) {
          const data = gameDoc.data();
          setGame({
            id: gameDoc.id,
            title: data.title || '',
            image: data.image || '',
            description: data.description || '',
            instructions: data.instructions || '',
            keywords: data.keywords || [],
            activeStatus: data.activeStatus || false,
            slug: data.slug || '',
            gameSettings: {
              maxPlayers: Number(data.gameSettings?.maxPlayers) || 0,
              minBalance: Number(data.gameSettings?.minBalance) || 0,
              turnDuration: Number(data.gameSettings?.turnDuration) || 0,
              houseEdge: Number(data.gameSettings?.houseEdge) || 0,
              minWager: Number(data.gameSettings?.minBalance) || 0, // Using minBalance from Firebase
              maxWager: Number(data.gameSettings?.maxBalance) || 0, // Using maxBalance from Firebase
            }
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching game:', error);
        setLoading(false);
      }
    }

    fetchGame();
  }, [auth.currentUser, id, router]);

  const handleSave = async () => {
    if (!game) return;

    try {
      setSaving(true);
      const db = getFirestore(getApp());
      const gameRef = doc(db, 'games', game.id);
      
      // Map UI fields back to Firebase field names
      await updateDoc(gameRef, {
        title: game.title,
        image: game.image,
        description: game.description,
        instructions: game.instructions,
        keywords: game.keywords,
        activeStatus: game.activeStatus,
        slug: game.slug,
        gameSettings: {
          maxPlayers: Number(game.gameSettings.maxPlayers) || 0,
          minBalance: Number(game.gameSettings.minWager) || 0, // Save minWager as minBalance
          maxBalance: Number(game.gameSettings.maxWager) || 0, // Save maxWager as maxBalance
          turnDuration: Number(game.gameSettings.turnDuration) || 0,
          houseEdge: Number(game.gameSettings.houseEdge) || 0,
        }
      });

      toast({
        title: "Changes saved successfully",
        description: "The game has been updated.",
      });
      
      setSaving(false);
      router.push('/admin/games');
    } catch (error) {
      console.error('Error saving game:', error);
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
      const storageRef = ref(storage, `games/${id}/${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setGame(prev => prev ? { ...prev, image: url } : null);
      toast({
        title: "Image uploaded successfully",
        description: "The game image has been updated.",
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

  if (loading) {
    return (
      <div className="p-6 text-center">
        Loading game details...
      </div>
    );
  }

  if (!game) {
    return (
      <div className="p-6 text-center">
        Game not found
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 min-h-screen bg-background">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/games')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Games
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
            <CardTitle className="text-lg font-semibold">Game Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-primary cursor-pointer transition-colors duration-200"
              onClick={() => fileInputRef.current?.click()}
            >
              {game.image ? (
                <Image
                  src={game.image}
                  alt={game.title}
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

        {/* Game Details Section */}
        <Card className="shadow-sm border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-primary" />
              Game Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={game.title}
                  onChange={(e) => setGame({ ...game, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={game.slug}
                  onChange={(e) => setGame({ ...game, slug: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={game.description}
                onChange={(e) => setGame({ ...game, description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={game.activeStatus}
                onCheckedChange={(checked) => setGame({ ...game, activeStatus: checked })}
              />
              <Label>Active Status</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={game.instructions}
                onChange={(e) => setGame({ ...game, instructions: e.target.value })}
                rows={4}
                placeholder="Enter game instructions..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords (comma separated)</Label>
              <Input
                id="keywords"
                value={game.keywords?.join(', ')}
                onChange={(e) => setGame({ 
                  ...game, 
                  keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                })}
                placeholder="Enter keywords..."
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Game Settings</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="minWager">Minimum Wager (₦)</Label>
                  <Input
                    id="minWager"
                    type="number"
                    value={game.gameSettings.minWager || 0}
                    onChange={(e) => setGame({
                      ...game,
                      gameSettings: {
                        ...game.gameSettings,
                        minWager: parseInt(e.target.value) || 0
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxWager">Maximum Wager (₦)</Label>
                  <Input
                    id="maxWager"
                    type="number"
                    value={game.gameSettings.maxWager || 0}
                    onChange={(e) => setGame({
                      ...game,
                      gameSettings: {
                        ...game.gameSettings,
                        maxWager: parseInt(e.target.value) || 0
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="maxPlayers">Max Players</Label>
                  <Input
                    id="maxPlayers"
                    type="number"
                    value={game.gameSettings.maxPlayers || 0}
                    onChange={(e) => setGame({
                      ...game,
                      gameSettings: {
                        ...game.gameSettings,
                        maxPlayers: parseInt(e.target.value) || 0
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="turnDuration">Turn Duration (seconds)</Label>
                  <Input
                    id="turnDuration"
                    type="number"
                    value={game.gameSettings.turnDuration || 0}
                    onChange={(e) => setGame({
                      ...game,
                      gameSettings: {
                        ...game.gameSettings,
                        turnDuration: parseInt(e.target.value) || 0
                      }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="houseEdge">House Edge (%)</Label>
                  <Input
                    id="houseEdge"
                    type="number"
                    step="0.1"
                    value={game.gameSettings.houseEdge || 0}
                    onChange={(e) => setGame({
                      ...game,
                      gameSettings: {
                        ...game.gameSettings,
                        houseEdge: parseFloat(e.target.value) || 0
                      }
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Current value: {game.gameSettings.houseEdge || 0}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
