/** Заглушка Telegram — заменить на Bot API */

export async function notifyTelegramStub(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.info('[telegram:stub]', text);
    return { ok: true, mode: 'log' };
  }
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  if (!r.ok) throw new Error(`telegram http ${r.status}`);
  return { ok: true, mode: 'sent' };
}
