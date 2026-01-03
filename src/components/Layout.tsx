import { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { PageBackground } from './PageBackground';

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
  backgroundVariant?: 'default' | 'hero' | 'subtle';
}

export function Layout({ children, showFooter = true, backgroundVariant = 'default' }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col relative">
      <PageBackground variant={backgroundVariant} />
      <Navbar />
      <main className="flex-1 pt-16 relative z-10">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
