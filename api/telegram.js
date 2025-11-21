export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { studentName, score, total, message, answers } = req.body;

    if (!studentName || score === undefined) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    // Get Telegram credentials from environment variables
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Check if credentials are configured
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.log('Telegram credentials not configured');
      return res.status(200).json({ 
        success: true, 
        message: 'Test completed (Telegram not configured)',
        demo: true
      });
    }

    // Create formatted message for Telegram
    const telegramMessage = `📝 *Passive Voice Test Result*

*Student:* ${studentName}
*Score:* ${score}/${total} (${((score/total)*100).toFixed(1)}%)

${message}`;

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const telegramResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: telegramMessage,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      })
    });

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      console.error('Telegram API error:', telegramData);
      return res.status(500).json({ 
        success: false,
        error: 'Failed to send message to Telegram',
        details: telegramData.description 
      });
    }

    console.log(`Test result sent to Telegram for student: ${studentName}, Score: ${score}/${total}`);
    
    res.status(200).json({ 
      success: true, 
      message: 'Results sent to Telegram successfully' 
    });

  } catch (error) {
    console.error('Error in Telegram handler:', error);
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: error.message 
    });
  }
}
