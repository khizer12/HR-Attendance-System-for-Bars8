import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

interface NoticeRow {
  id: string;
  title: string;
  body: string;
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();

    if (payload.type !== 'INSERT' || !payload.record) {
      return new Response('Not an INSERT — ignoring', { status: 200 });
    }

    const notice: NoticeRow = payload.record;

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
      .select('id, user_id, endpoint, p256dh, auth');

    if (subsError) {
      return new Response(`Failed to load subs: ${subsError.message}`, { status: 500 });
    }

    if (!subs || subs.length === 0) {
      return new Response('No subscriptions', { status: 200 });
    }

    const pushPayload = JSON.stringify({
      title: `Notice: ${notice.title}`,
      body: notice.body.slice(0, 180),
      icon: '/favicon.svg',
      tag: `notice-${notice.id}`,
      data: { url: '/notices' },
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