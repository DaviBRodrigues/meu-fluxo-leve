import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use service role to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting cleanup of expired test users...');

    // Find expired test users
    const { data: expiredUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('user_id, full_name, test_expires_at')
      .eq('is_test_user', true)
      .not('test_expires_at', 'is', null)
      .lt('test_expires_at', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired users:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredUsers?.length || 0} expired test users`);

    if (!expiredUsers || expiredUsers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expired test users found', deleted: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete each expired user from auth (cascade will handle profiles)
    const deletedUsers: string[] = [];
    for (const user of expiredUsers) {
      console.log(`Deleting user: ${user.full_name || user.user_id}`);
      
      const { error: deleteError } = await supabase.auth.admin.deleteUser(user.user_id);
      
      if (deleteError) {
        console.error(`Failed to delete user ${user.user_id}:`, deleteError);
      } else {
        deletedUsers.push(user.user_id);
      }
    }

    console.log(`Successfully deleted ${deletedUsers.length} test users`);

    return new Response(
      JSON.stringify({
        message: `Deleted ${deletedUsers.length} expired test users`,
        deleted: deletedUsers.length,
        userIds: deletedUsers,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Cleanup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
