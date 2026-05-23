// /api/stats/[address].js - آمار یک کاربر خاص
import { getUserScores, getGlobalHighScore } from '../_lib/db.js';

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
        const { address } = req.query;
        
        if (!address) {
            return res.status(400).json({ error: 'Missing address' });
        }
        
        const userScores = await getUserScores(address);
        const highScore = userScores.length 
            ? Math.max(...userScores.map(s => s.score)) 
            : 0;
        
        res.status(200).json({
            gamesPlayed: userScores.length,
            highScore: highScore,
            recentGames: userScores.slice(0, 5).map(s => ({
                score: s.score,
                txHash: s.tx_hash,
                timestamp: new Date(s.created_at).getTime()
            }))
        });
    } catch (err) {
        console.error('Stats error:', err);
        res.status(500).json({
            error: 'Failed to fetch stats',
            gamesPlayed: 0,
            highScore: 0,
            recentGames: []
        });
    }
}
