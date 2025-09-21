import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, AlertTriangle, XCircle, Shield, ExternalLink, Search } from "lucide-react";

interface FactCheckDisplayProps {
  factCheckScore: number; // 0.0 to 1.0
  explanation: string;
  sources?: Array<{
    name: string;
    url: string;
    credibility: 'high' | 'medium' | 'low';
  }>;
  claims?: Array<{
    claim: string;
    verdict: 'true' | 'false' | 'unverified' | 'misleading';
    confidence: number;
  }>;
}

export function FactCheckDisplay({ 
  factCheckScore, 
  explanation, 
  sources = [], 
  claims = [] 
}: FactCheckDisplayProps) {
  // Get fact check status based on score
  const getFactCheckStatus = (score: number) => {
    if (score >= 0.8) {
      return {
        label: 'Highly Accurate',
        color: 'credibility-high',
        icon: <CheckCircle className="w-4 h-4" />,
        description: 'Claims are well-supported by reliable sources'
      };
    }
    if (score >= 0.6) {
      return {
        label: 'Mostly Accurate',
        color: 'credibility-medium',
        icon: <Shield className="w-4 h-4" />,
        description: 'Most claims are supported, some minor inaccuracies possible'
      };
    }
    if (score >= 0.4) {
      return {
        label: 'Mixed Accuracy',
        color: 'warning',
        icon: <AlertTriangle className="w-4 h-4" />,
        description: 'Some claims verified, others questionable or unsupported'
      };
    }
    return {
      label: 'Low Accuracy',
      color: 'credibility-low',
      icon: <XCircle className="w-4 h-4" />,
      description: 'Claims are largely unsupported or contradicted by evidence'
    };
  };

  const statusData = getFactCheckStatus(factCheckScore);

  const getVerdictData = (verdict: string) => {
    const verdictMap = {
      'true': { color: 'credibility-high', icon: '✓', label: 'True' },
      'false': { color: 'credibility-low', icon: '✗', label: 'False' },
      'misleading': { color: 'warning', icon: '⚠', label: 'Misleading' },
      'unverified': { color: 'muted', icon: '?', label: 'Unverified' }
    };
    return verdictMap[verdict as keyof typeof verdictMap] || verdictMap.unverified;
  };

  const getSourceCredibilityColor = (credibility: string) => {
    const colorMap = {
      'high': 'credibility-high',
      'medium': 'credibility-medium', 
      'low': 'credibility-low'
    };
    return colorMap[credibility as keyof typeof colorMap] || 'muted';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className={`w-8 h-8 rounded-full bg-${statusData.color}/10 flex items-center justify-center`}>
            {statusData.icon}
          </div>
          Fact Check Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Fact Check Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Accuracy Assessment</span>
            <Badge 
              variant="secondary" 
              className={`bg-${statusData.color}/10 text-${statusData.color} border-${statusData.color}/20`}
            >
              {statusData.label}
            </Badge>
          </div>
          
          <Progress value={factCheckScore * 100} className="h-3" />
          
          <p className="text-sm text-muted-foreground">
            {statusData.description}
          </p>
        </div>

        {/* Claims Analysis */}
        {claims.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Search className="w-4 h-4" />
              Individual Claims
            </h4>
            <div className="space-y-2">
              {claims.map((claim, index) => {
                const verdictData = getVerdictData(claim.verdict);
                return (
                  <div key={index} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-relaxed flex-1">
                        "{claim.claim}"
                      </p>
                      <Badge 
                        variant="outline" 
                        className={`text-${verdictData.color} border-${verdictData.color}/20 shrink-0`}
                      >
                        {verdictData.icon} {verdictData.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Confidence:</span>
                      <Progress value={claim.confidence * 100} className="h-1 flex-1" />
                      <span className="text-xs text-muted-foreground">
                        {Math.round(claim.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sources */}
        {sources.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Sources Consulted</h4>
            <div className="space-y-2">
              {sources.map((source, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`text-${getSourceCredibilityColor(source.credibility)} border-${getSourceCredibilityColor(source.credibility)}/20`}
                    >
                      {source.credibility}
                    </Badge>
                    <span className="text-sm font-medium">{source.name}</span>
                  </div>
                  <a 
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm font-medium mb-2">Fact Check Summary</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {explanation}
          </p>
        </div>

        {/* Methodology Note */}
        <div className="text-xs text-muted-foreground bg-muted/20 rounded p-2">
          <strong>Methodology:</strong> This fact-check combines automated analysis with cross-referencing 
          against reliable news sources, fact-checking organizations, and public records. 
          Human verification may be needed for complex claims.
        </div>
      </CardContent>
    </Card>
  );
}