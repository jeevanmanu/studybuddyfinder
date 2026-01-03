import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { FriendRequestsDropdown } from '@/components/FriendRequestsDropdown';
import { StudyNewsPopup } from '@/components/StudyNewsPopup';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Menu, X, Users, Brain, Search, MessageCircle, Newspaper, 
  User, MoreHorizontal, Settings, LogOut, LayoutDashboard 
} from 'lucide-react';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showNewsPopup, setShowNewsPopup] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Main navigation links (always visible)
  const mainNavLinks = [
    { href: '/', label: 'Home' },
    { href: '/about', label: 'About' },
  ];

  // Auth-required main links
  const authMainLinks = [
    { href: '/ai-assistant', label: 'AI Assistant', icon: Brain },
    { href: '/find-buddies', label: 'Find Buddies', icon: Search },
  ];

  // Options menu links (accessible through dropdown)
  const optionsMenuLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/messages', label: 'Messages', icon: MessageCircle },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-soft">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors group"
          >
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow group-hover:scale-105 transition-transform">
              <Users className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="hidden sm:inline">StudyBuddyFinder</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-all duration-200 relative py-1 hover:scale-105 ${
                  isActive(link.href)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary rounded-full animate-scale-in" />
                )}
              </Link>
            ))}
            
            {user && authMainLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-all duration-200 relative py-1 flex items-center gap-1.5 hover:scale-105 ${
                  isActive(link.href)
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 gradient-primary rounded-full animate-scale-in" />
                )}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle />
            
            {user ? (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowNewsPopup(true)}
                  className="hover:scale-105 transition-transform"
                >
                  <Newspaper className="w-5 h-5" />
                </Button>
                
                <FriendRequestsDropdown />
                
                {/* Options Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:scale-105 transition-transform">
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 animate-scale-in">
                    {optionsMenuLinks.map((link) => (
                      <DropdownMenuItem key={link.href} asChild>
                        <Link to={link.href} className="flex items-center gap-2 cursor-pointer">
                          <link.icon className="w-4 h-4" />
                          {link.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/dashboard')} className="flex items-center gap-2 cursor-pointer">
                      <Settings className="w-4 h-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2 cursor-pointer text-destructive">
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <StudyNewsPopup open={showNewsPopup} onOpenChange={setShowNewsPopup} />
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="hover:scale-105 transition-transform">
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button asChild className="hover:scale-105 transition-transform shadow-glow">
                  <Link to="/auth?mode=signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              className="p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border animate-fade-in">
          <div className="container mx-auto px-4 py-4 space-y-2">
            {mainNavLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`block text-sm font-medium py-3 px-4 rounded-lg transition-colors ${
                  isActive(link.href)
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            {user && (
              <>
                {authMainLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-2 text-sm font-medium py-3 px-4 rounded-lg transition-colors ${
                      isActive(link.href)
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                ))}
                
                <div className="border-t border-border pt-2 mt-2">
                  {optionsMenuLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className={`flex items-center gap-2 text-sm font-medium py-3 px-4 rounded-lg transition-colors ${
                        isActive(link.href)
                          ? 'text-primary bg-primary/10'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                      onClick={() => setIsOpen(false)}
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  ))}
                </div>
                
                <div className="border-t border-border pt-2 mt-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2" 
                    onClick={() => { setShowNewsPopup(true); setIsOpen(false); }}
                  >
                    <Newspaper className="w-4 h-4" />
                    Study News
                  </Button>
                  <Button 
                    variant="destructive" 
                    className="w-full mt-2" 
                    onClick={() => { handleSignOut(); setIsOpen(false); }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </>
            )}
            
            {!user && (
              <div className="border-t border-border pt-4 mt-2 space-y-2">
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/auth" onClick={() => setIsOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link to="/auth?mode=signup" onClick={() => setIsOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
