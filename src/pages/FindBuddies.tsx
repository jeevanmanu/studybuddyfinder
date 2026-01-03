import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FriendRequestButton } from '@/components/FriendRequestButton';
import { Search, User, BookOpen, Clock, Sparkles, Loader2, Users } from 'lucide-react';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  bio: string | null;
  subjects: string[] | null;
  study_style: string | null;
  availability: string | null;
  avatar_url: string | null;
}

export default function FindBuddies() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchProfiles();
    }
  }, [user]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('user_id', user?.id);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique subjects from profiles
  const allSubjects = [...new Set(profiles.flatMap(p => p.subjects || []))];

  // Filter profiles based on search and subject
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = !searchQuery || 
      profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.bio?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.subjects?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSubject = !selectedSubject || 
      profile.subjects?.includes(selectedSubject);

    return matchesSearch && matchesSubject;
  });

  if (authLoading || loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout backgroundVariant="hero">
      <div className="min-h-screen pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Users className="w-4 h-4" />
              <span>Find Your Perfect Match</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Discover Study Buddies
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Connect with students who share your interests and learning goals
            </p>
          </div>

          {/* Search and Filters */}
          <div className="mb-8 space-y-4">
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, subject, or bio..."
                className="pl-10"
              />
            </div>

            {allSubjects.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  variant={selectedSubject === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSubject(null)}
                >
                  All
                </Button>
                {allSubjects.slice(0, 8).map(subject => (
                  <Button
                    key={subject}
                    variant={selectedSubject === subject ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedSubject(subject)}
                  >
                    {subject}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Results */}
          {filteredProfiles.length === 0 ? (
            <Card className="max-w-md mx-auto">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No buddies found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || selectedSubject 
                    ? "Try adjusting your search or filters"
                    : "Be the first to complete your profile and invite friends!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => (
                <Card key={profile.id} variant="interactive" className="animate-fade-up">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                        {profile.avatar_url ? (
                          <img 
                            src={profile.avatar_url} 
                            alt={profile.full_name || 'User'} 
                            className="w-full h-full rounded-xl object-cover"
                          />
                        ) : (
                          <User className="w-7 h-7 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {profile.full_name || 'Anonymous Student'}
                        </CardTitle>
                        {profile.study_style && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Sparkles className="w-3 h-3" />
                            {profile.study_style}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {profile.bio}
                      </p>
                    )}

                    {profile.subjects && profile.subjects.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                          <BookOpen className="w-3 h-3" />
                          Subjects
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {profile.subjects.slice(0, 4).map(subject => (
                            <Badge key={subject} variant="secondary" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                          {profile.subjects.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{profile.subjects.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {profile.availability && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{profile.availability}</span>
                      </div>
                    )}

                    <FriendRequestButton userId={profile.user_id} className="w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
