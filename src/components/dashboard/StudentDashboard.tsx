import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase.ts';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Material, UserProfile } from '../../types/index.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, MessageSquare, FileText, BookMarked, HelpCircle, Loader2 } from 'lucide-react';
import AIChatDialog from '../ai/AIChatDialog.tsx';
import { motion } from 'motion/react';

interface Props {
  profile: UserProfile;
}

export default function StudentDashboard({ profile }: Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'materials'),
      where('status', '==', 'validated'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Material));
      setMaterials(docs);
      setLoading(false);
    });

    return unsub;
  }, []);

  const filteredMaterials = materials.filter(m => 
    m.title.toLowerCase().includes(search.toLowerCase()) || 
    m.facultyName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold">Hello, {profile.displayName.split(' ')[0]}</h2>
          <p className="text-muted-foreground">What would you like to learn today?</p>
        </div>
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search materials or faculty..." 
            className="pl-10 rounded-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Loading materials...</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredMaterials.length > 0 ? (
            filteredMaterials.map((material, idx) => (
              <motion.div
                key={material.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="flex h-full flex-col overflow-hidden transition-all hover:shadow-lg">
                  <CardHeader className="pb-2">
                    <div className="mb-2 flex items-center justify-between">
                      <Badge variant="secondary" className="capitalize">
                        {material.type.replace('_', ' ')}
                      </Badge>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <CardTitle className="line-clamp-2 text-xl font-bold leading-tight">{material.title}</CardTitle>
                    <CardDescription className="text-xs">Uploaded by Prof. {material.facultyName}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 pb-2">
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {material.content.substring(0, 150)}...
                    </p>
                  </CardContent>
                  <CardFooter className="pt-4 border-t gap-2">
                    <Button 
                      onClick={() => setSelectedMaterial(material)}
                      className="w-full gap-2"
                    >
                      <MessageSquare className="h-4 w-4" /> Ask AI
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <BookMarked className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium">No materials found</h3>
              <p className="text-muted-foreground text-sm">Wait for faculty to upload content or try a different search.</p>
            </div>
          )}
        </div>
      )}

      {selectedMaterial && (
        <AIChatDialog 
          material={selectedMaterial} 
          onClose={() => setSelectedMaterial(null)} 
        />
      )}
    </motion.div>
  );
}
