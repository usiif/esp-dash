// src/routes/api/support/+server.js
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export async function POST({ request }) {
  try {
    const { category, subject, message, userName, userEmail, userId } = await request.json();

    if (!category || !subject || !subject.trim() || !message || !message.trim()) {
      return json({ error: 'Category, subject and message are required' }, { status: 400 });
    }

    // Get n8n webhook URL from environment variable
    const webhookUrl = env.N8N_SUPPORT_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('N8N_SUPPORT_WEBHOOK_URL not configured');
      return json({ error: 'Support system not configured' }, { status: 500 });
    }

    // Send to n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: category,
        subject: subject.trim(),
        message: message.trim(),
        userName: userName || 'Unknown User',
        userEmail: userEmail || '',
        userId: userId || '',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      console.error('N8N webhook request failed:', response.status);
      return json({ error: 'Failed to send message' }, { status: 500 });
    }

    console.log('Support message sent successfully to n8n');

    // Return success
    return json({
      success: true,
      message: 'Message sent successfully'
    });

  } catch (err) {
    console.error('Error in support API:', err);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
