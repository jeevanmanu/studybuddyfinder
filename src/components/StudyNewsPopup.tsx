import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Newspaper, BookOpen, Video, FileText, ExternalLink, 
  Clock, TrendingUp, Star, ChevronRight, ChevronLeft, Sparkles, Loader2, ArrowUpRight
} from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  content?: string;
  category: 'news' | 'material' | 'video' | 'article';
  source: string;
  url: string;
  imageUrl?: string;
  timestamp: string;
  trending?: boolean;
  featured?: boolean;
  author?: string;
}

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
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [savedItems, setSavedItems] = useState<string[]>(() => {
    const saved = localStorage.getItem('studybuddy-saved-news');
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch real study-related news from NewsAPI via a CORS proxy or public education feeds
  useEffect(() => {
    if (open && newsItems.length === 0) {
      fetchStudyNews();
    }
  }, [open]);

  const fetchStudyNews = async () => {
    setLoading(true);
    try {
      // Using the DEV.to API for education/study related articles (free, no API key needed)
      const response = await fetch('https://dev.to/api/articles?tag=education&per_page=20');
      const data = await response.json();
      
      const mappedNews: NewsItem[] = data.map((article: any, index: number) => ({
        id: article.id.toString(),
        title: article.title,
        description: article.description || 'Click to read more about this educational article.',
        content: article.description,
        category: index % 4 === 0 ? 'news' : index % 4 === 1 ? 'article' : index % 4 === 2 ? 'material' : 'video',
        source: article.user?.name || 'DEV Community',
        url: article.url,
        imageUrl: article.cover_image || article.social_image,
        timestamp: new Date(article.published_at).toLocaleDateString(),
        trending: article.positive_reactions_count > 50,
        featured: index === 0,
        author: article.user?.name,
      }));

      // Also fetch from a study tips RSS feed proxy
      try {
        const studyTipsResponse = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.edutopia.org/rss.xml');
        const studyTipsData = await studyTipsResponse.json();
        
        if (studyTipsData.items) {
          const studyTipsNews: NewsItem[] = studyTipsData.items.slice(0, 10).map((item: any, index: number) => ({
            id: `edutopia-${index}`,
            title: item.title,
            description: item.description?.replace(/<[^>]*>/g, '').slice(0, 200) || 'Educational resource from Edutopia.',
            content: item.description?.replace(/<[^>]*>/g, ''),
            category: 'article' as const,
            source: 'Edutopia',
            url: item.link,
            imageUrl: item.enclosure?.link || item.thumbnail,
            timestamp: new Date(item.pubDate).toLocaleDateString(),
            trending: index < 3,
            featured: false,
            author: item.author,
          }));
          
          mappedNews.push(...studyTipsNews);
        }
      } catch (e) {
        console.log('RSS feed unavailable, using primary source');
      }

      setNewsItems(mappedNews);
    } catch (error) {
      console.error('Error fetching news:', error);
      // Fallback to mock data if API fails
      setNewsItems([
        {
          id: '1',
          title: 'New AI-Powered Learning Techniques for 2025',
          description: 'Discover how artificial intelligence is revolutionizing the way students learn and retain information.',
          content: 'Artificial intelligence is transforming education in unprecedented ways. From personalized learning paths to intelligent tutoring systems, AI is helping students learn more effectively than ever before. Studies show that AI-assisted learning can improve retention rates by up to 40% and reduce study time by 25%. This comprehensive guide explores the latest AI tools and techniques that students can use to enhance their learning experience.',
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
          content: 'Master calculus with this comprehensive study guide. Starting from the fundamentals of limits and continuity, progressing through derivatives and integrals, this guide covers everything you need to know. Each concept is explained with clear examples and practice problems.',
          category: 'material',
          source: 'StudyHub',
          url: '#',
          timestamp: '1 day ago',
        },
        {
          id: '3',
          title: 'Physics Explained: Quantum Mechanics Basics',
          description: 'Video series breaking down complex quantum physics concepts into digestible lessons.',
          content: 'This video series demystifies quantum mechanics for beginners. Learn about wave-particle duality, the uncertainty principle, and quantum entanglement through easy-to-understand animations and real-world examples.',
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
          content: 'Memory is crucial for exam success. This article explores proven techniques like spaced repetition, the memory palace method, and active recall. Learn how to structure your study sessions for maximum retention.',
          category: 'article',
          source: 'Learning Science',
          url: '#',
          timestamp: '5 hours ago',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleSaveItem = (itemId: string) => {
    const newSaved = savedItems.includes(itemId)
      ? savedItems.filter(id => id !== itemId)
      : [...savedItems, itemId];
    setSavedItems(newSaved);
    localStorage.setItem('studybuddy-saved-news', JSON.stringify(newSaved));
  };

  const filteredItems = selectedCategory === 'all' 
    ? newsItems 
    : newsItems.filter(item => item.category === selectedCategory);

  const featuredItem = newsItems.find(item => item.featured);
  const trendingItems = newsItems.filter(item => item.trending);
  const savedNewsItems = newsItems.filter(item => savedItems.includes(item.id));

  // Detail View
  if (selectedNews) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header with back button */}
            <div className="px-6 pt-6 pb-4 border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedNews(null)}
                className="mb-4 gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to News
              </Button>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getCategoryColor(selectedNews.category)}`}>
                  {getCategoryIcon(selectedNews.category)}
                </div>
                <div className="flex-1">
                  <Badge variant="outline" className="mb-2 capitalize">
                    {selectedNews.category}
                  </Badge>
                  <h2 className="text-xl font-bold text-foreground">
                    {selectedNews.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                    <span>{selectedNews.source}</span>
                    <span>•</span>
                    <span>{selectedNews.timestamp}</span>
                    {selectedNews.author && (
                      <>
                        <span>•</span>
                        <span>By {selectedNews.author}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 px-6 py-6">
              {selectedNews.imageUrl && (
                <img
                  src={selectedNews.imageUrl}
                  alt={selectedNews.title}
                  className="w-full h-64 object-cover rounded-xl mb-6"
                />
              )}
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground leading-relaxed text-base">
                  {selectedNews.content || selectedNews.description}
                </p>
                <p className="text-muted-foreground mt-4">
                  This article provides valuable insights for students looking to enhance their learning experience. 
                  For the full content and additional resources, visit the original source.
                </p>
              </div>
            </ScrollArea>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSaveItem(selectedNews.id)}
                className="gap-2"
              >
                <Star className={`w-4 h-4 ${savedItems.includes(selectedNews.id) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                {savedItems.includes(selectedNews.id) ? 'Saved' : 'Save for Later'}
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => window.open(selectedNews.url, '_blank')}
              >
                Read Full Article
                <ArrowUpRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
              <TabsTrigger value="saved" className="flex-1">
                Saved {savedNewsItems.length > 0 && `(${savedNewsItems.length})`}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="feed" className="m-0">
            {loading ? (
              <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Featured Section */}
                {featuredItem && (
                  <div className="px-6 py-4">
                    <div 
                      className="relative overflow-hidden rounded-xl gradient-primary p-6 text-primary-foreground cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => setSelectedNews(featuredItem)}
                    >
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
                        <p className="text-primary-foreground/80 line-clamp-2">{featuredItem.description}</p>
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
                        onClick={() => setSelectedNews(item)}
                        className="group p-4 rounded-xl border border-border bg-card hover:shadow-medium transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-4">
                          {item.imageUrl ? (
                            <img 
                              src={item.imageUrl} 
                              alt={item.title}
                              className="w-16 h-16 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <div className={`p-2 rounded-lg ${getCategoryColor(item.category)}`}>
                              {getCategoryIcon(item.category)}
                            </div>
                          )}
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
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSaveItem(item.id);
                              }}
                            >
                              <Star className={`w-4 h-4 ${savedItems.includes(item.id) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                            </Button>
                            <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </TabsContent>

          <TabsContent value="trending" className="m-0">
            {loading ? (
              <div className="flex items-center justify-center h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <ScrollArea className="h-[500px] px-6 py-4">
                <div className="space-y-3">
                  {trendingItems.map((item, index) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedNews(item)}
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
            )}
          </TabsContent>

          <TabsContent value="saved" className="m-0">
            {savedNewsItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center px-6">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No saved items yet</h3>
                <p className="text-muted-foreground max-w-sm">
                  Save articles, videos, and study materials to access them later from here.
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[500px] px-6 py-4">
                <div className="space-y-3">
                  {savedNewsItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedNews(item)}
                      className="group p-4 rounded-xl border border-border bg-card hover:shadow-medium transition-all cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg ${getCategoryColor(item.category)}`}>
                          {getCategoryIcon(item.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {item.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>{item.source}</span>
                            <span>•</span>
                            <span>{item.timestamp}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSaveItem(item.id);
                          }}
                        >
                          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
