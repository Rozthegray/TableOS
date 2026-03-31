// ── TERMII SMS (Nigeria-optimized) ────────────────────────────────────────

const TERMII_API_KEY = process.env.TERMII_API_KEY || ''
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID || 'TableOS'
const TERMII_BASE_URL = 'https://api.ng.termii.com/api'

export async function sendSMS(to: string, message: string): Promise<boolean> {
  if (!TERMII_API_KEY) {
    console.warn('[SMS] TERMII_API_KEY not set — skipping SMS')
    return false
  }

  // Normalize Nigerian numbers
  const normalized = normalizeNigerianPhone(to)

  try {
    const res = await fetch(`${TERMII_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: normalized,
        from: TERMII_SENDER_ID,
        sms: message,
        type: 'plain',
        channel: 'generic',
        api_key: TERMII_API_KEY,
      }),
    })
    const data = await res.json()
    console.log('[SMS] Termii response:', data)
    return data.code === 'ok'
  } catch (err) {
    console.error('[SMS] Termii error:', err)
    return false
  }
}

// ── WHATSAPP via Termii ────────────────────────────────────────────────────
export async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  if (!TERMII_API_KEY) return false

  const normalized = normalizeNigerianPhone(to)
  try {
    const res = await fetch(`${TERMII_BASE_URL}/sms/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: normalized,
        from: TERMII_SENDER_ID,
        sms: message,
        type: 'plain',
        channel: 'whatsapp',
        api_key: TERMII_API_KEY,
      }),
    })
    const data = await res.json()
    return data.code === 'ok'
  } catch (err) {
    console.error('[WhatsApp] Termii error:', err)
    return false
  }
}

// ── SMS TEMPLATES ──────────────────────────────────────────────────────────
export const smsTemplates = {
  orderConfirmed: (orderNumber: string, name: string) =>
    `Hi ${name}! ✅ Your order #${orderNumber} has been confirmed at TableOS. We'll notify you when it's ready. Thank you!`,

  orderPreparing: (orderNumber: string) =>
    `🍳 Order #${orderNumber} is now being prepared by our kitchen. Shouldn't be long!`,

  orderReady: (orderNumber: string, type: string) =>
    type === 'pickup'
      ? `🔔 Order #${orderNumber} is READY for pickup! Please come collect it at the counter. TableOS`
      : `🔔 Order #${orderNumber} is ready and on its way to you! 🚚`,

  orderDelivered: (orderNumber: string) =>
    `✅ Order #${orderNumber} has been delivered. Enjoy your meal! Rate us at tableos.ng ⭐`,

  reservationConfirmed: (name: string, date: string, time: string, table: string) =>
    `Hi ${name}! 🪑 Your reservation at TableOS is confirmed for ${date} at ${time} — ${table}. See you then!`,

  reservationReminder: (name: string, time: string) =>
    `Hi ${name}! ⏰ Reminder: Your TableOS reservation is today at ${time}. We're looking forward to seeing you!`,

  workspaceConfirmed: (name: string, date: string, plan: string) =>
    `Hi ${name}! 💻 Your ${plan} workspace booking at TableOS is confirmed for ${date}. WiFi password will be given on arrival.`,
}

// ── HELPERS ────────────────────────────────────────────────────────────────
function normalizeNigerianPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, '')
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `234${cleaned.slice(1)}`
  }
  if (cleaned.startsWith('+234')) {
    return cleaned.slice(1)
  }
  return cleaned
}