import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Article {
  id: string;
  headline: string;
  source_name?: string;
  bias_label?: string;
  bias_score?: number;
  sentiment_label?: string;
  analyzed_at: string;
  url?: string;
}

interface RelatedNewsFeedProps {
  currentArticleId?: string;
  biasLabel?: string;
}

export const RelatedNewsFeed = ({ currentArticleId, biasLabel }: RelatedNewsFeedProps) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRelatedArticles();
  }, [currentArticleId, biasLabel]);

  const fetchRelatedArticles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-related-articles', {
        body: {
          articleId: currentArticleId,
          biasLabel: biasLabel,
          limit: 5
        }
      });

      if (error) throw error;

      if (data?.success) {
        setArticles(data.articles);
      }
    } catch (error) {
      console.error('Error fetching related articles:', error);
      toast({
        title: "Error",
        description: "Failed to load related articles",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getBiasColor = (label?: string) => {
    switch (label) {
      case 'left': return 'bg-blue-500';
      case 'center-left': return 'bg-blue-300';
      case 'center': return 'bg-gray-500';
      case 'center-right': return 'bg-red-300';
      case 'right': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2 text-muted-foreground">Loading related articles...</span>
        </div>
      </Card>
    );
  }

  if (articles.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No related articles found yet</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-semibold">Related News Feed</h3>
      </div>
      
      <div className="space-y-4">
        {articles.map((article) => (
          <Card key={article.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm line-clamp-2 flex-1">
                  {article.headline}
                </h4>
                {article.url && (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                {article.source_name && (
                  <span className="font-medium">{article.source_name}</span>
                )}
                <span>•</span>
                <span>{formatTimeAgo(article.analyzed_at)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                {article.bias_label && (
                  <Badge variant="outline" className={`${getBiasColor(article.bias_label)} text-white border-0`}>
                    {article.bias_label}
                  </Badge>
                )}
                {article.sentiment_label && (
                  <Badge variant="secondary">
                    {article.sentiment_label}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
};
