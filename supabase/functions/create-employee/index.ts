// Supabase Edge Function: create-employee
//
// Only callable by an authenticated super_admin.
// Creates a Supabase Auth user (which triggers profile creation via
// handle_new_user), then fills in role, department, and scope fields.
//
// The service role key is provided by Supabase automatically to Edge
// Functions and is NEVER exposed to the client.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Role = 'super_admin' | 'sub_admin' | 'employee';

interface CreateEmployeeBody {
  email: string;
  password: string;
  full_name: string;
  role: Role;
  department?: string | null;
  managed_departments?: string[];
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function fail(message: string, status = 400): Response {
  return json({ error: message }, status);
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return fail('Method not allowed', 405);
  }

  try {
    // ---- 1. Auth ---------------------------------------------------------
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return fail('Missing or malformed Authorization header', 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return fail('Server misconfigured: missing Supabase env', 500);
    }

    // Caller-scoped client — validated via the JWT in the request.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) {
      return fail('Unauthorized', 401);
    }

    // ---- 2. Authorization ------------------------------------------------
    const { data: callerProfile, error: profileError } = await userClient
      .from('profiles')
      .select('role, active')
      .eq('id', userData.user.id)
      .single();

    if (profileError || !callerProfile) {
      return fail('Caller profile not found', 403);
    }
    if (callerProfile.role !== 'super_admin' || !callerProfile.active) {
      return fail('Forbidden: super admin only', 403);
    }

    // ---- 3. Input validation --------------------------------------------
    const body = (await req.json()) as Partial<CreateEmployeeBody>;

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    const full_name = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const role: Role =
      body.role === 'super_admin' || body.role === 'sub_admin' || body.role === 'employee'
        ? body.role
        : 'employee';
    const department =
      typeof body.department === 'string' && body.department.trim().length > 0
        ? body.department.trim()
        : null;
    const managed_departments = Array.isArray(body.managed_departments)
      ? body.managed_departments.filter((d): d is string => typeof d === 'string')
      : [];

    if (!isValidEmail(email)) return fail('Invalid email address');
    if (password.length < 8) return fail('Password must be at least 8 characters');
    if (full_name.length < 2) return fail('Full name is required');

    // ---- 4. Create the auth user ----------------------------------------
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // skip email verification for admin-provisioned accounts
      user_metadata: { full_name },
    });

    if (createError || !created.user) {
      return fail(createError?.message ?? 'Failed to create user', 400);
    }

    // ---- 5. Fill in profile fields the trigger couldn't know -------------
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        full_name,
        role,
        department,
        managed_departments,
      })
      .eq('id', created.user.id);

    if (updateError) {
      // Rollback: remove the auth user we just created so we don't
      // leave a half-formed account behind.
      await adminClient.auth.admin.deleteUser(created.user.id);
      return fail(`Profile update failed: ${updateError.message}`, 500);
    }

    // ---- 6. Done ---------------------------------------------------------
    return json(
      {
        user: {
          id: created.user.id,
          email: created.user.email,
          role,
          department,
        },
      },
      201,
    );
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Internal server error', 500);
  }
});