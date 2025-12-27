import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  User, BookOpen, Clock, Target, Plus, X, Save, 
  Sparkles, GraduationCap, Users, Calendar 
} from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  bio: string | null;
  subjects: string[];
  study_style: string | null;
  availability: string | null;
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

export default function Dashboard() {
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
          full_name: formData.full_name,
          bio: formData.bio,
          subjects: formData.subjects,
          study_style: formData.study_style,
          availability: formData.availability,
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
              <div className="animate-fade-up">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Welcome back,</p>
                    <h1 className="text-2xl font-bold text-foreground">
                      {profile?.full_name || user?.email?.split('@')[0] || 'Student'}
                    </h1>
                  </div>
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
                  Your Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center pb-4 border-b border-border">
                  <div className="w-24 h-24 rounded-full gradient-primary mx-auto mb-4 flex items-center justify-center">
                    <User className="w-12 h-12 text-primary-foreground" />
                  </div>
                  {editMode ? (
                    <Input
                      value={formData.full_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Your name"
                      className="text-center"
                    />
                  ) : (
                    <h3 className="text-xl font-bold text-foreground">
                      {profile?.full_name || 'Add your name'}
                    </h3>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground mb-2 block">Bio</Label>
                  {editMode ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell others about yourself..."
                      className="w-full min-h-[100px] rounded-lg border-2 border-border bg-card px-4 py-2 text-sm resize-none focus:border-primary focus:outline-none"
                    />
                  ) : (
                    <p className="text-sm text-foreground">
                      {profile?.bio || 'No bio added yet'}
                    </p>
                  )}
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
                        className="w-full min-h-[120px] rounded-lg border-2 border-border bg-card px-4 py-2 text-sm resize-none focus:border-primary focus:outline-none"
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

              {/* Quick Stats */}
              <Card variant="glass" className="animate-fade-up delay-400">
                <CardContent className="py-6">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-3xl font-bold text-gradient-primary">
                        {formData.subjects.length}
                      </div>
                      <p className="text-sm text-muted-foreground">Subjects</p>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-gradient-accent">
                        0
                      </div>
                      <p className="text-sm text-muted-foreground">Connections</p>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-foreground">
                        0
                      </div>
                      <p className="text-sm text-muted-foreground">Study Sessions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
