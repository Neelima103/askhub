import React, { useEffect, useState } from 'react';
import { auth, db } from './lib/firebase.ts';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { UserProfile, UserRole } from './types/index.ts';
import { Button } from '@/components/ui/button';
import { Toaster, toast } from 'sonner';
import { LogIn, LogOut, Loader2, BookOpen, UserCircle, ShieldCheck, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Dashboard Components (to be created)
import StudentDashboard from './components/dashboard/StudentDashboard.tsx';
import FacultyDashboard from './components/dashboard/FacultyDashboard.tsx';
import AdminDashboard from './components/dashboard/AdminDashboard.tsx';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
          setNeedsOnboarding(false);
        } else {
          setNeedsOnboarding(true);
        }
      } else {
        setProfile(null);
        setNeedsOnboarding(false);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      toast.success("Signed in successfully!");
    } catch (err) {
      toast.error("Failed to sign in. Please try again.");
    }
  };

  const handleSignOut = () => signOut(auth);

  const handleOnboard = async (role: UserRole) => {
    if (!user) return;
    try {
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Anonymous User',
        photoURL: user.photoURL || '',
        role,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setProfile(newProfile);
      setNeedsOnboarding(false);
      toast.success(`Welcome to AskHub, ${role}!`);
    } catch (err) {
      toast.error("Setup failed. Contact support.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#f5f5f0] p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-8 flex justify-center">
            <div className="rounded-2xl bg-primary p-4 shadow-xl">
              <BookOpen className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="mb-2 font-serif text-5xl font-bold tracking-tight text-[#1a1a1a]">AskHub</h1>
          <p className="mb-8 text-muted-foreground">Your collective knowledge hub for academic excellence.</p>
          
          <Button 
            size="lg" 
            onClick={handleSignIn}
            className="w-full gap-2 rounded-full py-6 text-lg shadow-lg transition-transform hover:scale-[1.02]"
          >
            <LogIn className="h-5 w-5" /> Sign in with Google
          </Button>
        </motion.div>
        <Toaster position="bottom-right" />
      </div>
    );
  }

  if (needsOnboarding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f0] p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <Card className="rounded-3xl border-none shadow-2xl">
            <CardHeader className="text-center pb-2">
              <CardTitle className="font-serif text-3xl">Complete Your Profile</CardTitle>
              <CardDescription>Select your role to get started with AskHub.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 p-8 md:grid-cols-3">
              {[
                { role: 'student', icon: GraduationCap, label: 'Student', desc: 'Access materials and ask AI for help.' },
                { role: 'faculty', icon: UserCircle, label: 'Faculty', desc: 'Upload materials and manage content.' },
                { role: 'admin', icon: ShieldCheck, label: 'Admin', desc: 'Full access to manage the platform.' }
              ].map((item) => (
                <button
                  key={item.role}
                  onClick={() => handleOnboard(item.role as UserRole)}
                  className="group flex flex-col items-center justify-center rounded-2xl border-2 border-transparent bg-muted/30 p-6 transition-all hover:border-primary hover:bg-white hover:shadow-xl"
                >
                  <item.icon className="mb-4 h-12 w-12 text-muted-foreground transition-colors group-hover:text-primary" />
                  <span className="font-bold text-lg">{item.label}</span>
                  <p className="mt-2 text-center text-xs text-muted-foreground">{item.desc}</p>
                </button>
              ))}
            </CardContent>
          </Card>
        </motion.div>
        <Toaster position="bottom-right" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary p-1.5">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <span className="font-serif text-2xl font-bold tracking-tight">AskHub</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Dev Role Switcher */}
            <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-3 py-1 text-[10px] font-bold text-yellow-800">
              DEV: 
              <button onClick={() => handleOnboard('student')} className="hover:underline">STU</button>
              <button onClick={() => handleOnboard('faculty')} className="hover:underline">FAC</button>
              <button onClick={() => handleOnboard('admin')} className="hover:underline">ADM</button>
            </div>

            <div className="hidden text-right md:block">
              <p className="text-sm font-medium leading-none">{profile?.displayName}</p>
              <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sign Out">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <AnimatePresence mode="wait">
          {profile?.role === 'student' && <StudentDashboard key="student" profile={profile} />}
          {profile?.role === 'faculty' && <FacultyDashboard key="faculty" profile={profile} />}
          {profile?.role === 'admin' && <AdminDashboard key="admin" profile={profile} />}
        </AnimatePresence>
      </main>
      
      <Toaster position="bottom-right" />
    </div>
  );
}
