import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Users, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface StudyRoom {
  id: string;
  name: string;
  subject: string | null;
}

interface Message {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface Member {
  user_id: string;
  role: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

interface StudyRoomChatProps {
  room: StudyRoom;
  userId: string;
  onBack: () => void;
}

export function StudyRoomChat({ room, userId, onBack }: StudyRoomChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    fetchMembers();

    // Subscribe to new messages
    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'study_room_messages',
          filter: `room_id=eq.${room.id}`
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          
          // Fetch the profile for the new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('user_id', newMsg.user_id)
            .single();

          setMessages((prev) => [...prev, { ...newMsg, profile: profile || undefined }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('study_room_messages')
        .select('*')
        .eq('room_id', room.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Fetch profiles for messages
      const userIds = [...new Set((data || []).map((m) => m.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));
      
      const messagesWithProfiles = (data || []).map((msg) => ({
        ...msg,
        profile: profileMap.get(msg.user_id)
      }));

      setMessages(messagesWithProfiles);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('study_room_members')
        .select('user_id, role')
        .eq('room_id', room.id);

      if (error) throw error;

      const userIds = (data || []).map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));
      
      const membersWithProfiles = (data || []).map((member) => ({
        ...member,
        profile: profileMap.get(member.user_id)
      }));

      setMembers(membersWithProfiles);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('study_room_messages')
        .insert({
          room_id: room.id,
          user_id: userId,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h3 className="font-semibold">{room.name}</h3>
          {room.subject && (
            <span className="text-xs text-muted-foreground">{room.subject}</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{members.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 min-h-0">
        {/* Chat Area */}
        <Card className="md:col-span-3 flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No messages yet</p>
                  <p className="text-sm">Start the discussion!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.user_id === userId ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={msg.profile?.avatar_url || ''} />
                        <AvatarFallback>
                          {(msg.profile?.full_name || 'U').charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`max-w-[70%] ${msg.user_id === userId ? 'text-right' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium">
                            {msg.profile?.full_name || 'Anonymous'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <div
                          className={`rounded-2xl px-4 py-2 inline-block ${
                            msg.user_id === userId
                              ? 'gradient-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={sending}
                />
                <Button type="submit" disabled={!newMessage.trim() || sending}>
                  {sending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Members Sidebar */}
        <Card className="hidden md:block">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.user_id} className="flex items-center gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.profile?.avatar_url || ''} />
                    <AvatarFallback>
                      {(member.profile?.full_name || 'U').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {member.profile?.full_name || 'Anonymous'}
                    </p>
                    <span className={`text-xs ${
                      member.role === 'admin' ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
