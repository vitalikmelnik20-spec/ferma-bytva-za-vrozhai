// Run once: node setup-telegram-bot.js
// Configures the Telegram bot to open the game as a Web App via the menu button

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8836148371:AAElJhWPcxJXH7-3YSKXlQ9GBHvl8kaXAlA';
const GAME_URL  = 'https://ferma-bytva-za-vrozhai-production.up.railway.app/game';

async function call(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  console.log(`${method}:`, JSON.stringify(data, null, 2));
  return data;
}

(async () => {
  // Set menu button (hamburger button in chat header) to open the Web App
  await call('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text: '🌾 Грати',
      web_app: { url: GAME_URL }
    }
  });

  // Set bot description shown to new users
  await call('setMyDescription', {
    description: '🌾 ФЕРМА: Битва за врожай — вирощуй рослини, воюй з ворогами, розвивай своє місто!'
  });

  // Set short description shown in search
  await call('setMyShortDescription', {
    short_description: 'RPG-фермерська гра прямо в Telegram'
  });

  console.log('\n✅ Бот налаштований! Тепер у чаті бота з\'явиться кнопка "🌾 Грати".');
})();
