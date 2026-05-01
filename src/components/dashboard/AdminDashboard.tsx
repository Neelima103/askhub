import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase.ts';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { Material, UserProfile } from '../../types/index.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, FileCheck, Shield, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  profile: UserProfile;
}

export default function AdminDashboard({ profile }: Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for all materials
    const qM = query(collection(db, 'materials'), orderBy('createdAt', 'desc'));
    const unsubM = onSnapshot(qM, (snapshot) => {
      setMaterials(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Material)));
    });

    // Fetch users (list query restricted by rules to admins)
    const fetchUsers = async () => {
      try {
        const qU = query(collection(db, 'users'));
        const snapshot = await getDocs(qU);
        setUsers(snapshot.docs.map(d => d.data() as UserProfile));
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    return unsubM;
  }, []);

  const handleValidate = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'validated' ? 'pending' : 'validated';
      await updateDoc(doc(db, 'materials', id), { status: newStatus });
      toast.success(`Material marked as ${newStatus}`);
    } catch (err) {
      toast.error("Update failed.");
    }
  };

  const pendingCount = materials.filter(m => m.status === 'pending').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold">Admin Console</h2>
          <p className="text-muted-foreground">Manage platform content and users.</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="px-3 py-1 gap-1">
            <Users className="h-3 w-3" /> {users.length} Users
          </Badge>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="px-3 py-1 gap-1">
              <AlertCircle className="h-3 w-3" /> {pendingCount} Pending
            </Badge>
          )}
        </div>
      </div>

      <Tabs defaultValue="materials" className="w-full">
        <TabsList className="bg-white border rounded-full p-1 h-auto mb-6">
          <TabsTrigger value="materials" className="rounded-full px-6 py-2">
            <FileCheck className="mr-2 h-4 w-4" /> Materials 
          </TabsTrigger>
          <TabsTrigger value="users" className="rounded-full px-6 py-2">
            <Shield className="mr-2 h-4 w-4" /> User Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="materials">
          <div className="space-y-4">
            {materials.length > 0 ? (
              materials.map(m => (
                <Card key={m.id} className="overflow-hidden">
                  <div className="flex items-center justify-between p-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold">{m.title}</h3>
                        <Badge variant={m.status === 'validated' ? 'default' : 'secondary'} className="text-[10px] h-4">
                          {m.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        by {m.facultyName} • {m.type.replace('_', ' ')}
                      </p>
                    </div>
                    <Button 
                      variant={m.status === 'validated' ? "outline" : "default"} 
                      size="sm" 
                      className="gap-1 rounded-full"
                      onClick={() => handleValidate(m.id, m.status)}
                    >
                      {m.status === 'validated' ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      {m.status === 'validated' ? 'De-validate' : 'Validate'}
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-center py-10 text-muted-foreground">No materials found.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Platform Users</CardTitle>
              <CardDescription>View all registered users and their roles.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {users.map(u => (
                  <div key={u.uid} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground">
                        {u.displayName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{u.displayName}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">{u.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
