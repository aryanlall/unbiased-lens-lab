import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { AuthDialog } from "@/components/ui/auth-dialog";
import { NewsAnalysisForm } from "@/components/ui/news-analysis-form";
import { UserProfile } from "@/components/ui/user-profile";
import { BiasIndicator } from "@/components/ui/bias-indicator";
import { SentimentAnalysis } from "@/components/ui/sentiment-analysis";
import { FactCheckDisplay } from "@/components/ui/fact-check-display";
import { AIExplanation } from "@/components/ui/ai-explanation";
import { RelatedNewsFeed } from "@/components/RelatedNewsFeed";
import { UserBadges } from "@/components/UserBadges";
import { Card } from "@/components/ui/card";
import { Loader2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AnalysisResult {
  bias_score: number;
  bias_label: string;
  sentiment_score: number;
  sentiment_label: string;
  fact_check_score: number;
  credibility_score: number;
  explanation: string;
  key_findings: string[];
  methodology: string;
  limitations: string;
  confidence: number;
}

const Index = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentArticle, setCurrentArticle] = useState<{
    headline: string;
    content?: string;
    url?: string;
    source_name?: string;
  } | null>(null);

  const handleAnalysis = async (data: { headline: string; content?: string; url?: string }) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    try {
      let articleData = data;
      
      // If URL provided, scrape the content first
      if (data.url && !data.content) {
        const scrapeResult = await supabase.functions.invoke('scrape-article', {
          body: { url: data.url }
        });
        
        if (scrapeResult.error || !scrapeResult.data?.success) {
          throw new Error('Failed to scrape article content');
        }
        
        articleData = {
          headline: scrapeResult.data.headline,
          content: scrapeResult.data.content,
          url: data.url
        };
        
        toast({
          title: "Article Scraped",
          description: "Successfully extracted article content",
        });
      }
      
      setCurrentArticle(articleData);
      
      // Analyze the article
      const analysisResult = await supabase.functions.invoke('analyze-news', {
        body: {
          headline: articleData.headline,
          content: articleData.content,
          url: articleData.url
        }
      });
      
      if (analysisResult.error || !analysisResult.data?.success) {
        throw new Error(analysisResult.data?.error || 'Analysis failed');
      }
      
      setAnalysisResult(analysisResult.data.analysis);
      
      toast({
        title: "Analysis Complete",
        description: "Your article has been successfully analyzed",
      });
      
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze article",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            News Bias Detector
          </h1>
          <p className="text-muted-foreground text-lg">
            Analyze news articles for bias, sentiment, and factual accuracy using AI
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {user ? (
            <>
              <div className="flex justify-between items-center">
                <UserProfile user={user} onSignOut={signOut} />
              </div>
              
              <UserBadges />
              
              <NewsAnalysisForm onSubmit={handleAnalysis} />
              
              {isAnalyzing && (
                <Card className="p-8 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analyzing Article</h3>
                  <p className="text-muted-foreground">
                    Our AI is processing the article for bias, sentiment, and factual accuracy...
                  </p>
                </Card>
              )}
              
              {analysisResult && currentArticle && (
                <div className="space-y-6">
                  <Card className="p-6">
                    <h2 className="text-2xl font-bold mb-2">{currentArticle.headline}</h2>
                    {currentArticle.source_name && (
                      <p className="text-sm text-muted-foreground mb-4">
                        Source: {currentArticle.source_name}
                      </p>
                    )}
                  </Card>
                  
                  <div className="grid lg:grid-cols-2 gap-6">
                    <BiasIndicator 
                      score={analysisResult.bias_score} 
                      label={analysisResult.bias_label} 
                    />
                    <SentimentAnalysis 
                      score={analysisResult.sentiment_score} 
                      label={analysisResult.sentiment_label} 
                    />
                  </div>
                  
                  <FactCheckDisplay 
                    factCheckScore={analysisResult.fact_check_score} 
                    explanation={analysisResult.explanation}
                  />
                  
                  <AIExplanation
                    explanation={analysisResult.explanation}
                    keyFindings={Array.isArray(analysisResult.key_findings) ? analysisResult.key_findings : [analysisResult.key_findings].filter(Boolean)}
                    methodology={[analysisResult.methodology || "AI-powered analysis using Groq"]}
                    limitations={[analysisResult.limitations || "Analysis may vary based on context"]}
                    confidence={analysisResult.confidence}
                    processingTime={2.5}
                  />
                  
                  <RelatedNewsFeed 
                    biasLabel={analysisResult.bias_label}
                  />
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <div className="max-w-md mx-auto">
                <div className="mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <LogIn className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Get Started</h2>
                  <p className="text-muted-foreground">
                    Sign in to start analyzing news articles for bias and accuracy
                  </p>
                </div>
                <AuthDialog />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;