import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useFriendRequests } from '@/hooks/useFriendRequests';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Send, User, Loader2, ArrowLeft, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

interface Friend {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
}

export default function Messages() {
  const { user, loading: authLoading } = useAuth();
  const { friendId } = useParams<{ friendId?: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { friends, loading: friendsLoading } = useFriendRequests();
  
  const [friendProfiles, setFriendProfiles] = useState<Friend[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch friend profiles
  useEffect(() => {
    const fetchFriendProfiles = async () => {
      if (friends.length === 0) {
        setFriendProfiles([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', friends);

      if (!error && data) {
        setFriendProfiles(data);
      }
      setLoading(false);
    };

    if (!friendsLoading) {
      fetchFriendProfiles();
    }
  }, [friends, friendsLoading]);

  // Fetch messages for selected friend
  const fetchMessages = useCallback(async () => {
    if (!user || !friendId) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });

    if (!error) {
      setMessages(data || []);
      
      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', friendId)
        .eq('receiver_id', user.id)
        .eq('read', false);
    }
  }, [user, friendId]);

  useEffect(() => {
    if (friendId) {
      fetchMessages();
    }
  }, [friendId, fetchMessages]);

  // Subscribe to new messages
  useEffect(() => {
    if (!user || !friendId) return;

    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === user.id && newMsg.receiver_id === friendId) ||
            (newMsg.sender_id === friendId && newMsg.receiver_id === user.id)
          ) {
            setMessages(prev => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, friendId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !friendId || sending) return;

    setSending(true);
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id,
      receiver_id: friendId,
      content: newMessage.trim(),
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage('');
    }
    setSending(false);
  };

  const selectedFriend = friendProfiles.find(f => f.user_id === friendId);

  if (authLoading || loading || friendsLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout backgroundVariant="subtle">
      <div className="min-h-screen pt-20 pb-8">
        <div className="container mx-auto px-4 h-[calc(100vh-8rem)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
            {/* Friends List */}
            <Card className="md:col-span-1 flex flex-col">
              <CardHeader className="border-b border-border py-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  Chats
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-2">
                {friendProfiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <User className="w-12 h-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      No friends yet. Connect with study buddies to start chatting!
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => navigate('/find-buddies')}
                    >
                      Find Buddies
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {friendProfiles.map(friend => (
                      <button
                        key={friend.user_id}
                        onClick={() => navigate(`/messages/${friend.user_id}`)}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg transition-colors",
                          friendId === friend.user_id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted"
                        )}
                      >
                        <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                          {friend.avatar_url ? (
                            <img
                              src={friend.avatar_url}
                              alt={friend.full_name || 'User'}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-primary-foreground" />
                          )}
                        </div>
                        <span className="text-sm font-medium truncate">
                          {friend.full_name || 'Anonymous'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="md:col-span-2 flex flex-col">
              {friendId && selectedFriend ? (
                <>
                  <CardHeader className="border-b border-border py-3">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => navigate('/messages')}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                        {selectedFriend.avatar_url ? (
                          <img
                            src={selectedFriend.avatar_url}
                            alt={selectedFriend.full_name || 'User'}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-primary-foreground" />
                        )}
                      </div>
                      <CardTitle className="text-lg">
                        {selectedFriend.full_name || 'Anonymous'}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center">
                          <MessageCircle className="w-12 h-12 text-muted-foreground mb-3" />
                          <p className="text-muted-foreground">
                            No messages yet. Say hi to {selectedFriend.full_name || 'your buddy'}!
                          </p>
                        </div>
                      ) : (
                        messages.map(msg => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex",
                              msg.sender_id === user?.id ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[75%] px-4 py-2 rounded-2xl text-sm",
                                msg.sender_id === user?.id
                                  ? "gradient-primary text-primary-foreground"
                                  : "bg-muted"
                              )}
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t border-border">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendMessage();
                        }}
                        className="flex gap-3"
                      >
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          disabled={sending}
                          className="flex-1"
                        />
                        <Button type="submit" disabled={sending || !newMessage.trim()}>
                          {sending ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Send className="w-5 h-5" />
                          )}
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </>
              ) : (
                <CardContent className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-4">
                    <MessageCircle className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Your Messages</h3>
                  <p className="text-muted-foreground max-w-sm">
                    Select a friend from the list to start chatting
                  </p>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
