import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/components/ThemeProvider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  User, Camera, ChevronRight, Moon, Sun, Monitor, Bell, 
  Lock, Shield, Eye, EyeOff, Palette, LogOut, Mail, 
  Smartphone, Globe, HelpCircle, FileText, Trash2, Loader2,
  Check, X
} from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function Settings() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');
  
  // Preferences stored in localStorage
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('studybuddy-preferences');
    return saved ? JSON.parse(saved) : {
      emailNotifications: true,
      pushNotifications: false,
      studyReminders: true,
      messageAlerts: true,
      showOnlineStatus: true,
      profileVisibility: 'public',
      twoFactorEnabled: false,
      loginAlerts: true,
    };
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Error', description: 'Please select an image file', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast({ title: 'Success', description: 'Profile picture updated!' });
    } catch (error) {
      console.error('Upload error:', error);
      toast({ title: 'Error', description: 'Failed to upload image', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const updatePreference = (key: string, value: any) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    localStorage.setItem('studybuddy-preferences', JSON.stringify(newPrefs));
    toast({ title: 'Preference updated' });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (authLoading || loading) {
    return (
      <Layout showFooter={false}>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const menuItems = [
    { id: 'profile', icon: User, label: 'Profile', description: 'Photo, name, and bio' },
    { id: 'account', icon: Lock, label: 'Account', description: 'Email and password' },
    { id: 'privacy', icon: Eye, label: 'Privacy', description: 'Who can see your info' },
    { id: 'appearance', icon: Palette, label: 'Appearance', description: 'Theme and display' },
    { id: 'notifications', icon: Bell, label: 'Notifications', description: 'Messages and alerts' },
    { id: 'security', icon: Shield, label: 'Security', description: 'Login and protection' },
  ];

  const renderSection = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex flex-col items-center py-6">
              <div className="relative group">
                <Avatar className="w-28 h-28 border-4 border-background shadow-medium">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="gradient-primary text-primary-foreground text-3xl font-bold">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-medium hover:scale-110 transition-transform disabled:opacity-50"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-3">Tap to change photo</p>
            </div>

            <div className="space-y-4">
              <SettingRow
                icon={User}
                label="Name"
                value={profile?.full_name || 'Not set'}
                onClick={() => navigate('/dashboard')}
              />
              <SettingRow
                icon={FileText}
                label="Bio"
                value={profile?.bio ? profile.bio.slice(0, 30) + '...' : 'Add a bio'}
                onClick={() => navigate('/dashboard')}
              />
              <SettingRow
                icon={Mail}
                label="Email"
                value={user?.email || 'Not set'}
              />
            </div>
          </div>
        );

      case 'account':
        return (
          <div className="space-y-4">
            <SettingRow
              icon={Mail}
              label="Email address"
              value={user?.email || 'Not set'}
            />
            <SettingRow
              icon={Lock}
              label="Change password"
              value="Update your password"
              onClick={() => toast({ title: 'Password reset email sent', description: 'Check your inbox' })}
            />
            <Separator />
            <SettingRow
              icon={Trash2}
              label="Delete account"
              value="Permanently delete your account"
              danger
              onClick={() => toast({ title: 'Contact support', description: 'Please contact support to delete your account' })}
            />
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-4">
            <SettingToggle
              icon={Eye}
              label="Show online status"
              description="Let others see when you're online"
              checked={preferences.showOnlineStatus}
              onCheckedChange={(v) => updatePreference('showOnlineStatus', v)}
            />
            <SettingToggle
              icon={Globe}
              label="Public profile"
              description="Anyone can find and view your profile"
              checked={preferences.profileVisibility === 'public'}
              onCheckedChange={(v) => updatePreference('profileVisibility', v ? 'public' : 'private')}
            />
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">Choose how StudyBuddy looks on your device</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'system', icon: Monitor, label: 'System' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value as any)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    theme === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <option.icon className={`w-6 h-6 mx-auto mb-2 ${theme === option.value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className={`text-sm font-medium ${theme === option.value ? 'text-primary' : 'text-muted-foreground'}`}>
                    {option.label}
                  </p>
                </button>
              ))}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-4">
            <SettingToggle
              icon={Mail}
              label="Email notifications"
              description="Receive updates via email"
              checked={preferences.emailNotifications}
              onCheckedChange={(v) => updatePreference('emailNotifications', v)}
            />
            <SettingToggle
              icon={Smartphone}
              label="Push notifications"
              description="Get notified on your device"
              checked={preferences.pushNotifications}
              onCheckedChange={(v) => updatePreference('pushNotifications', v)}
            />
            <SettingToggle
              icon={Bell}
              label="Study reminders"
              description="Daily study session reminders"
              checked={preferences.studyReminders}
              onCheckedChange={(v) => updatePreference('studyReminders', v)}
            />
            <SettingToggle
              icon={User}
              label="Message alerts"
              description="Notify when you receive messages"
              checked={preferences.messageAlerts}
              onCheckedChange={(v) => updatePreference('messageAlerts', v)}
            />
          </div>
        );

      case 'security':
        return (
          <div className="space-y-4">
            <SettingToggle
              icon={Shield}
              label="Two-factor authentication"
              description="Add an extra layer of security"
              checked={preferences.twoFactorEnabled}
              onCheckedChange={(v) => updatePreference('twoFactorEnabled', v)}
            />
            <SettingToggle
              icon={Bell}
              label="Login alerts"
              description="Get notified of new logins"
              checked={preferences.loginAlerts}
              onCheckedChange={(v) => updatePreference('loginAlerts', v)}
            />
            <Separator />
            <SettingRow
              icon={Lock}
              label="Active sessions"
              value="Manage your logged in devices"
              onClick={() => toast({ title: 'Coming soon', description: 'This feature is under development' })}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-screen pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sidebar Menu */}
            <Card className="md:col-span-1 h-fit animate-fade-up">
              <CardContent className="p-2">
                <div className="space-y-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        activeSection === item.id
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <div className="text-left flex-1">
                        <p className="font-medium text-sm">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                  <Separator className="my-2" />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-destructive hover:bg-destructive/10 transition-all"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium text-sm">Sign out</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Content Area */}
            <Card className="md:col-span-2 animate-fade-up delay-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {menuItems.find(m => m.id === activeSection)?.icon && (
                    <span className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                      {(() => {
                        const Icon = menuItems.find(m => m.id === activeSection)?.icon;
                        return Icon ? <Icon className="w-4 h-4 text-primary-foreground" /> : null;
                      })()}
                    </span>
                  )}
                  {menuItems.find(m => m.id === activeSection)?.label}
                </CardTitle>
                <CardDescription>
                  {menuItems.find(m => m.id === activeSection)?.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderSection()}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Helper Components
function SettingRow({ 
  icon: Icon, 
  label, 
  value, 
  onClick, 
  danger 
}: { 
  icon: any; 
  label: string; 
  value: string; 
  onClick?: () => void; 
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border border-border transition-all ${
        onClick ? 'hover:bg-muted cursor-pointer' : 'cursor-default'
      } ${danger ? 'text-destructive' : ''}`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${danger ? 'bg-destructive/10' : 'bg-muted'}`}>
        <Icon className={`w-5 h-5 ${danger ? 'text-destructive' : 'text-muted-foreground'}`} />
      </div>
      <div className="flex-1 text-left">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground truncate">{value}</p>
      </div>
      {onClick && <ChevronRight className="w-5 h-5 text-muted-foreground" />}
    </button>
  );
}

function SettingToggle({ 
  icon: Icon, 
  label, 
  description, 
  checked, 
  onCheckedChange 
}: { 
  icon: any; 
  label: string; 
  description: string; 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border">
      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="font-medium">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
