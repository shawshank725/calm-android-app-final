// Supabase Edge Function to send push notifications
// Deploy this to Supabase: supabase functions deploy send-notification
// Note: This file uses Deno runtime (not Node.js), TypeScript errors are expected in VS Code

// @ts-ignore - Deno types not available in Node.js environment
/// <reference types="https://deno.land/x/types/index.d.ts" />

// @ts-ignore - Deno import
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

interface NotificationPayload {
  receiverId: string
  title: string
  body: string
  data?: Record<string, any>
}

serve(async (req: Request) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const { receiverId, title, body, data } = await req.json() as NotificationPayload

    // @ts-ignore - Deno runtime environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string
    // @ts-ignore - Deno runtime environment variables
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string

    const tokenResponse = await fetch(`${supabaseUrl}/rest/v1/push_tokens?user_id=eq.${receiverId}&select=push_token`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    })

    const tokens = await tokenResponse.json()

    if (!tokens || tokens.length === 0) {
      console.log('No push token found for user:', receiverId)
      return new Response(JSON.stringify({ message: 'No push token found' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const pushToken = tokens[0].push_token

    // Send push notification via Expo
    const pushNotification = {
      to: pushToken,
      sound: 'default',
      title: title,
      body: body,
      data: data || {},
      priority: 'high',
      channelId: 'default',
    }

    const expoPushResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([pushNotification]),
    })

    const expoPushResult = await expoPushResponse.json()
    console.log('Push notification sent:', expoPushResult)

    return new Response(JSON.stringify({ success: true, result: expoPushResult }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error sending push notification:', error)
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
