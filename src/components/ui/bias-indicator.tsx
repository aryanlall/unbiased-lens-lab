import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Minus, Info } from "lucide-react";

interface BiasIndicatorProps {
  score: number;
  label: string;
}

export function BiasIndicator({ score, label }: BiasIndicatorProps) {
  // Convert bias score to 0-100 scale for display  
  const biasScore = score / 100; // Convert to -1 to 1 range
  const displayScore = Math.round((biasScore + 1) * 50);
  
  // Get bias color based on score
  const getBiasColor = (score: number) => {
    if (score <= -0.6) return "bias-left";
    if (score <= -0.3) return "bias-center-left";  
    if (score <= 0.3) return "bias-center";
    if (score <= 0.6) return "bias-center-right";
    return "bias-right";
  };

  const getBiasIcon = (score: number) => {
    if (score <= -0.3) return <ArrowLeft className="w-4 h-4" />;
    if (score >= 0.3) return <ArrowRight className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const getBiasDescription = (label: string) => {
    const descriptions = {
      'left': 'Content shows strong liberal/progressive perspective',
      'center-left': 'Content leans toward liberal/progressive views',
      'center': 'Content appears balanced and neutral',
      'center-right': 'Content leans toward conservative views',
      'right': 'Content shows strong conservative perspective',
    };
    return descriptions[label as keyof typeof descriptions] || 'Bias assessment unavailable';
  };

  const biasColor = getBiasColor(biasScore);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className={`w-8 h-8 rounded-full bg-${biasColor}/10 flex items-center justify-center`}>
            {getBiasIcon(biasScore)}
          </div>
          Political Bias Analysis
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Bias Score Visualization */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Bias Spectrum</span>
            <Badge 
              variant="secondary" 
              className={`bg-${biasColor}/10 text-${biasColor} border-${biasColor}/20`}
            >
              {label.charAt(0).toUpperCase() + label.slice(1)}
            </Badge>
          </div>
          
          {/* Visual bias spectrum */}
          <div className="relative">
            <div className="h-6 rounded-full gradient-bias opacity-30"></div>
            <div 
              className={`absolute top-0 h-6 w-2 bg-${biasColor} rounded-full shadow-sm`}
              style={{ left: `${displayScore}%`, transform: 'translateX(-50%)' }}
            ></div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Left</span>
              <span>Center</span>
              <span>Right</span>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {getBiasDescription(label)}
          </p>
        </div>

        {/* Confidence Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Confidence Level</span>
            <span className="text-sm text-muted-foreground">
              85%
            </span>
          </div>
          <Progress value={85} className="h-2" />
        </div>

        {/* Analysis Note */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Analysis Note</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This bias assessment is based on language patterns, source analysis, and content framing.
              </p>
            </div>
          </div>
        </div>

        {/* Bias Scale Reference */}
        <div className="bg-muted/30 rounded-lg p-3">
          <div className="grid grid-cols-5 gap-1 text-xs text-center">
            <div className="p-1 rounded bg-bias-left/20 text-bias-left">Left</div>
            <div className="p-1 rounded bg-bias-center-left/20 text-bias-center-left">C-Left</div>
            <div className="p-1 rounded bg-bias-center/20 text-bias-center">Center</div>
            <div className="p-1 rounded bg-bias-center-right/20 text-bias-center-right">C-Right</div>
            <div className="p-1 rounded bg-bias-right/20 text-bias-right">Right</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}