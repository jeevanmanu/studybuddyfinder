import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, BookOpen, Target, MessageCircle, Search, Sparkles, ArrowRight, Brain, Clock, Shield, Star, Zap, GraduationCap, CheckCircle2 } from 'lucide-react';

const features = [
  {
    icon: Search,
    title: 'Find Your Match',
    description: 'Discover students who share your subjects, learning style, and academic goals.',
  },
  {
    icon: MessageCircle,
    title: 'Connect & Collaborate',
    description: 'Message potential study buddies and form groups for projects and exams.',
  },
  {
    icon: Target,
    title: 'Achieve Together',
    description: 'Stay motivated with accountability partners and reach your goals faster.',
  },
];

const stats = [
  { value: '10K+', label: 'Active Students' },
  { value: '500+', label: 'Study Groups' },
  { value: '95%', label: 'Success Rate' },
];

const benefits = [
  {
    icon: Brain,
    title: 'AI Study Assistant',
    description: 'Get instant help with any topic. Our AI explains concepts, provides study materials, and clears your doubts 24/7.',
  },
  {
    icon: Users,
    title: 'Smart Matching',
    description: 'Our algorithm matches you with students who complement your learning style and study schedule.',
  },
  {
    icon: Clock,
    title: 'Flexible Scheduling',
    description: 'Set your availability and find buddies who can study when you can. No more scheduling conflicts.',
  },
  {
    icon: Shield,
    title: 'Safe Community',
    description: 'Verified student profiles and moderated interactions ensure a safe, focused learning environment.',
  },
];

const testimonials = [
  {
    name: 'Sarah M.',
    subject: 'Computer Science',
    text: "Found my perfect study group through StudyBuddyFinder. We went from struggling with algorithms to acing our finals!",
    rating: 5,
  },
  {
    name: 'James K.',
    subject: 'Biology',
    text: "The AI assistant is incredible. It helped me understand complex concepts that I'd been stuck on for weeks.",
    rating: 5,
  },
  {
    name: 'Priya R.',
    subject: 'Mathematics',
    text: "I love how easy it is to find students studying the same topics. Study sessions are so much more productive now.",
    rating: 5,
  },
];

const howItWorks = [
  {
    step: 1,
    title: 'Create Your Profile',
    description: 'Sign up and tell us about your subjects, learning style, and availability.',
  },
  {
    step: 2,
    title: 'Find Study Buddies',
    description: 'Browse profiles and connect with students who match your learning goals.',
  },
  {
    step: 3,
    title: 'Study Smarter',
    description: 'Use our AI assistant and collaborate with your buddies to achieve success.',
  },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden gradient-hero">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-soft delay-300" />
        
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-up">
              <Sparkles className="w-4 h-4" />
              <span>The smarter way to study</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-foreground mb-6 animate-fade-up delay-100">
              Find Your Perfect{' '}
              <span className="text-gradient-primary">Study Buddy</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up delay-200">
              Connect with like-minded students, get AI-powered study help, and achieve your academic goals together. Learning is better with friends.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
              <Button size="lg" variant="hero" asChild>
                <Link to="/auth?mode=signup">
                  Start Finding Buddies
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/about">Learn More</Link>
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 animate-fade-up delay-400">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Free to join</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>AI-powered</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Verified students</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="text-center animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="text-4xl md:text-5xl font-bold text-gradient-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to transform your study experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {howItWorks.map((item, index) => (
              <div 
                key={item.step} 
                className="relative animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-border" />
                )}
                <Card variant="interactive">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary-foreground">
                      {item.step}
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">
                      {item.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {item.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              <span>Powerful Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Why Choose StudyBuddyFinder?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to succeed in your studies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <Card 
                key={benefit.title} 
                variant="elevated"
                className="animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8 flex gap-6">
                  <div className="w-14 h-14 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-7 h-7 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {benefit.description}
                    </p>
                  </div>
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
              Core Features
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built for students, by students
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                variant="interactive"
                className="animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-card border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Star className="w-4 h-4" />
              <span>Student Stories</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              What Students Say
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied students
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={testimonial.name} 
                className="animate-fade-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                    ))}
                  </div>
                  <p className="text-foreground mb-6 italic">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.subject}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 gradient-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to Find Your Study Buddy?
          </h2>
          <p className="text-lg text-primary-foreground/80 max-w-2xl mx-auto mb-8">
            Join thousands of students who are already learning better together. It's free to get started!
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="glass" asChild>
              <Link to="/auth?mode=signup">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/about">
                Learn More
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
