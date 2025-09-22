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

interface UserProfileProps {
  user: any;
  onSignOut: () => void;
}

export function UserProfile({ user, onSignOut }: UserProfileProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || '?';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Mock stats for now
  const stats = {
    totalAnalyses: 0,
    totalVotes: 0,
    accuracyScore: 0,
    dailyStreak: 0,
    reputationScore: 0
  };

  const badges: any[] = [];

  const getReputationLevel = (score: number) => {
    if (score >= 1000) return { level: 'Expert', color: 'text-yellow-500', icon: <Crown className="w-4 h-4" /> };
    if (score >= 500) return { level: 'Advanced', color: 'text-purple-500', icon: <Target className="w-4 h-4" /> };
    if (score >= 100) return { level: 'Intermediate', color: 'text-blue-500', icon: <TrendingUp className="w-4 h-4" /> };
    return { level: 'Beginner', color: 'text-green-500', icon: <User className="w-4 h-4" /> };
  };

  const reputationData = getReputationLevel(stats.reputationScore);

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarFallback className="text-lg font-semibold">
                {getInitials(user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-xl">
                {user?.email || 'Anonymous User'}
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
              {stats.reputationScore}/100
            </span>
          </div>
          <Progress value={stats.reputationScore} className="h-2" />
        </div>

        {/* Achievement Progress */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Next Goals
          </h4>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>First Analysis</span>
              <span>0/1 completed</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Weekly Login Streak</span>
              <span>{stats.dailyStreak}/7 days</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}