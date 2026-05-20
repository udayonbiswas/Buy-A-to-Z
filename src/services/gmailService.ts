/**
 * Gmail Service for interacting with Google Gmail API
 */

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
}

export const fetchGmailMessages = async (accessToken: string, maxResults = 10): Promise<GmailMessage[]> => {
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch Gmail messages');
  }

  const data = await response.json();
  if (!data.messages) return [];

  // Fetch details for each message
  const messages = await Promise.all(
    data.messages.map(async (msg: { id: string }) => {
      const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const detail = await detailRes.json();
      
      const headers = detail.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === 'Subject')?.value;
      const from = headers.find((h: any) => h.name === 'From')?.value;
      const date = headers.find((h: any) => h.name === 'Date')?.value;

      return {
        id: detail.id,
        threadId: detail.threadId,
        snippet: detail.snippet,
        subject,
        from,
        date,
      };
    })
  );

  return messages;
};

export const sendGmailMessage = async (accessToken: string, to: string, subject: string, body: string) => {
  // Construct RFC 2822 message
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    `Subject: ${utf8Subject}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    '',
    body,
  ];
  const message = messageParts.join('\n');

  // The body needs to be base64url encoded
  const encodedMessage = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMessage,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to send Gmail message');
  }

  return response.json();
};
