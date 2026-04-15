export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,x-admin-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) return res.status(401).json({ error: 'غير مصرح' });
  const BID = process.env.JSONBIN_BIN_ID;
  const BK = process.env.JSONBIN_API_KEY;
  try {
    const r = await fetch(`https://api.jsonbin.io/v3/b/${BID}/latest`, { headers: { 'X-Master-Key': BK } });
    const d = await r.json();
    return res.status(200).json({ requests: (d.record && d.record.requests) ? d.record.requests : [] });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
