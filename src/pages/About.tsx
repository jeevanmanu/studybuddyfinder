import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Target, Users, Lightbulb, Trophy, Globe } from 'lucide-react';

const values = [
  {
    icon: Heart,
    title: 'Community First',
    description: 'We believe learning thrives in supportive communities where students help each other succeed.',
  },
  {
    icon: Target,
    title: 'Goal-Oriented',
    description: 'Every feature is designed to help you achieve your academic goals more efficiently.',
  },
  {
    icon: Users,
    title: 'Inclusive Learning',
    description: 'We welcome students of all backgrounds, subjects, and learning styles.',
  },
  {
    icon: Lightbulb,
    title: 'Innovation',
    description: 'We continuously improve our platform based on student feedback and research.',
  },
];

const timeline = [
  {
    year: '2024',
    title: 'The Beginning',
    description: 'StudyBuddyFinder was founded by students who struggled to find compatible study partners.',
  },
  {
    year: '2024',
    title: 'First 1,000 Users',
    description: 'We reached our first milestone with students from over 50 universities joining the platform.',
  },
  {
    year: '2025',
    title: 'Growing Community',
    description: 'Expanded features including group study sessions, subject matching, and study analytics.',
  },
];

export default function About() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative py-24 gradient-hero overflow-hidden">
        <div className="absolute top-20 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 animate-fade-up">
              Our Mission
            </h1>
            <p className="text-xl text-muted-foreground animate-fade-up delay-100">
              We're on a mission to make studying more effective, enjoyable, and social. 
              Because nobody should have to learn alone.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What We Stand For
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our core values guide everything we do
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card 
                key={value.title} 
                variant="interactive"
                className="animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-accent-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">
                    {value.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Our Journey
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From a simple idea to a thriving community
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-1/2" />
              
              {timeline.map((item, index) => (
                <div 
                  key={index}
                  className={`relative flex items-start gap-6 mb-12 last:mb-0 animate-fade-up ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  {/* Dot */}
                  <div className="absolute left-4 md:left-1/2 w-3 h-3 rounded-full gradient-primary md:-translate-x-1/2 mt-2" />
                  
                  {/* Content */}
                  <div className={`ml-12 md:ml-0 md:w-1/2 ${index % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12'}`}>
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-2">
                      {item.year}
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card variant="elevated" className="text-center p-8 animate-fade-up">
              <Trophy className="w-12 h-12 text-accent mx-auto mb-4" />
              <div className="text-4xl font-bold text-foreground mb-2">95%</div>
              <p className="text-muted-foreground">of users improved their grades</p>
            </Card>
            <Card variant="elevated" className="text-center p-8 animate-fade-up delay-100">
              <Users className="w-12 h-12 text-primary mx-auto mb-4" />
              <div className="text-4xl font-bold text-foreground mb-2">10K+</div>
              <p className="text-muted-foreground">active study connections</p>
            </Card>
            <Card variant="elevated" className="text-center p-8 animate-fade-up delay-200">
              <Globe className="w-12 h-12 text-accent mx-auto mb-4" />
              <div className="text-4xl font-bold text-foreground mb-2">50+</div>
              <p className="text-muted-foreground">universities represented</p>
            </Card>
          </div>
        </div>
      </section>
    </Layout>
  );
}
