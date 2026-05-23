// /api/leaderboard.js - گرفتن لیست بهترین امتیازات
import { getLeaderboard } from './_lib/db.js';

export default async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const limit = parseInt(req.query.limit) || 20;
        const scores = await getLeaderboard(limit);
        
        res.status(200).json({ scores });
    } catch (err) {
        console.error('Leaderboard error:', err);
        res.status(500).json({ 
            error: 'Failed to fetch leaderboard',
            scores: []
        });
    }
}
