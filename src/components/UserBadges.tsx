import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface UserBadge {
  id: string;
  earned_at: string;
  badges: {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
  };
}

interface ProfileStats {
  reputation_score: number;
  total_badges: number;
  daily_streak: number;
}

export const UserBadges = () => {
  const { user } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [profile, setProfile] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchBadges();
    }
  }, [user]);

  const fetchBadges = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-user-badges');

      if (error) throw error;

      if (data?.success) {
        setBadges(data.badges);
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error fetching badges:', error);
      toast({
        title: "Error",
        description: "Failed to load badges",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 animate-pulse" />
          <span className="text-sm text-muted-foreground">Loading achievements...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Stats Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Your Achievements</h3>
          </div>
          {profile && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">{profile.reputation_score} pts</span>
              </div>
              {profile.daily_streak > 0 && (
                <Badge variant="secondary">
                  🔥 {profile.daily_streak} day streak
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Badges Grid */}
        {badges.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {badges.map((userBadge) => (
              <div
                key={userBadge.id}
                className="flex flex-col items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <span className="text-3xl mb-1">{userBadge.badges.icon}</span>
                <span className="text-xs font-medium text-center">
                  {userBadge.badges.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(userBadge.earned_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Award className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No badges earned yet</p>
            <p className="text-xs">Vote on articles and analyze news to earn badges!</p>
          </div>
        )}
      </div>
    </Card>
  );
};
