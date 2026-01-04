import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/ThemeProvider';
import { 
  User, BookOpen, Clock, Target, X, Save, 
  Sparkles, GraduationCap, Calendar, Mail, Shield,
  Camera, CheckCircle, LogOut, Users, Palette, Layout as LayoutIcon,
  Bell, Eye, Moon, Sun, Monitor, Loader2, Plus
} from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  bio: string | null;
  subjects: string[];
  study_style: string | null;
  availability: string | null;
  avatar_url: string | null;
}

// Helper to parse study_style which can now be multiple values stored as comma-separated string
const parseStudyStyles = (style: string | null): string[] => {
  if (!style) return [];
  return style.split(',').map(s => s.trim()).filter(Boolean);
};

const formatStudyStyles = (styles: string[]): string => {
  return styles.join(', ');
};

const subjectOptions = [
  'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
  'English', 'History', 'Economics', 'Psychology', 'Philosophy',
  'Art', 'Music', 'Business', 'Law', 'Medicine'
];

const studyStyles = [
  'Visual Learner',
  'Auditory Learner',
  'Reading/Writing',
  'Kinesthetic',
  'Group Study',
  'Solo Study'
];

export default function Dashboard() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [friendCount, setFriendCount] = useState(0);
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Customization preferences (stored in localStorage)
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('studybuddy-preferences');
    return saved ? JSON.parse(saved) : {
      compactLayout: false,
      showAnimations: true,
      emailNotifications: true,
      pushNotifications: false,
      studyReminders: true,
      showOnlineStatus: true,
      profileVisibility: 'public',
    };
  });
  
