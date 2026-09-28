import { supabase } from '@/lib/supabase';

/**
 * Persist a push subscription to the database.
 *
 * The `endpoint` is unique — re-subscribing on the same browser
 * replaces the row rather than duplicating it.
 *
 * Called from the subscription hook after the browser issues a new
 * `PushSubscription`.
 */
export async function savePushSubscription(sub: PushSubscription): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('Not signed in.');

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error('Push subscription is missing required fields.');
  }

  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: uid,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent.slice(0, 500),
    },
    { onConflict: 'endpoint' },
  );

  if (error) throw new Error(error.message);
}

/**
 * Delete a subscription when the user disables notifications or
 * the browser invalidates it.
 */
export async function deletePushSubscription(endpoint: string): Promise<void> {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('endpoint', endpoint);

  if (error) throw new Error(error.message);
}