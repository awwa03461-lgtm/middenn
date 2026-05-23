// /api/health.js - چک سلامتی سرور
export default function handler(req, res) {
    res.status(200).json({
        status: 'ok',
        timestamp: Date.now(),
        version: '1.0.0',
        platform: 'vercel'
    });
}
