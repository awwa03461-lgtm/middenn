// /api/_lib/db.js - کلاینت Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️  SUPABASE_URL and SUPABASE_KEY must be set in environment variables');
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '');

// ============================================================
// عملیات روی دیتابیس
// ============================================================

/**
 * اضافه کردن یک امتیاز جدید
 */
export async function addScore(address, score, txHash) {
    const { data, error } = await supabase
        .from('scores')
        .insert([{
            address,
            score: Number(score),
            tx_hash: txHash,
            created_at: new Date().toISOString()
        }])
        .select();
    
    if (error) throw error;
    return data;
}

/**
 * گرفتن همه امتیازات یک کاربر
 */
export async function getUserScores(address) {
    const { data, error } = await supabase
        .from('scores')
        .select('*')
        .eq('address', address)
        .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
}

/**
 * گرفتن leaderboard (بهترین امتیاز هر کاربر)
 */
export async function getLeaderboard(limit = 20) {
    // گرفتن همه امتیازات و گروه‌بندی توی کد
    // (Supabase free distinct on نداره)
    const { data, error } = await supabase
        .from('scores')
        .select('*')
        .order('score', { ascending: false })
        .limit(500); // حداکثر ۵۰۰ رکورد آخر رو بخون
    
    if (error) throw error;
    
    const best = {};
    (data || []).forEach(row => {
        if (!best[row.address] || row.score > best[row.address].score) {
            best[row.address] = row;
        }
    });
    
    return Object.values(best)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(row => ({
            address: row.address,
            score: row.score,
            txHash: row.tx_hash,
            timestamp: new Date(row.created_at).getTime()
        }));
}

/**
 * گرفتن global high score
 */
export async function getGlobalHighScore() {
    const { data, error } = await supabase
        .from('scores')
        .select('score')
        .order('score', { ascending: false })
        .limit(1);
    
    if (error) throw error;
    return data && data.length ? data[0].score : 0;
}
