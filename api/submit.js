export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const BID = process.env.JSONBIN_BIN_ID;
  const BK = process.env.JSONBIN_API_KEY;
  if (!BID || !BK) return res.status(500).json({ error: 'Storage not configured' });
  const b = req.body;
  if (!b || !b.projectName || !b.requesterName) return res.status(400).json({ error: 'بيانات ناقصة' });
  try {
    const r1 = await fetch(`https://api.jsonbin.io/v3/b/${BID}/latest`, { headers: { 'X-Master-Key': BK } });
    const d1 = await r1.json();
    const list = (d1.record && d1.record.requests) ? d1.record.requests : [];
    const id = 'REQ-' + Date.now();
    list.unshift({ id, status: 'pending', submittedAt: new Date().toISOString(), ...b });
    await fetch(`https://api.jsonbin.io/v3/b/${BID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': BK },
      body: JSON.stringify({ requests: list.slice(0, 100) })
    });
    return res.status(200).json({ success: true, id });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
