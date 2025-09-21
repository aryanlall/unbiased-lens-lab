import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Link, FileText, Type, Upload, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface NewsAnalysisFormProps {
  onAnalysisStart: (data: any) => void;
  isAnalyzing: boolean;
}

export function NewsAnalysisForm({ onAnalysisStart, isAnalyzing }: NewsAnalysisFormProps) {
  const [inputType, setInputType] = useState<'text' | 'url' | 'file'>('text');
  const [formData, setFormData] = useState({
    headline: '',
    url: '',
    file: null as File | null,
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['text/plain', 'application/pdf', 'text/html'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: "Please upload a text, PDF, or HTML file.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      handleInputChange('file', file);
    }
  };

  const handleSubmit = async () => {
    let inputContent = '';
    
    switch (inputType) {
      case 'text':
        if (!formData.headline.trim()) {
          toast({
            title: "Missing Input",
            description: "Please enter a news headline or article text.",
            variant: "destructive",
          });
          return;
        }
        inputContent = formData.headline.trim();
        break;
        
      case 'url':
        if (!formData.url.trim()) {
          toast({
            title: "Missing URL",
            description: "Please enter a valid news article URL.",
            variant: "destructive",
          });
          return;
        }
        // Basic URL validation
        try {
          new URL(formData.url);
          inputContent = formData.url.trim();
        } catch {
          toast({
            title: "Invalid URL",
            description: "Please enter a valid URL starting with http:// or https://",
            variant: "destructive",
          });
          return;
        }
        break;
        
      case 'file':
        if (!formData.file) {
          toast({
            title: "No File Selected",
            description: "Please select a file to analyze.",
            variant: "destructive",
          });
          return;
        }
        inputContent = formData.file.name;
        break;
    }

    // Start analysis
    onAnalysisStart({
      inputType,
      inputContent,
      file: formData.file,
      userId: user?.id,
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-card gradient-card">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-3 text-2xl">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Search className="w-5 h-5 text-primary" />
          </div>
          Analyze News for Bias
        </CardTitle>
        <p className="text-muted-foreground">
          Enter a headline, paste a URL, or upload an article to get comprehensive bias analysis, 
          fact-checking, and cross-source comparison.
        </p>
      </CardHeader>
      
      <CardContent>
        <Tabs value={inputType} onValueChange={(value) => setInputType(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              <span className="hidden sm:inline">Text</span>
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              <span className="hidden sm:inline">URL</span>
            </TabsTrigger>
            <TabsTrigger value="file" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">File</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="headline">News Headline or Article Text</Label>
              <Textarea
                id="headline"
                placeholder="Enter the news headline or paste the full article text here..."
                className="min-h-[120px] resize-y"
                value={formData.headline}
                onChange={(e) => handleInputChange('headline', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                You can enter just a headline or the full article text for more detailed analysis.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="url" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="url">Article URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com/news-article"
                value={formData.url}
                onChange={(e) => handleInputChange('url', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                We'll automatically extract and analyze the article content from the URL.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="file" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="file">Upload Article File</Label>
              <div className="border-2 border-dashed border-muted rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <Input
                  id="file"
                  type="file"
                  accept=".txt,.pdf,.html"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Label 
                  htmlFor="file" 
                  className="cursor-pointer text-primary hover:text-primary/80 font-medium"
                >
                  {formData.file ? formData.file.name : "Click to upload or drag and drop"}
                </Label>
                <p className="text-sm text-muted-foreground mt-2">
                  Supports TXT, PDF, and HTML files (max 5MB)
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 pt-4 border-t">
          <Button 
            onClick={handleSubmit} 
            disabled={isAnalyzing}
            className="w-full h-12 text-base gradient-primary shadow-primary transition-smooth"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analyzing Article...
              </>
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Analyze for Bias
              </>
            )}
          </Button>

          {!user && (
            <p className="text-sm text-muted-foreground mt-3 text-center">
              <strong>Tip:</strong> Sign in to save your analysis history and earn badges!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}