import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThumbsUp, ThumbsDown, ExternalLink, TrendingUp, Users, Clock, Globe } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface SimilarArticle {
  id: string;
  headline: string;
  source_name: string;
  url?: string;
  bias_score: number;
  bias_label: string;
  sentiment_score: number;
  similarity_score: number;
  comparison_type: string;
  published_at?: string;
  upvotes: number;
  downvotes: number;
  user_vote?: 'upvote' | 'downvote' | null;
}

interface SimilarArticlesProps {
  articles: SimilarArticle[];
  onVote: (articleId: string, voteType: 'upvote' | 'downvote') => void;
  isLoading?: boolean;
}

export function SimilarArticles({ articles, onVote, isLoading = false }: SimilarArticlesProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [votingStates, setVotingStates] = useState<{ [key: string]: boolean }>({});

  const handleVote = async (articleId: string, voteType: 'upvote' | 'downvote') => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote on articles.",
        variant: "destructive",
      });
      return;
    }

    setVotingStates(prev => ({ ...prev, [articleId]: true }));
    try {
      await onVote(articleId, voteType);
    } finally {
      setVotingStates(prev => ({ ...prev, [articleId]: false }));
    }
  };

  const getBiasColor = (biasLabel: string) => {
    const colorMap = {
      'left': 'bias-left',
      'center-left': 'bias-center-left',
      'center': 'bias-center',
      'center-right': 'bias-center-right',
      'right': 'bias-right',
    };
    return colorMap[biasLabel as keyof typeof colorMap] || 'muted';
  };

  const getComparisonTypeData = (type: string) => {
    const typeMap = {
      'same_topic': { 
        label: 'Same Topic', 
        icon: <Globe className="w-3 h-3" />,
        description: 'Similar subject matter'
      },
      'same_bias': { 
        label: 'Similar Bias', 
        icon: <TrendingUp className="w-3 h-3" />,
        description: 'Similar political leaning'
      },
      'opposite_bias': { 
        label: 'Opposing View', 
        icon: <Users className="w-3 h-3" />,
        description: 'Different perspective'
      },
    };
    return typeMap[type as keyof typeof typeMap] || { label: type, icon: null, description: '' };
  };

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5" />
            Similar Articles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (articles.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5" />
            Similar Articles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No similar articles found yet.</p>
            <p className="text-sm">We're continuously updating our database with new sources.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5" />
          Similar Articles
          <Badge variant="secondary" className="ml-auto">
            {articles.length} found
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {articles.map((article, index) => {
            const comparisonData = getComparisonTypeData(article.comparison_type);
            const biasColor = getBiasColor(article.bias_label);
            const isVoting = votingStates[article.id];
            
            return (
              <div key={article.id}>
                {index > 0 && <Separator className="mb-4" />}
                
                <div className="space-y-3">
                  {/* Article Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <h4 className="font-medium leading-tight">
                        {article.headline}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">{article.source_name}</span>
                        {article.published_at && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(article.published_at)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {article.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="shrink-0"
                      >
                        <a 
                          href={article.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                  </div>

                  {/* Article Metadata */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge 
                      variant="outline"
                      className={`bg-${biasColor}/10 text-${biasColor} border-${biasColor}/20`}
                    >
                      {article.bias_label}
                    </Badge>
                    
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {comparisonData.icon}
                      {comparisonData.label}
                    </Badge>
                    
                    <Badge variant="outline">
                      {Math.round(article.similarity_score * 100)}% similar
                    </Badge>
                  </div>

                  {/* Voting Section */}
                  <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant={article.user_vote === 'upvote' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => handleVote(article.id, 'upvote')}
                          disabled={isVoting}
                          className="h-8 px-3"
                        >
                          <ThumbsUp className="w-4 h-4 mr-1" />
                          {article.upvotes}
                        </Button>
                        
                        <Button
                          variant={article.user_vote === 'downvote' ? 'destructive' : 'ghost'}
                          size="sm"
                          onClick={() => handleVote(article.id, 'downvote')}
                          disabled={isVoting}
                          className="h-8 px-3"
                        >
                          <ThumbsDown className="w-4 h-4 mr-1" />
                          {article.downvotes}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {comparisonData.description}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!user && (
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Sign in</strong> to vote on articles and help improve our recommendations for everyone!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}