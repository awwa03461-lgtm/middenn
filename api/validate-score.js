// /api/validate-score.js - validation امتیاز برای anti-cheat
import crypto from 'crypto';

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
        const { score, address, gameStartTime, gameEndTime } = req.body || {};
        
        // ولیدیشن‌های پایه
        if (typeof score !== 'number' || score < 0 || score > 9999) {
            return res.status(400).json({ valid: false, reason: 'Invalid score' });
        }
        
        if (!address || typeof address !== 'string') {
            return res.status(400).json({ valid: false, reason: 'Invalid address' });
        }
        
        // بررسی زمان: هر امتیاز حداقل ۰.۵ ثانیه طول می‌کشه
        if (gameStartTime && gameEndTime) {
            const duration = (gameEndTime - gameStartTime) / 1000;
            const minDuration = score * 0.5;
            
            if (duration < minDuration) {
                return res.status(400).json({
                    valid: false,
                    reason: 'بازی خیلی سریع تموم شده'
                });
            }
        }
        
        // ساخت signature
        const secret = process.env.SCORE_SECRET || 'default-secret-change-me';
        const message = `${address}:${score}:${Date.now()}`;
        const signature = crypto
            .createHmac('sha256', secret)
            .update(message)
            .digest('hex');
        
        res.status(200).json({
            valid: true,
            signature,
            message,
            timestamp: Date.now()
        });
    } catch (err) {
        console.error('Validate error:', err);
        res.status(500).json({ valid: false, reason: 'Server error' });
    }
}
