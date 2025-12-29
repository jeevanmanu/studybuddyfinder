import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Newspaper, BookOpen, Video, FileText, ExternalLink, 
  Clock, TrendingUp, Star, ChevronRight, X, Sparkles
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  category: 'news' | 'material' | 'video' | 'article';
  source: string;
  url: string;
  timestamp: string;
  trending?: boolean;
  featured?: boolean;
}

// Mock data for study news and materials
const mockNewsItems: NewsItem[] = [
  {
    id: '1',
    title: 'New AI-Powered Learning Techniques for 2025',
    description: 'Discover how artificial intelligence is revolutionizing the way students learn and retain information.',
    category: 'news',
    source: 'Education Weekly',
    url: '#',
    timestamp: '2 hours ago',
    trending: true,
    featured: true,
  },
  {
    id: '2',
    title: 'Complete Mathematics Study Guide - Calculus Edition',
    description: 'Comprehensive guide covering all calculus concepts from limits to differential equations.',
    category: 'material',
    source: 'StudyHub',
    url: '#',
    timestamp: '1 day ago',
  },
  {
    id: '3',
    title: 'Physics Explained: Quantum Mechanics Basics',
    description: 'Video series breaking down complex quantum physics concepts into digestible lessons.',
    category: 'video',
    source: 'Science Channel',
    url: '#',
    timestamp: '3 hours ago',
    trending: true,
  },
  {
    id: '4',
    title: 'How to Improve Your Memory for Exams',
    description: 'Research-backed techniques to enhance memory retention and recall during tests.',
    category: 'article',
    source: 'Learning Science',
    url: '#',
    timestamp: '5 hours ago',
  },
  {
    id: '5',
    title: 'Free Online Courses from Top Universities',
    description: 'Access thousands of free courses from Harvard, MIT, Stanford and more.',
    category: 'material',
    source: 'EDX',
    url: '#',
    timestamp: '1 day ago',
    featured: true,
  },
  {
    id: '6',
    title: 'Study Group Success Stories',
    description: 'How students are achieving better grades through collaborative learning.',
    category: 'news',
    source: 'Student Times',
    url: '#',
    timestamp: '6 hours ago',
  },
  {
    id: '7',
    title: 'Chemistry Lab Virtual Simulations',
    description: 'Practice chemistry experiments safely with interactive virtual lab simulations.',
    category: 'video',
    source: 'ChemLab Virtual',
    url: '#',
    timestamp: '2 days ago',
  },
  {
    id: '8',
    title: 'The Science of Effective Note-Taking',
    description: 'Learn the Cornell method and other proven note-taking strategies.',
    category: 'article',
    source: 'Academic Success',
    url: '#',
    timestamp: '12 hours ago',
    trending: true,
  },
];

interface StudyNewsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getCategoryIcon = (category: NewsItem['category']) => {
  switch (category) {
    case 'news':
      return <Newspaper className="w-4 h-4" />;
    case 'material':
      return <BookOpen className="w-4 h-4" />;
    case 'video':
      return <Video className="w-4 h-4" />;
    case 'article':
      return <FileText className="w-4 h-4" />;
  }
};

const getCategoryColor = (category: NewsItem['category']) => {
  switch (category) {
    case 'news':
      return 'bg-blue-500/10 text-blue-500';
    case 'material':
      return 'bg-green-500/10 text-green-500';
    case 'video':
      return 'bg-red-500/10 text-red-500';
    case 'article':
      return 'bg-purple-500/10 text-purple-500';
  }
};

export function StudyNewsPopup({ open, onOpenChange }: StudyNewsPopupProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newsItems, setNewsItems] = useState<NewsItem[]>(mockNewsItems);

  const filteredItems = selectedCategory === 'all' 
    ? newsItems 
    : newsItems.filter(item => item.category === selectedCategory);

  const featuredItem = newsItems.find(item => item.featured);
  const trendingItems = newsItems.filter(item => item.trending);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl">Study News & Materials</DialogTitle>
                <DialogDescription>
                  Stay updated with the latest study resources and educational news
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="feed" className="w-full">
          <div className="px-6 pt-4">
            <TabsList className="w-full">
              <TabsTrigger value="feed" className="flex-1">Feed</TabsTrigger>
              <TabsTrigger value="trending" className="flex-1">Trending</TabsTrigger>
              <TabsTrigger value="saved" className="flex-1">Saved</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="feed" className="m-0">
            {/* Featured Section */}
            {featuredItem && (
              <div className="px-6 py-4">
                <div className="relative overflow-hidden rounded-xl gradient-primary p-6 text-primary-foreground">
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/20 text-white hover:bg-white/30">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary-foreground/70 text-sm">
                      <Clock className="w-4 h-4" />
                      {featuredItem.timestamp}
                      <span>•</span>
                      {featuredItem.source}
                    </div>
                    <h3 className="text-xl font-bold">{featuredItem.title}</h3>
                    <p className="text-primary-foreground/80">{featuredItem.description}</p>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="mt-2 bg-white/20 hover:bg-white/30 text-white border-0"
                    >
                      Read More
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Category Filter */}
            <div className="px-6 py-2">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['all', 'news', 'material', 'video', 'article'].map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize shrink-0"
                  >
                    {category === 'all' ? 'All' : category}
                  </Button>
                ))}
              </div>
            </div>

            {/* News List */}
            <ScrollArea className="h-[400px] px-6 pb-6">
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="group p-4 rounded-xl border border-border bg-card hover:shadow-medium transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${getCategoryColor(item.category)}`}>
                        {getCategoryIcon(item.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {item.trending && (
                            <Badge variant="secondary" className="text-xs">
                              <TrendingUp className="w-3 h-3 mr-1" />
                              Trending
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {item.timestamp} • {item.source}
                          </span>
                        </div>
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {item.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="trending" className="m-0">
            <ScrollArea className="h-[500px] px-6 py-4">
              <div className="space-y-3">
                {trendingItems.map((item, index) => (
                  <div
                    key={item.id}
                    className="group p-4 rounded-xl border border-border bg-card hover:shadow-medium transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full gradient-accent flex items-center justify-center text-primary-foreground font-bold shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getCategoryColor(item.category)}>
                            {getCategoryIcon(item.category)}
                            <span className="ml-1 capitalize">{item.category}</span>
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {item.timestamp}
                          </span>
                        </div>
                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="saved" className="m-0">
            <div className="flex flex-col items-center justify-center h-[400px] text-center px-6">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No saved items yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Save articles, videos, and study materials to access them later from here.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}