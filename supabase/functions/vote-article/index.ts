import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { articleId, voteType } = await req.json();

    if (!articleId || !['upvote', 'downvote'].includes(voteType)) {
      throw new Error('Invalid parameters');
    }

    console.log(`Processing ${voteType} for article ${articleId} by user ${user.id}`);

    // Use service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if user already voted
    const { data: existingVote } = await supabaseAdmin
      .from('article_votes')
      .select('*')
      .eq('article_id', articleId)
      .eq('user_id', user.id)
      .single();

    let operation = 'new';
    
    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote (toggle off)
        await supabaseAdmin
          .from('article_votes')
          .delete()
          .eq('id', existingVote.id);
        operation = 'removed';
      } else {
        // Change vote
        await supabaseAdmin
          .from('article_votes')
          .update({ vote_type: voteType, updated_at: new Date().toISOString() })
          .eq('id', existingVote.id);
        operation = 'changed';
      }
    } else {
      // Create new vote
      await supabaseAdmin
        .from('article_votes')
        .insert({
          article_id: articleId,
          user_id: user.id,
          vote_type: voteType,
        });
      operation = 'new';
    }

    // Update user reputation if new vote
    if (operation === 'new') {
      const reputationChange = voteType === 'upvote' ? 5 : -2;
      
      await supabaseAdmin.rpc('increment_reputation', {
        user_id: user.id,
        amount: reputationChange
      }).catch(err => {
        console.log('Reputation update skipped:', err.message);
      });
    }

    // Check for badge achievements
    const { data: voteCount } = await supabaseAdmin
      .from('article_votes')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id);

    const totalVotes = voteCount || 0;
    
    // Award badges based on vote milestones
    const badgeMilestones = [
      { name: 'First Vote', votes: 1 },
      { name: 'Active Voter', votes: 10 },
      { name: 'Vote Champion', votes: 50 },
      { name: 'Vote Legend', votes: 100 },
    ];

    for (const milestone of badgeMilestones) {
      if (totalVotes >= milestone.votes) {
        // Check if badge exists
        const { data: badge } = await supabaseAdmin
          .from('badges')
          .select('id')
          .eq('name', milestone.name)
          .single();

        if (badge) {
          // Check if user already has this badge
          const { data: userBadge } = await supabaseAdmin
            .from('user_badges')
            .select('id')
            .eq('user_id', user.id)
            .eq('badge_id', badge.id)
            .single();

          if (!userBadge) {
            await supabaseAdmin
              .from('user_badges')
              .insert({
                user_id: user.id,
                badge_id: badge.id,
              });
            console.log(`Awarded badge: ${milestone.name}`);
          }
        }
      }
    }

    // Get updated vote counts
    const { data: voteCounts } = await supabaseAdmin
      .from('article_votes')
      .select('vote_type')
      .eq('article_id', articleId);

    const upvotes = voteCounts?.filter(v => v.vote_type === 'upvote').length || 0;
    const downvotes = voteCounts?.filter(v => v.vote_type === 'downvote').length || 0;

    console.log(`Vote processed successfully. New counts - Upvotes: ${upvotes}, Downvotes: ${downvotes}`);

    return new Response(JSON.stringify({
      success: true,
      operation,
      upvotes,
      downvotes,
      userVote: operation === 'removed' ? null : voteType,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in vote-article function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false 
    }), {
      status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
