import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  User, BookOpen, Clock, Target, X, Save, 
  Sparkles, GraduationCap, Calendar, Mail, Shield,
  Camera, CheckCircle
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

export default function Profile() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
    subjects: [] as string[],
    study_style: '',
    availability: '',
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

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          bio: data.bio || '',
          subjects: data.subjects || [],
          study_style: data.study_style || '',
          availability: data.availability || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
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
          study_style: formData.study_style,
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

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
                    <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-medium">
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
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
                    <Button onClick={handleSave} disabled={saving}>
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setEditMode(true)}>
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
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
                      className="w-full min-h-[120px] rounded-lg border-2 border-input bg-background px-4 py-2 text-sm resize-none focus:border-primary focus:outline-none"
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
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {subjectOptions.map((subject) => {
                      const isSelected = formData.subjects.includes(subject);
                      return (
                        <Badge
                          key={subject}
                          variant={isSelected ? 'default' : 'outline'}
                          className={`cursor-pointer transition-all ${
                            editMode ? 'hover:scale-105' : ''
                          } ${isSelected ? 'gradient-primary text-primary-foreground' : ''}`}
                          onClick={() => editMode && toggleSubject(subject)}
                        >
                          {subject}
                          {isSelected && editMode && <X className="w-3 h-3 ml-1" />}
                        </Badge>
                      );
                    })}
                  </div>
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
                  </CardHeader>
                  <CardContent>
                    {editMode ? (
                      <div className="space-y-2">
                        {studyStyles.map((style) => (
                          <label
                            key={style}
                            className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              formData.study_style === style
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="study_style"
                              value={style}
                              checked={formData.study_style === style}
                              onChange={(e) => setFormData(prev => ({ ...prev, study_style: e.target.value }))}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              formData.study_style === style
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground'
                            }`}>
                              {formData.study_style === style && (
                                <div className="w-full h-full flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                                </div>
                              )}
                            </div>
                            <span className="text-sm font-medium">{style}</span>
                          </label>
                        ))}
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
                        className="w-full min-h-[120px] rounded-lg border-2 border-input bg-background px-4 py-2 text-sm resize-none focus:border-primary focus:outline-none"
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

              {/* Danger Zone */}
              <Card variant="elevated" className="border-destructive/20 animate-fade-up delay-400">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible actions for your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      signOut();
                      navigate('/');
                    }}
                  >
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}