export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, mode } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });

  try {
    const jinaUrl = 'https://r.jina.ai/' + url;
    const jinaRes = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'markdown',
        'X-Timeout': '15',
      }
    });

    if (!jinaRes.ok) {
      return res.status(200).json({ title: '', content: '', error: 'fetch failed' });
    }

    const text = await jinaRes.text();
    if (!text || text.length < 50) {
      return res.status(200).json({ title: '', content: '', error: 'empty content' });
    }

    // Parse title from first non-empty line
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    const titleLine = lines[0] || '';
    const title = titleLine.replace(/^#+\s*/, '').replace(/^Title:\s*/i, '').trim().slice(0, 100);

    if (mode === 'title-only') {
      return res.status(200).json({ title, content: '' });
    }

    // Full content for AI analysis
    const content = '标题：' + title + '\n\n正文：' + lines.slice(1).join('\n').slice(0, 4000);
    return res.status(200).json({ title, content });

  } catch (e) {
    return res.status(200).json({ title: '', content: '', error: e.message });
  }
}
