import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

interface WebhookBody {
  /** Which table triggered this — 'notices' or 'leave_requests'. */
  source: 'notices' | 'leave_requests';
  /** Row ID from the source table — used as the tag for dedup. */
  record_id: string;
  /** Explicit list of user IDs to notify. */
  target_user_ids: string[];
  /** Content of the notification. */
  payload: PushPayload;
}

Deno.serve(async (req) => {
  try {
    const body: WebhookBody = await req.json();

    if (!body.target_user_ids || body.target_user_ids.length === 0) {
      return new Response('No targets', { status: 200 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY');
    const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidSubject = Deno.env.get('VAPID_SUBJECT');

    if (!supabaseUrl || !serviceRoleKey || !vapidPublic || !vapidPrivate || !vapidSubject) {
      return new Response('Server misconfigured: missing env', { status: 500 });
    }

    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: subs, error: subsError } = await admin
      .from('push_subscriptions')
      .select('id, user_id, endpoint, p256dh, auth')
      .in('user_id', body.target_user_ids);

    if (subsError) {
      return new Response(`Failed to load subs: ${subsError.message}`, { status: 500 });
    }

    if (!subs || subs.length === 0) {
      return new Response('No subscriptions for targets', { status: 200 });
    }

    const pushPayload = JSON.stringify({
      title: body.payload.title,
      body: body.payload.body,
      icon: '/favicon.svg',
      tag: body.payload.tag ?? `${body.source}-${body.record_id}`,
      data: { url: body.payload.url ?? '/dashboard' },
    });

    const deadIds: string[] = [];
    let delivered = 0;
    let failed = 0;

    await Promise.all(
      subs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            pushPayload,
          );
          delivered++;
        } catch (err) {
          failed++;
          const code =
            typeof err === 'object' && err !== null && 'statusCode' in err
              ? (err as { statusCode: number }).statusCode
              : 0;
          if (code === 404 || code === 410) deadIds.push(sub.id);
        }
      }),
    );

    if (deadIds.length > 0) {
      await admin.from('push_subscriptions').delete().in('id', deadIds);
    }

    return new Response(
      JSON.stringify({ delivered, failed, pruned: deadIds.length }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});