const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    subjects: [] as string[],
    study_styles: [] as string[],
    availability: '',
  });
  
  const [customSubject, setCustomSubject] = useState('');
  const [customStyle, setCustomStyle] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchFriendCount();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          bio: data.bio || '',
          subjects: data.subjects || [],
          study_styles: parseStudyStyles(data.study_style),
          availability: data.availability || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriendCount = async () => {
    try {
      const { count } = await supabase
        .from('friend_requests')
        .select('*', { count: 'exact', head: true })
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .eq('status', 'accepted');
      
      setFriendCount(count || 0);
    } catch (error) {
      console.error('Error fetching friend count:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          bio: formData.bio.trim(),
          subjects: formData.subjects,
          study_style: formatStudyStyles(formData.study_styles),
          availability: formData.availability.trim(),
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved successfully.',
      });
      
      setEditMode(false);
      fetchProfile();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

const toggleSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const addCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (trimmed && !formData.subjects.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        subjects: [...prev.subjects, trimmed]
      }));
      setCustomSubject('');
    }
  };

  const toggleStudyStyle = (style: string) => {
    setFormData(prev => ({
      ...prev,
      study_styles: prev.study_styles.includes(style)
        ? prev.study_styles.filter(s => s !== style)
        : [...prev.study_styles, style]
    }));
  };

  const addCustomStyle = () => {
    const trimmed = customStyle.trim();
    if (trimmed && !formData.study_styles.includes(trimmed)) {
      setFormData(prev => ({
        ...prev,
        study_styles: [...prev.study_styles, trimmed]
      }));
      setCustomStyle('');
    }
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

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
    toast({
      title: 'Preference updated',
      description: 'Your settings have been saved.',
    });
  };

  if (authLoading || loading) {
    return (
      <Layout showFooter={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false}>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="gradient-hero border-b border-border">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4 animate-fade-up">
                <div className="relative">
                  <Avatar className="w-20 h-20 border-4 border-background shadow-medium">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="gradient-primary text-primary-foreground text-2xl font-bold">
                      {getInitials(profile?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  {editMode && (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-medium hover:scale-110 transition-transform disabled:opacity-50"
                    >
                      {uploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {profile?.full_name || 'Complete Your Profile'}
                  </h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {user?.email}
                  </p>
                  {profile?.full_name && (
                    <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Verified Account</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 animate-fade-up delay-100">
                {editMode ? (
                  <>
                    <Button variant="outline" onClick={() => setEditMode(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setEditMode(true)}>
                      Edit Profile
                    </Button>
                    <Button variant="outline" onClick={handleSignOut} className="gap-2">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content with Tabs */}
        <div className="container mx-auto px-4 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-3 mx-auto">
              <TabsTrigger value="profile" className="gap-2">
                <User className="w-4 h-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="preferences" className="gap-2">
                <Palette className="w-4 h-4" />
                Customize
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <Card variant="elevated" className="lg:col-span-1 animate-fade-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" />
                  About Me
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Full Name</Label>
                  {editMode ? (
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Your full name"
                      maxLength={100}
                    />
                  ) : (
                    <p className="text-foreground font-medium">
                      {profile?.full_name || 'Not set'}
                    </p>
                  )}
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Bio</Label>
                  {editMode ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell others about yourself..."
                      className="w-full min-h-[120px] rounded-lg border-2 border-input bg-background px-4 py-2 text-sm resize-none focus:border-primary focus:outline-none transition-colors"
                      maxLength={500}
                    />
                  ) : (
                    <p className="text-sm text-foreground">
                      {profile?.bio || 'No bio added yet'}
                    </p>
                  )}
                </div>

                {/* Account Security */}
                <div className="pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Shield className="w-4 h-4" />
                    <span className="font-medium">Account Security</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email verified</span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Password set</span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="pt-4 border-t border-border">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-primary/5">
                      <div className="text-2xl font-bold text-gradient-primary">
                        {formData.subjects.length}
                      </div>
                      <p className="text-xs text-muted-foreground">Subjects</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/5">
                      <div className="text-2xl font-bold text-gradient-accent flex items-center justify-center gap-1">
                        <Users className="w-5 h-5" />
                        {friendCount}
                      </div>
                      <p className="text-xs text-muted-foreground">Connections</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Study Details */}
            <div className="lg:col-span-2 space-y-8">
              {/* Subjects */}
              <Card variant="elevated" className="animate-fade-up delay-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    Study Subjects
                  </CardTitle>
                  <CardDescription>
                    Select the subjects you're studying or want to find partners for
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {/* Preset subjects */}
                    {subjectOptions.map((subject) => {
                      const isSelected = formData.subjects.includes(subject);
                      return (
                        <Badge
                          key={subject}
                          variant={isSelected ? 'default' : 'outline'}
                          className={`cursor-pointer transition-all duration-200 ${
                            editMode ? 'hover:scale-105' : ''
                          } ${isSelected ? 'gradient-primary text-primary-foreground' : ''}`}
                          onClick={() => editMode && toggleSubject(subject)}
                        >
                          {subject}
                          {isSelected && editMode && <X className="w-3 h-3 ml-1" />}
                        </Badge>
                      );
                    })}
                    {/* Custom subjects (not in preset list) */}
                    {formData.subjects
                      .filter(s => !subjectOptions.includes(s))
                      .map((subject) => (
                        <Badge
                          key={subject}
                          variant="default"
                          className={`cursor-pointer transition-all duration-200 gradient-primary text-primary-foreground ${
                            editMode ? 'hover:scale-105' : ''
                          }`}
                          onClick={() => editMode && toggleSubject(subject)}
                        >
                          {subject}
                          {editMode && <X className="w-3 h-3 ml-1" />}
                        </Badge>
                      ))}
                  </div>
                  
                  {/* Add custom subject */}
                  {editMode && (
                    <div className="flex gap-2">
                      <Input
                        value={customSubject}
                        onChange={(e) => setCustomSubject(e.target.value)}
                        placeholder="Add custom subject..."
                        maxLength={50}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomSubject();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={addCustomSubject}
                        disabled={!customSubject.trim()}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Study Style & Availability */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card variant="elevated" className="animate-fade-up delay-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-accent" />
                      Learning Style
                    </CardTitle>
                    <CardDescription>
                      Select all that apply
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {editMode ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          {studyStyles.map((style) => {
                            const isSelected = formData.study_styles.includes(style);
                            return (
                              <label
                                key={style}
                                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                  isSelected
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:border-primary/50'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleStudyStyle(style)}
                                  className="sr-only"
                                />
                                <div className={`w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
                                  isSelected
                                    ? 'border-primary bg-primary'
                                    : 'border-muted-foreground'
                                }`}>
                                  {isSelected && (
                                    <CheckCircle className="w-3 h-3 text-primary-foreground" />
                                  )}
                                </div>
                                <span className="text-sm font-medium">{style}</span>
                              </label>
                            );
                          })}
                          {/* Custom styles */}
                          {formData.study_styles
                            .filter(s => !studyStyles.includes(s))
                            .map((style) => (
                              <label
                                key={style}
                                className="flex items-center gap-3 p-3 rounded-lg border-2 border-primary bg-primary/5 cursor-pointer transition-all duration-200"
                              >
                                <input
                                  type="checkbox"
                                  checked={true}
                                  onChange={() => toggleStudyStyle(style)}
                                  className="sr-only"
                                />
                                <div className="w-5 h-5 rounded border-2 border-primary bg-primary transition-colors flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-primary-foreground" />
                                </div>
                                <span className="text-sm font-medium">{style}</span>
                                <X className="w-4 h-4 ml-auto text-muted-foreground hover:text-destructive" />
                              </label>
                            ))}
                        </div>
                        
                        {/* Add custom learning style */}
                        <div className="flex gap-2">
                          <Input
                            value={customStyle}
                            onChange={(e) => setCustomStyle(e.target.value)}
                            placeholder="Add custom style..."
                            maxLength={50}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomStyle();
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={addCustomStyle}
                            disabled={!customStyle.trim()}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-accent" />
                        </div>
                        <span className="font-medium text-foreground">
                          {profile?.study_style || 'Not specified'}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card variant="elevated" className="animate-fade-up delay-300">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Availability
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {editMode ? (
                      <textarea
                        value={formData.availability}
                        onChange={(e) => setFormData(prev => ({ ...prev, availability: e.target.value }))}
                        placeholder="e.g., Weekday evenings, Weekend mornings..."
                        className="w-full min-h-[120px] rounded-lg border-2 border-input bg-background px-4 py-2 text-sm resize-none focus:border-primary focus:outline-none transition-colors"
                        maxLength={200}
                      />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Clock className="w-5 h-5 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">
                          {profile?.availability || 'Not specified'}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
            </TabsContent>

            {/* Customize Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Theme Settings */}
                <Card variant="elevated" className="animate-fade-up">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5 text-primary" />
                      Theme Settings
                    </CardTitle>
                    <CardDescription>Customize the look and feel of your experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-sm font-medium">Color Theme</Label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setTheme('light')}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 hover:scale-105 ${
                            theme === 'light' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Sun className="w-6 h-6 text-amber-500" />
                          <span className="text-sm font-medium">Light</span>
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 hover:scale-105 ${
                            theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Moon className="w-6 h-6 text-indigo-500" />
                          <span className="text-sm font-medium">Dark</span>
                        </button>
                        <button
                          onClick={() => setTheme('system')}
                          className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-2 hover:scale-105 ${
                            theme === 'system' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Monitor className="w-6 h-6 text-muted-foreground" />
                          <span className="text-sm font-medium">System</span>
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Layout Settings */}
                <Card variant="elevated" className="animate-fade-up delay-100">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LayoutIcon className="w-5 h-5 text-accent" />
                      Layout & Display
                    </CardTitle>
                    <CardDescription>Adjust how content is displayed</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Compact Layout</Label>
                        <p className="text-xs text-muted-foreground">Show more content in less space</p>
                      </div>
                      <Switch
                        checked={preferences.compactLayout}
                        onCheckedChange={(checked) => updatePreference('compactLayout', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Show Animations</Label>
                        <p className="text-xs text-muted-foreground">Enable smooth transitions and effects</p>
                      </div>
                      <Switch
                        checked={preferences.showAnimations}
                        onCheckedChange={(checked) => updatePreference('showAnimations', checked)}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Privacy Settings */}
                <Card variant="elevated" className="animate-fade-up delay-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5 text-primary" />
                      Privacy Settings
                    </CardTitle>
                    <CardDescription>Control your visibility and data</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">Show Online Status</Label>
                        <p className="text-xs text-muted-foreground">Let others see when you're online</p>
                      </div>
                      <Switch
                        checked={preferences.showOnlineStatus}
                        onCheckedChange={(checked) => updatePreference('showOnlineStatus', checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Profile Visibility</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => updatePreference('profileVisibility', 'public')}
                          className={`p-3 rounded-lg text-sm font-medium transition-all ${
                            preferences.profileVisibility === 'public' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          Public
                        </button>
                        <button
                          onClick={() => updatePreference('profileVisibility', 'friends')}
                          className={`p-3 rounded-lg text-sm font-medium transition-all ${
                            preferences.profileVisibility === 'friends' 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted hover:bg-muted/80'
                          }`}
                        >
                          Friends Only
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications" className="space-y-6">
              <Card variant="elevated" className="animate-fade-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-primary" />
                    Notification Preferences
                  </CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Email Notifications</Label>
                      <p className="text-xs text-muted-foreground">Receive updates and alerts via email</p>
                    </div>
                    <Switch
                      checked={preferences.emailNotifications}
                      onCheckedChange={(checked) => updatePreference('emailNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Push Notifications</Label>
                      <p className="text-xs text-muted-foreground">Get instant notifications in your browser</p>
                    </div>
                    <Switch
                      checked={preferences.pushNotifications}
                      onCheckedChange={(checked) => updatePreference('pushNotifications', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Study Reminders</Label>
                      <p className="text-xs text-muted-foreground">Get reminded about scheduled study sessions</p>
                    </div>
                    <Switch
                      checked={preferences.studyReminders}
                      onCheckedChange={(checked) => updatePreference('studyReminders', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
