import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Users, Plus, MessageCircle, Loader2, ArrowLeft, 
  Send, UserPlus, LogOut, Crown, Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function StudyRooms() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newRoom, setNewRoom] = useState({ name: '', description: '', subject: '' });
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [roomMembers, setRoomMembers] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchRooms();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!selectedRoom) return;

    const channel = supabase
      .channel(`room-${selectedRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'study_room_messages',
          filter: `room_id=eq.${selectedRoom.id}`,
        },
        async (payload) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('user_id', payload.new.user_id)
            .single();
          
          setMessages(prev => [...prev, {
            ...payload.new,
            profiles: profile,
          }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedRoom]);

  const fetchRooms = async () => {
    try {
      const { data, error } = await supabase
        .from('study_rooms')
        .select(`
          *,
          study_room_members(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRooms(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoomMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('study_room_messages')
        .select(`
          *,
          profiles:user_id(full_name)
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchRoomMembers = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('study_room_members')
        .select(`
          *,
          profiles:user_id(full_name, avatar_url)
        `)
        .eq('room_id', roomId);

      if (error) throw error;
      setRoomMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const joinRoom = async (room: any) => {
    if (!user) return;
    
    try {
      // Check if already a member
      const { data: existing } = await supabase
        .from('study_room_members')
        .select('id')
        .eq('room_id', room.id)
        .eq('user_id', user.id)
        .single();

      if (!existing) {
        const { error } = await supabase
          .from('study_room_members')
          .insert({
            room_id: room.id,
            user_id: user.id,
            role: room.created_by === user.id ? 'admin' : 'member',
          });

        if (error) throw error;
      }

      setSelectedRoom(room);
      fetchRoomMessages(room.id);
      fetchRoomMembers(room.id);
    } catch (error) {
      console.error('Error joining room:', error);
      toast({
        title: "Failed to join room",
        variant: "destructive",
      });
    }
  };

  const leaveRoom = async () => {
    if (!selectedRoom || !user) return;
    
    try {
      await supabase
        .from('study_room_members')
        .delete()
        .eq('room_id', selectedRoom.id)
        .eq('user_id', user.id);

      setSelectedRoom(null);
      setMessages([]);
      fetchRooms();
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRoom || !user) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase
        .from('study_room_messages')
        .insert({
          room_id: selectedRoom.id,
          user_id: user.id,
          content: newMessage.trim(),
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const createRoom = async () => {
    if (!newRoom.name.trim() || !user) return;

    setCreatingRoom(true);
    try {
      const { data: room, error } = await supabase
        .from('study_rooms')
        .insert({
          name: newRoom.name.trim(),
          description: newRoom.description.trim(),
          subject: newRoom.subject.trim(),
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join as admin
      await supabase
        .from('study_room_members')
        .insert({
          room_id: room.id,
          user_id: user.id,
          role: 'admin',
        });

      toast({ title: "Study room created!" });
      setShowCreateDialog(false);
      setNewRoom({ name: '', description: '', subject: '' });
      fetchRooms();
    } catch (error) {
      console.error('Error creating room:', error);
      toast({
        title: "Failed to create room",
        variant: "destructive",
      });
    } finally {
      setCreatingRoom(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (selectedRoom) {
    return (
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setSelectedRoom(null)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <CardTitle>{selectedRoom.name}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  {roomMembers.length} members
                  {selectedRoom.subject && (
                    <>
                      <span>•</span>
                      <Badge variant="secondary">{selectedRoom.subject}</Badge>
                    </>
                  )}
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={leaveRoom}>
              <LogOut className="w-4 h-4 mr-1" />
              Leave
            </Button>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No messages yet. Start the discussion!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.user_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                      msg.user_id === user?.id
                        ? 'gradient-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {msg.user_id !== user?.id && (
                      <p className="text-xs font-medium mb-1 opacity-70">
                        {msg.profiles?.full_name || 'Unknown'}
                      </p>
                    )}
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <form onSubmit={sendMessage} className="p-4 border-t flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sendingMessage}
            className="flex-1"
          />
          <Button type="submit" disabled={sendingMessage || !newMessage.trim()}>
            {sendingMessage ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Study Rooms</h2>
          <p className="text-sm text-muted-foreground">
            Join or create study rooms to collaborate with peers
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Study Room</DialogTitle>
              <DialogDescription>
                Create a new room for group study sessions
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Input
                  placeholder="Room name"
                  value={newRoom.name}
                  onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                />
              </div>
              <div>
                <Input
                  placeholder="Subject (optional)"
                  value={newRoom.subject}
                  onChange={(e) => setNewRoom({ ...newRoom, subject: e.target.value })}
                />
              </div>
              <div>
                <Textarea
                  placeholder="Description (optional)"
                  value={newRoom.description}
                  onChange={(e) => setNewRoom({ ...newRoom, description: e.target.value })}
                  rows={3}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={createRoom}
                disabled={!newRoom.name.trim() || creatingRoom}
              >
                {creatingRoom ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Create Room
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {rooms.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">No study rooms yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Create the first room to start collaborating
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <Card 
              key={room.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => joinRoom(room)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {room.name}
                      {room.created_by === user?.id && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </CardTitle>
                    {room.subject && (
                      <Badge variant="secondary" className="mt-1">
                        {room.subject}
                      </Badge>
                    )}
                  </div>
                  <UserPlus className="w-5 h-5 text-primary" />
                </div>
                {room.description && (
                  <CardDescription className="line-clamp-2 mt-2">
                    {room.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {room.study_room_members?.[0]?.count || 0} members
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(room.created_at).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
