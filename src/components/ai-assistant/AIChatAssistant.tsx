import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, BookOpen, Brain, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const suggestedQuestions = [
  { icon: BookOpen, text: "Explain photosynthesis in simple terms" },
  { icon: Brain, text: "How can I improve my memory for studying?" },
  { icon: HelpCircle, text: "What are the key concepts in calculus?" },
];

export function AIChatAssistant() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const streamChat = async (userMessages: Message[]) => {
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

    // Get the current session token for authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Please log in to use the AI assistant");
    }

    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Required by the functions gateway
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        // User JWT
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!resp.ok) {
      const error = await resp.json();
      throw new Error(error.error || "Failed to get response");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages(prev => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = { role: 'assistant', content: assistantContent };
              return newMessages;
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = { role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      await streamChat(newMessages);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get response",
        variant: "destructive",
      });
      setMessages(prev => prev.filter((_, i) => i !== prev.length - 1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mb-6">
              <Bot className="w-10 h-10 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Ask Me Anything!</h2>
            <p className="text-muted-foreground mb-8 max-w-md">
              I'm your AI study assistant. Ask about any topic, and I'll provide clear, 
              exam-focused explanations and study tips.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-2xl">
              {suggestedQuestions.map((q, index) => (
                <button
                  key={index}
                  onClick={() => handleSend(q.text)}
                  className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors text-left group"
                >
                  <q.icon className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm text-foreground">{q.text}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'gradient-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.role === 'user' ? (
                  <p className="text-sm whitespace-pre-wrap">{message.content || '...'}</p>
                ) : (
                  <div className="text-sm prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2">
                    <ReactMarkdown>{message.content || '...'}</ReactMarkdown>
                  </div>
                )}
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-accent-foreground" />
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="pt-4 border-t border-border mt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-3"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about your studies..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="gradient-primary">
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
