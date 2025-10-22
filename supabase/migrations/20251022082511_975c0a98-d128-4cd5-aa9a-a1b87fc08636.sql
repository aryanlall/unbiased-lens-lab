-- Create function to increment reputation
CREATE OR REPLACE FUNCTION public.increment_reputation(user_id uuid, amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET reputation_score = GREATEST(0, COALESCE(reputation_score, 0) + amount),
      updated_at = now()
  WHERE profiles.user_id = increment_reputation.user_id;
END;
$$;

-- Insert default badges for voting achievements
INSERT INTO public.badges (name, description, icon, color, requirement_type, requirement_value)
VALUES
  ('First Vote', 'Cast your first vote on an article', '👍', 'blue', 'votes', 1),
  ('Active Voter', 'Cast 10 votes on articles', '🎯', 'green', 'votes', 10),
  ('Vote Champion', 'Cast 50 votes on articles', '🏆', 'gold', 'votes', 50),
  ('Vote Legend', 'Cast 100 votes on articles', '👑', 'purple', 'votes', 100),
  ('Fact Checker', 'Analyze 5 articles for bias', '🔍', 'orange', 'analyses', 5),
  ('News Analyst', 'Analyze 20 articles for bias', '📊', 'red', 'analyses', 20),
  ('Truth Seeker', 'Analyze 50 articles for bias', '⚖️', 'indigo', 'analyses', 50)
ON CONFLICT (name) DO NOTHING;

-- Update profiles to track badge count
CREATE OR REPLACE FUNCTION public.update_badge_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET total_badges = (
    SELECT COUNT(*)
    FROM public.user_badges
    WHERE user_badges.user_id = NEW.user_id
  )
  WHERE profiles.user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Create trigger to update badge count when badges are awarded
DROP TRIGGER IF EXISTS on_badge_earned ON public.user_badges;
CREATE TRIGGER on_badge_earned
  AFTER INSERT ON public.user_badges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_badge_count();