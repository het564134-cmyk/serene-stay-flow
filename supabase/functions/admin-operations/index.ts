import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AdminRequest {
  action: 'clear_guests' | 'clear_rooms' | 'clear_all';
  password: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, password } = await req.json() as AdminRequest;

    // Validate required fields
    if (!action || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate action type
    if (!['clear_guests', 'clear_rooms', 'clear_all'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create admin client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify admin password from settings table
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'admin_password')
      .single();

    if (settingsError || !settings) {
      console.error('Failed to fetch admin password:', settingsError);
      return new Response(
        JSON.stringify({ error: 'Failed to verify credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password
    if (settings.value !== password) {
      return new Response(
        JSON.stringify({ error: 'Incorrect password' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Perform the requested action
    let message = '';

    if (action === 'clear_all' || action === 'clear_guests') {
      const { error: guestsError } = await supabaseAdmin
        .from('guests')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (guestsError) {
        console.error('Failed to clear guests:', guestsError);
        throw new Error('Failed to clear guest data');
      }
    }

    if (action === 'clear_all' || action === 'clear_rooms') {
      // First clear room assignments in guests (only needed if not clearing all)
      if (action === 'clear_rooms') {
        await supabaseAdmin
          .from('guests')
          .update({ room_id: null, room_number: null })
          .neq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { error: roomsError } = await supabaseAdmin
        .from('rooms')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      
      if (roomsError) {
        console.error('Failed to clear rooms:', roomsError);
        throw new Error('Failed to clear room data');
      }
    }

    switch (action) {
      case 'clear_guests':
        message = 'Guest data cleared successfully';
        break;
      case 'clear_rooms':
        message = 'Room data cleared successfully';
        break;
      case 'clear_all':
        message = 'All data cleared successfully';
        break;
    }

    return new Response(
      JSON.stringify({ success: true, message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Admin operation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
