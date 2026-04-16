// Public endpoint - returns only generated reports (no admin key needed)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const BID = process.env.JSONBIN_BIN_ID;
  const BK  = process.env.JSONBIN_API_KEY;
  try {
    const r = await fetch(`https://api.jsonbin.io/v3/b/${BID}/latest`, {
      headers: { 'X-Master-Key': BK }
    });
    const d = await r.json();
    const all = (d.record && d.record.requests) ? d.record.requests : [];
    // Only return generated reports (strip raw AI text for security)
    const pub = all
      .filter(r => r.status === 'generated')
      .map(r => ({
        id: r.id,
        projectName: r.projectName,
        projectType: r.projectType,
        location: r.location,
        requesterName: r.requesterName,
        department: r.department,
        fiscalYear: r.fiscalYear,
        beneficiary: r.beneficiary,
        duration: r.duration,
        description: r.description,
        justification: r.justification,
        reviewedAt: r.reviewedAt,
        generatedData: r.generatedData
      }));
    return res.status(200).json({ requests: pub });
  } catch(e) {
    return res.status(500).json({ error: e.message });
  }
}
