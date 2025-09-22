import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Smile, Meh, Frown, Heart, TrendingUp } from "lucide-react";

interface SentimentAnalysisProps {
  score: number;
  label: string;
}

export function SentimentAnalysis({ score, label }: SentimentAnalysisProps) {
  // Convert sentiment score to -1 to 1 range then to 0-100 for display
  const sentimentScore = score; // Already in -1 to 1 range
  const displayScore = Math.round((sentimentScore + 1) * 50);
  
  // Get sentiment color and icon
  const getSentimentData = (score: number, label: string) => {
    if (label === 'positive' || score > 0.1) {
      return {
        color: 'sentiment-positive',
        icon: <Smile className="w-4 h-4" />,
        description: 'Content expresses positive sentiment and optimism'
      };
    }
    if (label === 'negative' || score < -0.1) {
      return {
        color: 'sentiment-negative', 
        icon: <Frown className="w-4 h-4" />,
        description: 'Content expresses negative sentiment or concern'
      };
    }
    return {
      color: 'sentiment-neutral',
      icon: <Meh className="w-4 h-4" />,
      description: 'Content maintains neutral emotional tone'
    };
  };

  const sentimentData = getSentimentData(sentimentScore, label);

  // Get intensity level
  const getIntensity = (score: number) => {
    const absScore = Math.abs(score);
    if (absScore >= 0.7) return 'Very Strong';
    if (absScore >= 0.4) return 'Strong';
    if (absScore >= 0.2) return 'Moderate';
    return 'Mild';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className={`w-8 h-8 rounded-full bg-${sentimentData.color}/10 flex items-center justify-center`}>
            {sentimentData.icon}
          </div>
          Sentiment Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Sentiment Score Visualization */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Sentiment</span>
            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className={`bg-${sentimentData.color}/10 text-${sentimentData.color} border-${sentimentData.color}/20`}
              >
                {label.charAt(0).toUpperCase() + label.slice(1)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {getIntensity(sentimentScore)}
              </Badge>
            </div>
          </div>
          
          {/* Visual sentiment spectrum */}
          <div className="relative">
            <div className="h-6 rounded-full bg-gradient-to-r from-sentiment-negative/30 via-sentiment-neutral/30 to-sentiment-positive/30"></div>
            <div 
              className={`absolute top-0 h-6 w-2 bg-${sentimentData.color} rounded-full shadow-sm`}
              style={{ left: `${displayScore}%`, transform: 'translateX(-50%)' }}
            ></div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Negative</span>
              <span>Neutral</span>
              <span>Positive</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {sentimentData.description}
          </p>
        </div>

        {/* Remove unused sections for now */}

        {/* Sentiment Score Details */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Sentiment Score
            </span>
            <span className="text-sm font-mono">
              {sentimentScore > 0 ? '+' : ''}{sentimentScore.toFixed(2)}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Scale: -1.0 (most negative) to +1.0 (most positive)
          </div>
        </div>

        {/* Remove explanation section for now */}
      </CardContent>
    </Card>
  );
}