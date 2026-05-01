import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Material } from '../../types/index.ts';
import { askAI } from '../../lib/gemini.ts';
import { Send, Bot, User, Loader2, Sparkles, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  material: Material;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatDialog({ material, onClose }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: `Hi! I've read through "**${material.title}**". I'm ready to help you understand it. What would you like to know?` 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      // Pass the entire material content as context for RAG shim
      const response = await askAI(userMsg, material.content);
      setMessages(prev => [...prev, { role: 'assistant', content: response || "I'm sorry, I couldn't generate an answer." }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex h-[80vh] max-w-3xl flex-col p-0 overflow-hidden rounded-3xl">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Study Assistant</DialogTitle>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  <span>Referencing: {material.title.substring(0, 30)}...</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <section className="flex-1 overflow-hidden bg-muted/5 p-0">
          <ScrollArea className="h-full px-6 py-6">
            <div className="space-y-6">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    {msg.role === 'assistant' ? (
                      <AvatarImage src="/bot-avatar.png" />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground">U</AvatarFallback>
                    )}
                    <AvatarFallback className={msg.role === 'assistant' ? 'bg-zinc-800' : 'bg-primary'}>
                      {msg.role === 'assistant' ? <Bot className="h-4 w-4 text-white" /> : <User className="h-4 w-4 text-white" />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex max-w-[80%] flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-primary text-primary-foreground rounded-tr-none' 
                        : 'bg-white border rounded-tl-none'
                    }`}>
                      <div className="markdown-body prose-sm prose-invert">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex gap-4">
                  <Avatar className="h-8 w-8 animate-pulse bg-muted" />
                  <div className="rounded-2xl bg-white border px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        </section>

        <footer className="border-t bg-white p-4">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2"
          >
            <Input 
              placeholder="Ask anything about the material..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 rounded-full bg-muted/30 border-none shadow-none focus-visible:ring-1"
              autoFocus
            />
            <Button 
              type="submit" 
              size="icon" 
              className="rounded-full shrink-0" 
              disabled={!input.trim() || loading}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
