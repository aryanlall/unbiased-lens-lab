import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Trophy, 
  Calendar, 
  Target, 
  TrendingUp, 
  LogOut,
  Crown,
  Flame,
  Vote
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface UserStats {
  totalAnalyses: number;
  totalVotes: number;
  accuracyScore: number;
  dailyStreak: number;
  reputationScore: number;
}

interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earned_at: string;
}

interface UserProfileProps {
  profile?: {
    display_name: string;
    avatar_url?: string;
  };
  stats: UserStats;
  badges: UserBadge[];
  isLoading?: boolean;
}

export function UserProfile({ profile, stats, badges, isLoading = false }: UserProfileProps) {
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getReputationLevel = (score: number) => {
    if (score >= 1000) return { level: 'Expert', color: 'text-yellow-500', icon: <Crown className="w-4 h-4" /> };
    if (score >= 500) return { level: 'Advanced', color: 'text-purple-500', icon: <Target className="w-4 h-4" /> };
    if (score >= 100) return { level: 'Intermediate', color: 'text-blue-500', icon: <TrendingUp className="w-4 h-4" /> };
    return { level: 'Beginner', color: 'text-green-500', icon: <User className="w-4 h-4" /> };
  };

  const reputationData = getReputationLevel(stats.reputationScore);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-muted rounded-full animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-32 animate-pulse" />
              <div className="h-3 bg-muted rounded w-24 animate-pulse" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(profile?.display_name)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-xl">
                {profile?.display_name || user?.email || 'Anonymous User'}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className={`${reputationData.color} bg-transparent border-current`}
                >
                  {reputationData.icon}
                  {reputationData.level}
                </Badge>
                <Badge variant="outline">
                  {stats.reputationScore} pts
                </Badge>
              </div>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="w-4 h-4" />
            {isSigningOut ? "..." : "Sign Out"}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
            <div className="text-sm text-muted-foreground">Analyses</div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Vote className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold">{stats.totalVotes}</div>
            <div className="text-sm text-muted-foreground">Votes</div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">{stats.dailyStreak}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </div>
          
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center mb-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold">{Math.round(stats.accuracyScore * 100)}%</div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </div>
        </div>

        {/* Progress to Next Level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress to Next Level</span>
            <span className="text-sm text-muted-foreground">
              {stats.reputationScore}/1000
            </span>
          </div>
          <Progress value={(stats.reputationScore % 1000) / 10} className="h-2" />
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Recent Badges</span>
              <Badge variant="secondary">{badges.length}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {badges.slice(0, 6).map((badge) => (
                <div key={badge.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                  <span className="text-lg">{badge.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{badge.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {badge.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {badges.length > 6 && (
              <Button variant="outline" size="sm" className="w-full">
                View All {badges.length} Badges
              </Button>
            )}
          </div>
        )}

        {/* Achievement Progress */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Next Goals
          </h4>
          
          <div className="space-y-2">
            {stats.dailyStreak < 7 && (
              <div className="flex items-center justify-between text-sm">
                <span>Weekly Login Streak</span>
                <span className="text-muted-foreground">
                  {stats.dailyStreak}/7 days
                </span>
              </div>
            )}
            
            {stats.totalAnalyses < 50 && (
              <div className="flex items-center justify-between text-sm">
                <span>Bias Buster Badge</span>
                <span className="text-muted-foreground">
                  {stats.totalAnalyses}/50 analyses
                </span>
              </div>
            )}
            
            {stats.totalVotes < 100 && (
              <div className="flex items-center justify-between text-sm">
                <span>Community Champion Badge</span>
                <span className="text-muted-foreground">
                  {stats.totalVotes}/100 votes
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}