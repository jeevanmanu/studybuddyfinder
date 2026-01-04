import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Users, Mail, Lock, User, ArrowRight, Sparkles, Eye, EyeOff, Shield, BookOpen, Brain, Zap } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string()
  .trim()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be less than 255 characters');

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be less than 72 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const nameSchema = z.string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name must be less than 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ 
    email?: string; 
    password?: string; 
    confirmPassword?: string;
    name?: string 
  }>({});
  const [attemptCount, setAttemptCount] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null);
  
  const { signUp, signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    setIsSignUp(searchParams.get('mode') === 'signup');
  }, [searchParams]);

  const isLockedOut = lockoutUntil && new Date() < lockoutUntil;

  const validateForm = () => {
    const newErrors: { 
      email?: string; 
      password?: string; 
      confirmPassword?: string;
      name?: string 
    } = {};
    
    const trimmedEmail = email.trim().toLowerCase();
    const emailResult = emailSchema.safeParse(trimmedEmail);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }
    
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }
    
    if (isSignUp) {
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      
      const trimmedName = fullName.trim();
      const nameResult = nameSchema.safeParse(trimmedName);
      if (!nameResult.success) {
        newErrors.name = nameResult.error.errors[0].message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLockedOut) {
      const remainingTime = Math.ceil((lockoutUntil!.getTime() - Date.now()) / 1000 / 60);
      toast({
        title: 'Too many attempts',
        description: `Please try again in ${remainingTime} minute(s).`,
        variant: 'destructive',
      });
      return;
    }
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = fullName.trim();
      
      if (isSignUp) {
        const { error } = await signUp(trimmedEmail, password, trimmedName);
        if (error) {
          const errorMessage = error.message.toLowerCase();
          
          if (errorMessage.includes('already registered') || 
              errorMessage.includes('user already exists') ||
              errorMessage.includes('email already')) {
            toast({
              title: 'Email already registered',
              description: 'This email is already in use. Please sign in or use a different email.',
              variant: 'destructive',
            });
          } else if (errorMessage.includes('password')) {
            toast({
              title: 'Weak password',
              description: 'Please choose a stronger password.',
              variant: 'destructive',
            });
          } else if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
            setLockoutUntil(new Date(Date.now() + 5 * 60 * 1000));
            toast({
              title: 'Too many attempts',
              description: 'Please wait 5 minutes before trying again.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Account created successfully!',
            description: 'Please sign in with your credentials.',
          });
          // Reset form and switch to sign in
          setPassword('');
          setConfirmPassword('');
          setIsSignUp(false);
        }
      } else {
        const { error } = await signIn(trimmedEmail, password);
        if (error) {
          const newAttemptCount = attemptCount + 1;
          setAttemptCount(newAttemptCount);
          
          if (newAttemptCount >= 5) {
            setLockoutUntil(new Date(Date.now() + 15 * 60 * 1000));
            toast({
              title: 'Account temporarily locked',
              description: 'Too many failed attempts. Please try again in 15 minutes.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign in failed',
              description: `Invalid email or password. ${5 - newAttemptCount} attempts remaining.`,
              variant: 'destructive',
            });
          }
        } else {
          setAttemptCount(0);
          navigate('/dashboard');
        }
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    if (!password) return { strength: 0, label: '' };
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['bg-destructive', 'bg-destructive', 'bg-accent', 'bg-primary', 'bg-green-500'];
    
    return { 
      strength, 
      label: labels[strength - 1] || '', 
      color: colors[strength - 1] || 'bg-muted'
    };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute inset-0 overflow-hidden">
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/15 rounded-full blur-3xl animate-float delay-200" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-accent/5 rounded-full blur-3xl" />
        
        {/* Grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
      </div>

      {/* Left side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Gradient overlay */}
        <div className="absolute inset-0 gradient-primary opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-primary/20 to-accent/30" />
        
        {/* Decorative elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse-soft delay-300" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-primary-foreground/10 rounded-full animate-spin" style={{ animationDuration: '30s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-primary-foreground/5 rounded-full animate-spin" style={{ animationDuration: '25s', animationDirection: 'reverse' }} />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center text-center p-12 w-full">
          <div className="w-24 h-24 rounded-3xl bg-primary-foreground/20 backdrop-blur-sm flex items-center justify-center mb-8 animate-float shadow-glow">
            <Users className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold text-primary-foreground mb-6 animate-fade-up">
            StudyBuddyFinder
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-md mb-12 animate-fade-up delay-100">
            Join thousands of students finding their perfect study partners and achieving their academic goals together.
          </p>
          
          {/* Features */}
          <div className="space-y-4 animate-fade-up delay-200">
            <div className="flex items-center gap-3 text-primary-foreground/90">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <span>Find study partners by subject</span>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/90">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <span>AI-powered learning assistance</span>
            </div>
            <div className="flex items-center gap-3 text-primary-foreground/90">
              <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <span>Real-time messaging & collaboration</span>
            </div>
          </div>
          
          {/* Security badge */}
          <div className="mt-12 flex items-center gap-2 px-6 py-3 rounded-full bg-primary-foreground/10 backdrop-blur-sm animate-fade-up delay-300">
            <Shield className="w-5 h-5 text-primary-foreground" />
            <span className="text-sm text-primary-foreground/90 font-medium">256-bit SSL Encrypted</span>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-10">
        <div className="w-full max-w-md animate-scale-in">
          {/* Mobile logo */}
          <Link to="/" className="lg:hidden flex items-center gap-3 text-xl font-bold text-foreground mb-8 justify-center animate-fade-up">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <span>StudyBuddyFinder</span>
          </Link>

          <Card variant="elevated" className="border-0 shadow-medium backdrop-blur-sm bg-card/95">
            <CardHeader className="text-center pb-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mx-auto mb-4 animate-fade-up">
                <Sparkles className="w-4 h-4" />
                <span>{isSignUp ? 'Create Account' : 'Welcome Back'}</span>
              </div>
              <CardTitle className="text-2xl animate-fade-up delay-100">
                {isSignUp ? 'Get Started' : 'Sign In'}
              </CardTitle>
              <CardDescription className="animate-fade-up delay-200">
                {isSignUp 
                  ? 'Create your account to find study buddies'
                  : 'Sign in to continue your learning journey'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-2 animate-fade-up">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="pl-10"
                        maxLength={100}
                        autoComplete="name"
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>
                )}
                
                <div className="space-y-2 animate-fade-up delay-100">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      maxLength={255}
                      autoComplete="email"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2 animate-fade-up delay-200">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      maxLength={72}
                      autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                  
                  {isSignUp && password && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                              level <= passwordStrength.strength 
                                ? passwordStrength.color 
                                : 'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      {passwordStrength.label && (
                        <p className="text-xs text-muted-foreground">
                          Password strength: <span className="font-medium">{passwordStrength.label}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                {isSignUp && (
                  <div className="space-y-2 animate-fade-up delay-300">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10"
                        maxLength={72}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full animate-fade-up delay-400" 
                  size="lg"
                  disabled={loading || isLockedOut}
                >
                  {loading ? (
                    <span className="animate-pulse">Please wait...</span>
                  ) : isLockedOut ? (
                    <span>Temporarily locked</span>
                  ) : (
                    <>
                      {isSignUp ? 'Create Account' : 'Sign In'}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              
              <div className="mt-6 text-center animate-fade-up delay-500">
                <p className="text-sm text-muted-foreground">
                  {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setErrors({});
                      setPassword('');
                      setConfirmPassword('');
                    }}
                    className="text-primary font-medium hover:underline transition-colors"
                  >
                    {isSignUp ? 'Sign In' : 'Sign Up'}
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
          
          {/* Back to home link */}
          <div className="mt-6 text-center animate-fade-up delay-500">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
