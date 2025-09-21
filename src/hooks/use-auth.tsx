import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        // Handle daily login streak and badge checking
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            try {
              await updateDailyStreak(session.user.id);
            } catch (error) {
              console.error('Error updating daily streak:', error);
            }
          }, 0);
        }
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateDailyStreak = async (userId: string) => {
    try {
      // Get current profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('daily_streak, last_login_date')
        .eq('user_id', userId)
        .single();

      if (!profile) return;

      const today = new Date().toISOString().split('T')[0];
      const lastLogin = profile.last_login_date;
      
      let newStreak = profile.daily_streak || 0;
      
      if (lastLogin !== today) {
        // Check if it's consecutive
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastLogin === yesterdayStr) {
          newStreak += 1; // Consecutive day
        } else if (lastLogin !== today) {
          newStreak = 1; // Reset streak
        }

        // Update profile
        await supabase
          .from('profiles')
          .update({
            daily_streak: newStreak,
            last_login_date: today,
          })
          .eq('user_id', userId);

        // Check for streak badges
        if (newStreak === 3 || newStreak === 7) {
          const badgeName = newStreak === 3 ? 'Daily Reader' : 'Week Warrior';
          
          // Check if user already has this badge
          const { data: existingBadge } = await supabase
            .from('user_badges')
            .select('id')
            .eq('user_id', userId)
            .eq('badge_id', (
              await supabase
                .from('badges')
                .select('id')
                .eq('name', badgeName)
                .single()
            ).data?.id)
            .single();

          if (!existingBadge) {
            // Award badge
            const { data: badge } = await supabase
              .from('badges')
              .select('id, name, description, icon')
              .eq('name', badgeName)
              .single();

            if (badge) {
              await supabase
                .from('user_badges')
                .insert({
                  user_id: userId,
                  badge_id: badge.id,
                });

              toast({
                title: "🎉 Badge Earned!",
                description: `${badge.icon} ${badge.name}: ${badge.description}`,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error updating daily streak:', error);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    session,
    isLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}