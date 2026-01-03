import { cn } from '@/lib/utils';

interface PageBackgroundProps {
  className?: string;
  variant?: 'default' | 'hero' | 'subtle';
}

export function PageBackground({ className, variant = 'default' }: PageBackgroundProps) {
  return (
    <div className={cn("fixed inset-0 -z-10 overflow-hidden pointer-events-none", className)}>
      {/* Base gradient */}
      <div className="absolute inset-0 gradient-hero" />
      
      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), 
                           linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Floating orbs */}
      <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] rounded-full bg-primary/5 dark:bg-primary/10 blur-[100px] animate-float" />
      <div className="absolute top-[40%] right-[10%] w-[400px] h-[400px] rounded-full bg-accent/5 dark:bg-accent/10 blur-[80px] animate-float delay-300" />
      <div className="absolute bottom-[10%] left-[30%] w-[350px] h-[350px] rounded-full bg-primary/3 dark:bg-primary/8 blur-[90px] animate-pulse-soft" />
      
      {/* Additional decorative elements for hero variant */}
      {variant === 'hero' && (
        <>
          <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-accent/8 dark:bg-accent/15 blur-[70px] animate-pulse-soft delay-200" />
          <div className="absolute bottom-[20%] right-[5%] w-[250px] h-[250px] rounded-full bg-primary/6 dark:bg-primary/12 blur-[60px] animate-float delay-500" />
        </>
      )}
      
      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
      />
    </div>
  );
}
