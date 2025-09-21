import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Brain, 
  ChevronDown, 
  ChevronUp, 
  Target, 
  BookOpen, 
  Lightbulb,
  AlertCircle,
  CheckCircle2,
  Info
} from "lucide-react";

interface AIExplanationProps {
  explanation: string;
  keyFindings?: string[];
  methodology?: string[];
  limitations?: string[];
  confidence?: number;
  processingTime?: number;
}

export function AIExplanation({ 
  explanation, 
  keyFindings = [], 
  methodology = [],
  limitations = [],
  confidence,
  processingTime
}: AIExplanationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);

  const getConfidenceLevel = (score?: number) => {
    if (!score) return null;
    if (score >= 0.8) return { label: 'High', color: 'credibility-high' };
    if (score >= 0.6) return { label: 'Medium', color: 'credibility-medium' };
    return { label: 'Low', color: 'credibility-low' };
  };

  const confidenceData = getConfidenceLevel(confidence);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          AI Analysis Explanation
          {confidenceData && (
            <Badge 
              variant="secondary" 
              className={`ml-auto bg-${confidenceData.color}/10 text-${confidenceData.color} border-${confidenceData.color}/20`}
            >
              {confidenceData.label} Confidence
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Explanation */}
        <div className="space-y-3">
          <div className="prose prose-sm max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              {explanation}
            </p>
          </div>
        </div>

        {/* Key Findings */}
        {keyFindings.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Target className="w-4 h-4" />
              Key Findings
            </h4>
            <div className="space-y-2">
              {keyFindings.map((finding, index) => (
                <div key={index} className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {finding}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Metrics */}
        <div className="grid grid-cols-2 gap-4">
          {confidence && (
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Confidence Score</span>
              </div>
              <div className="text-lg font-bold">
                {Math.round(confidence * 100)}%
              </div>
            </div>
          )}
          
          {processingTime && (
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Processing Time</span>
              </div>
              <div className="text-lg font-bold">
                {processingTime.toFixed(1)}s
              </div>
            </div>
          )}
        </div>

        {/* Expandable Technical Details */}
        {(methodology.length > 0 || limitations.length > 0) && (
          <Collapsible open={showTechnical} onOpenChange={setShowTechnical}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Technical Details
                </span>
                {showTechnical ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-4 mt-4">
              {/* Methodology */}
              {methodology.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Analysis Methodology
                  </h5>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {methodology.map((method, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                        {method}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Limitations */}
              {limitations.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-sm font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    Analysis Limitations
                  </h5>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {limitations.map((limitation, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-warning mt-2 flex-shrink-0" />
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Disclaimer */}
        <div className="bg-muted/20 rounded-lg p-3 border-l-4 border-primary/30">
          <p className="text-xs text-muted-foreground">
            <strong>AI Analysis Disclaimer:</strong> This analysis is generated by artificial intelligence 
            and should be considered as one perspective among many. For critical decisions, please 
            consult multiple sources and expert human analysis.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}