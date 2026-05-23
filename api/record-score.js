// /api/record-score.js - ثبت تراکنش بعد از موفقیت
import { addScore } from './_lib/db.js';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { address, score, txHash } = req.body || {};
        
        if (!address || score === undefined || !txHash) {
            return res.status(400).json({ success: false, error: 'Missing fields' });
        }
        
        await addScore(address, score, txHash);
        
        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Record error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
}
