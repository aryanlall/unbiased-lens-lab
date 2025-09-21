-- Create user profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  daily_streak INTEGER DEFAULT 0,
  last_login_date DATE,
  total_badges INTEGER DEFAULT 0,
  reputation_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create articles table for storing analyzed articles
CREATE TABLE public.articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT,
  headline TEXT NOT NULL,
  content TEXT,
  source_name TEXT,
  bias_score NUMERIC(3,2), -- -1.0 to 1.0 scale
  bias_label TEXT, -- 'left', 'center-left', 'center', 'center-right', 'right'
  sentiment_score NUMERIC(3,2), -- -1.0 to 1.0 scale
  sentiment_label TEXT, -- 'negative', 'neutral', 'positive'
  fact_check_score NUMERIC(3,2), -- 0.0 to 1.0 scale
  fact_check_explanation TEXT,
  ai_explanation TEXT,
  credibility_score INTEGER, -- 1-100
  published_at TIMESTAMP WITH TIME ZONE,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create similar articles table for cross-source comparison
CREATE TABLE public.similar_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  original_article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  similar_article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  similarity_score NUMERIC(3,2), -- 0.0 to 1.0 scale
  comparison_type TEXT, -- 'same_topic', 'same_bias', 'opposite_bias'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(original_article_id, similar_article_id)
);

-- Create votes table for upvote/downvote system
CREATE TABLE public.article_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,  
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT,
  requirement_type TEXT, -- 'daily_login', 'streak', 'votes', 'analyses'
  requirement_value INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user badges table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create analysis requests table for tracking user requests
CREATE TABLE public.analysis_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  input_type TEXT NOT NULL CHECK (input_type IN ('text', 'url', 'file')),
  input_content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.similar_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for articles (public read, authenticated write)
CREATE POLICY "Anyone can view articles" ON public.articles FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert articles" ON public.articles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update articles" ON public.articles FOR UPDATE TO authenticated USING (true);

-- Create RLS policies for similar articles
CREATE POLICY "Anyone can view similar articles" ON public.similar_articles FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage similar articles" ON public.similar_articles FOR ALL TO authenticated USING (true);

-- Create RLS policies for votes
CREATE POLICY "Users can view all votes" ON public.article_votes FOR SELECT USING (true);
CREATE POLICY "Users can manage their own votes" ON public.article_votes FOR ALL USING (auth.uid() = user_id);

-- Create RLS policies for badges
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Only authenticated users can view user badges" ON public.user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view their own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);

-- Create RLS policies for analysis requests
CREATE POLICY "Users can view their own requests" ON public.analysis_requests FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert their own requests" ON public.analysis_requests FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update their own requests" ON public.analysis_requests FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_votes_updated_at BEFORE UPDATE ON public.article_votes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default badges
INSERT INTO public.badges (name, description, icon, color, requirement_type, requirement_value) VALUES
('First Analysis', 'Completed your first news analysis', '🔍', '#3B82F6', 'analyses', 1),
('Truth Seeker', 'Analyzed 10 articles', '🎯', '#10B981', 'analyses', 10),
('Bias Buster', 'Analyzed 50 articles', '⚖️', '#F59E0B', 'analyses', 50),
('Daily Reader', 'Logged in for 3 consecutive days', '📅', '#8B5CF6', 'streak', 3),
('Week Warrior', 'Logged in for 7 consecutive days', '🗓️', '#EF4444', 'streak', 7),
('Vote Master', 'Cast 25 votes on articles', '👍', '#06B6D4', 'votes', 25),
('Community Champion', 'Cast 100 votes on articles', '🏆', '#DC2626', 'votes', 100);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_articles_bias_score ON public.articles(bias_score);
CREATE INDEX idx_articles_sentiment_score ON public.articles(sentiment_score);
CREATE INDEX idx_articles_created_at ON public.articles(created_at);
CREATE INDEX idx_similar_articles_original ON public.similar_articles(original_article_id);
CREATE INDEX idx_votes_article_id ON public.article_votes(article_id);
CREATE INDEX idx_votes_user_id ON public.article_votes(user_id);
CREATE INDEX idx_analysis_requests_user_id ON public.analysis_requests(user_id);
CREATE INDEX idx_analysis_requests_status ON public.analysis_requests(status);