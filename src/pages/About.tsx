import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Target, Users, Lightbulb, Trophy, Globe, GraduationCap, BookOpen, Brain, MessageCircle, Shield, Clock, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

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
    title: 'AI Assistant Launch',
    description: 'Introduced our AI-powered study assistant to help students learn more effectively.',
  },
  {
    year: '2025',
    title: 'Growing Community',
    description: 'Expanded features including group study sessions, subject matching, and study analytics.',
  },
];

const team = [
  {
    name: 'Alex Chen',
    role: 'Founder & CEO',
    description: 'Former CS student who struggled to find study partners. Built StudyBuddyFinder to solve this.',
  },
  {
    name: 'Maya Patel',
    role: 'Head of Product',
    description: 'Passionate about EdTech. Leads the team in creating student-centered features.',
  },
  {
    name: 'Jordan Smith',
    role: 'AI Lead',
    description: 'Machine learning expert focused on making AI accessible for education.',
  },
];

const features = [
  {
    icon: Brain,
    title: 'AI Study Assistant',
    description: 'Get instant explanations, study materials, and help with any topic 24/7.',
  },
  {
    icon: Users,
    title: 'Smart Matching',
    description: 'Find students who match your subjects, schedule, and learning style.',
  },
  {
    icon: MessageCircle,
    title: 'Collaboration Tools',
    description: 'Chat, share notes, and study together in real-time.',
  },
  {
    icon: Shield,
    title: 'Safe Environment',
    description: 'Verified profiles and moderated community for focused learning.',
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Set your availability and find buddies who can study when you can.',
  },
  {
    icon: BookOpen,
    title: 'Subject Tracking',
    description: 'Track your subjects and get matched with relevant study groups.',
  },
];

export default function About() {
  return (
    <Layout backgroundVariant="hero">
      {/* Hero Section */}
      <section className="relative py-24 gradient-hero overflow-hidden">
        <div className="absolute top-20 right-10 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-60 h-60 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-up">
              <Sparkles className="w-4 h-4" />
              <span>About Us</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-6 animate-fade-up delay-100">
              Our Mission
            </h1>
            <p className="text-xl text-muted-foreground animate-fade-up delay-200">
              We're on a mission to make studying more effective, enjoyable, and social. 
              Because nobody should have to learn alone.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-up">
                <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
                <p className="text-muted-foreground mb-4">
                  StudyBuddyFinder was born from a simple frustration: finding compatible study partners is hard. 
                  Traditional methods like asking classmates or posting on message boards often lead to mismatched 
                  schedules, different learning styles, or simply not finding anyone at all.
                </p>
                <p className="text-muted-foreground mb-4">
                  Our founders, themselves students at the time, experienced this firsthand. They knew there had 
                  to be a better way to connect students who could truly help each other succeed.
                </p>
                <p className="text-muted-foreground">
                  Today, StudyBuddyFinder has grown into a thriving community of students helping students, 
                  powered by smart matching algorithms and AI assistance to make every study session count.
                </p>
              </div>
              <div className="animate-fade-up delay-200">
                <Card variant="elevated" className="p-8">
                  <div className="grid grid-cols-2 gap-6 text-center">
                    <div>
                      <div className="text-4xl font-bold text-gradient-primary mb-2">10K+</div>
                      <p className="text-sm text-muted-foreground">Active Students</p>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-gradient-primary mb-2">50+</div>
                      <p className="text-sm text-muted-foreground">Universities</p>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-gradient-primary mb-2">95%</div>
                      <p className="text-sm text-muted-foreground">Success Rate</p>
                    </div>
                    <div>
                      <div className="text-4xl font-bold text-gradient-primary mb-2">24/7</div>
                      <p className="text-sm text-muted-foreground">AI Support</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 bg-muted/30">
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

      {/* Features Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What We Offer
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to succeed in your studies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                className="animate-fade-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-6 flex gap-4">
                  <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
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

      {/* Team Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Meet the Team
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The people behind StudyBuddyFinder
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {team.map((member, index) => (
              <Card 
                key={member.name}
                variant="interactive" 
                className="text-center animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8">
                  <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
                    <GraduationCap className="w-10 h-10 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{member.name}</h3>
                  <p className="text-sm text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-muted-foreground">{member.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-muted/30">
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

      {/* CTA Section */}
      <section className="py-24 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Start your journey to better studying today. It's free!
          </p>
          <Button size="lg" variant="glass" asChild>
            <Link to="/auth?mode=signup">
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
