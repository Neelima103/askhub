import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase.ts';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Material, UserProfile } from '../../types/index.ts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, CheckCircle, Clock, FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { summarizeMaterial } from '../../lib/gemini.ts';

interface Props {
  profile: UserProfile;
}

export default function FacultyDashboard({ profile }: Props) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [open, setOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [type, setType] = useState<string>('subject_material');
  const [content, setContent] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'materials'),
      where('facultyId', '==', profile.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Material));
      setMaterials(docs);
      setLoading(false);
    });

    return unsub;
  }, [profile.uid]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return toast.error("Please fill all fields.");

    setIsUploading(true);
    try {
      const summary = await summarizeMaterial(content);
      
      await addDoc(collection(db, 'materials'), {
        title,
        type,
        content,
        description: summary,
        facultyId: profile.uid,
        facultyName: profile.displayName,
        status: 'pending', // Needs admin validation or just a step
        createdAt: new Date().toISOString(),
      });

      toast.success("Material uploaded and sent for validation!");
      setOpen(false);
      resetForm();
    } catch (err) {
      toast.error("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setType('subject_material');
    setContent('');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this material?")) return;
    try {
      await deleteDoc(doc(db, 'materials', id));
      toast.success("Material deleted.");
    } catch (err) {
      toast.error("Delete failed.");
    }
  };

  const toggleValidation = async (material: Material) => {
    try {
      await updateDoc(doc(db, 'materials', material.id), {
        status: material.status === 'validated' ? 'pending' : 'validated'
      });
      toast.success("Status updated!");
    } catch (err) {
      toast.error("Update failed.");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold">Faculty Portal</h2>
          <p className="text-muted-foreground">Manage your educational contributions.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button className="gap-2 rounded-full"><Plus className="h-4 w-4" /> Upload Material</Button>} />
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload New Content</DialogTitle>
              <DialogDescription>Add materials, research papers, or question papers for your students.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4 pt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input placeholder="e.g. Introduction to Quantum Computing" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Content Type</label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subject_material">Subject Material</SelectItem>
                    <SelectItem value="research_paper">Research Paper</SelectItem>
                    <SelectItem value="question_paper">Question Paper</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Content (Paste text)</label>
                <Textarea 
                  placeholder="Paste the educational content here for AI processing..." 
                  className="min-h-[200px]"
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isUploading}>
                {isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : <><FileUp className="mr-2 h-4 w-4" /> Publish Material</>}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : materials.length > 0 ? (
          materials.map((m) => (
            <Card key={m.id} className="group overflow-hidden transition-all hover:border-primary/50">
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant={m.status === 'validated' ? 'default' : 'secondary'} className="capitalize">
                      {m.status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {m.type.replace('_', ' ')}
                    </Badge>
                  </div>
                  <h3 className="mb-1 text-xl font-bold">{m.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {m.description || m.content.substring(0, 100)}
                  </p>
                </div>
                <div className="flex items-center gap-2 border-t bg-muted/30 px-6 py-4 md:border-l md:border-t-0">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-1"
                    onClick={() => toggleValidation(m)}
                  >
                    {m.status === 'validated' ? <Clock className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    {m.status === 'validated' ? 'Draft' : 'Validate'}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => handleDelete(m.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="rounded-2xl border-2 border-dashed p-20 text-center">
            <p className="text-muted-foreground">You haven't uploaded any materials yet.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
