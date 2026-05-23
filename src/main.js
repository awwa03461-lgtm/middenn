// ============================================================
// FLAPPY MIDEN — Main App Controller
// ============================================================

import { FlappyGame } from './game.js';
import { MidenWallet } from './miden.js';

const $ = (id) => document.getElementById(id);

class App {
    constructor() {
        this.canvas = $('gameCanvas');
        this.game = new FlappyGame(this.canvas);
        this.wallet = new MidenWallet();
        
        this.currentScore = 0;
        this.highScore = 0;
        this.gameStartTime = 0;
        this.gameEndTime = 0;
        
        this.bindEvents();
        this.bindGameCallbacks();
        this.game.drawIdle();
        
        // شروع به مقداردهی Miden
        this.initialize();
    }
    
    bindEvents() {
        $('connectBtn').addEventListener('click', () => this.connectWallet());
        $('startBtn').addEventListener('click', () => this.startGame());
        $('restartBtn').addEventListener('click', () => this.startGame());
        $('submitBtn').addEventListener('click', () => this.submitScore());
        $('successCloseBtn').addEventListener('click', () => {
            this.hideAllOverlays();
            $('startScreen').classList.remove('overlay-hidden');
            this.game.drawIdle();
        });
        
        // Export/Import
        $('exportBtn').addEventListener('click', () => this.showExportModal());
        $('importBtn').addEventListener('click', () => this.showImportModal());
        $('closeExportBtn').addEventListener('click', () => $('exportModal').classList.add('modal-hidden'));
        $('closeImportBtn').addEventListener('click', () => $('importModal').classList.add('modal-hidden'));
        $('downloadWalletBtn').addEventListener('click', () => this.downloadWallet());
        $('confirmImportBtn').addEventListener('click', () => this.importWallet());
        
        // Faucet
        $('copyAddrBtn').addEventListener('click', () => {
            navigator.clipboard.writeText(this.wallet.address);
            $('copyAddrBtn').textContent = 'COPIED!';
            setTimeout(() => { $('copyAddrBtn').textContent = 'COPY'; }, 2000);
        });
        $('checkBalanceBtn').addEventListener('click', () => this.checkBalance());
    }
    
    bindGameCallbacks() {
        this.game.onScore = (score) => {
            this.currentScore = score;
            $('ingameScore').textContent = score;
        };
        this.game.onGameOver = (finalScore, startTime, endTime) => {
            this.gameStartTime = startTime;
            this.gameEndTime = endTime;
            this.showGameOver(finalScore);
        };
    }
    
    /**
     * مقداردهی اولیه Miden SDK
     */
    async initialize() {
        try {
            $('loadingStatus').textContent = 'Initializing Web SDK...';
            
            const address = await this.wallet.initialize((msg) => {
                $('loadingStatus').textContent = msg;
            });
            
            // آپدیت UI
            $('walletStatus').classList.add('connected');
            $('walletText').textContent = 'CONNECTED';
            $('connectBtn').textContent = this.wallet.shortAddress(address);
            $('connectBtn').disabled = true;
            $('exportBtn').style.display = 'inline-block';
            $('importBtn').style.display = 'inline-block';
            $('statAddress').textContent = this.wallet.shortAddress(address);
            
            // پنهان کردن loading
            $('loadingScreen').classList.add('overlay-hidden');
            $('startScreen').classList.remove('overlay-hidden');
            
            // بررسی موجودی
            const hasTokens = await this.wallet.hasTokens();
            if (!hasTokens) {
                console.log('No tokens yet. User needs faucet.');
                // به کاربر اطلاع می‌دیم وقتی می‌خواد submit کنه
            }
            
            await this.refreshStats();
            await this.refreshLeaderboard();
            
        } catch (err) {
            console.error('Init error:', err);
            $('loadingStatus').textContent = '❌ ' + err.message;
            $('loadingStatus').style.color = '#ff4949';
        }
    }
    
    async connectWallet() {
        // وقتی initialize کامل می‌شه، wallet خودکار وصله
        if (!this.wallet.ready) {
            alert('Miden SDK is still loading. Please wait...');
            return;
        }
        await this.refreshStats();
    }
    
    startGame() {
        if (!this.wallet.connected) {
            alert('Wallet not ready yet!');
            return;
        }
        this.hideAllOverlays();
        $('ingameScore').classList.add('show');
        $('ingameScore').textContent = '0';
        this.currentScore = 0;
        this.game.start();
    }
    
    showGameOver(finalScore) {
        $('ingameScore').classList.remove('show');
        $('finalScore').textContent = finalScore;
        const isNewRecord = finalScore > this.highScore && finalScore > 0;
        $('newRecordBanner').style.display = isNewRecord ? 'block' : 'none';
        $('submitBtn').disabled = (finalScore === 0);
        $('gameOverScreen').classList.remove('overlay-hidden');
    }
    
    async submitScore() {
        if (this.currentScore === 0) return;
        
        $('gameOverScreen').classList.add('overlay-hidden');
        $('txScreen').classList.remove('overlay-hidden');
        const statusEl = $('txStatus');
        
        try {
            // validate سمت سرور
            statusEl.textContent = 'Validating score...';
            const validateRes = await fetch('/api/validate-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score: this.currentScore,
                    address: this.wallet.address,
                    gameStartTime: this.gameStartTime,
                    gameEndTime: this.gameEndTime
                })
            });
            
            if (!validateRes.ok) {
                const err = await validateRes.json();
                throw new Error(err.reason || 'Score validation failed');
            }
            
            // ارسال تراکنش روی Miden testnet
            statusEl.textContent = 'Generating ZK proof... (10-30s)';
            
            const result = await this.wallet.submitScore(this.currentScore);
            
            // ذخیره در DB سرور
            statusEl.textContent = 'Recording on server...';
            await fetch('/api/record-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address: this.wallet.address,
                    score: this.currentScore,
                    txHash: result.txHash
                })
            });
            
            // نمایش موفقیت
            $('txScreen').classList.add('overlay-hidden');
            $('txHashDisplay').textContent = result.txHash;
            $('explorerLink').href = this.wallet.getExplorerUrl(result.txHash);
            $('successScreen').classList.remove('overlay-hidden');
            
            await this.refreshStats();
            await this.refreshLeaderboard();
            
        } catch (err) {
            $('txScreen').classList.add('overlay-hidden');
            
            if (err.message === 'NO_TOKENS') {
                // باید توکن از faucet بگیره
                $('faucetAddress').textContent = this.wallet.address;
                $('needFaucetScreen').classList.remove('overlay-hidden');
            } else {
                $('gameOverScreen').classList.remove('overlay-hidden');
                alert('Error: ' + err.message);
            }
        }
    }
    
    async checkBalance() {
        const btn = $('checkBalanceBtn');
        btn.disabled = true;
        btn.textContent = 'CHECKING...';
        
        try {
            await this.wallet.sync();
            const hasTokens = await this.wallet.hasTokens();
            
            if (hasTokens) {
                btn.textContent = '✓ TOKENS RECEIVED';
                setTimeout(() => {
                    $('needFaucetScreen').classList.add('overlay-hidden');
                    // برگرد و دوباره submit کن
                    this.submitScore();
                }, 1500);
            } else {
                btn.disabled = false;
                btn.textContent = 'NOT YET — TRY AGAIN';
                setTimeout(() => {
                    btn.textContent = "I'VE GOT TOKENS — CHECK";
                }, 2000);
            }
        } catch (err) {
            btn.disabled = false;
            btn.textContent = 'ERROR — RETRY';
            console.error(err);
        }
    }
    
    showExportModal() {
        $('exportModal').classList.remove('modal-hidden');
    }
    
    showImportModal() {
        $('importModal').classList.remove('modal-hidden');
    }
    
    async downloadWallet() {
        try {
            const jsonData = await this.wallet.exportWallet();
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `flappy-miden-wallet-${Date.now()}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            $('exportModal').classList.add('modal-hidden');
        } catch (err) {
            alert('Export failed: ' + err.message);
        }
    }
    
    async importWallet() {
        const fileInput = $('walletFileInput');
        if (!fileInput.files.length) {
            alert('Please select a wallet file first');
            return;
        }
        
        const btn = $('confirmImportBtn');
        btn.disabled = true;
        btn.textContent = 'IMPORTING...';
        
        try {
            const file = fileInput.files[0];
            const text = await file.text();
            
            const newAddress = await this.wallet.importWallet(text);
            
            $('importModal').classList.add('modal-hidden');
            $('connectBtn').textContent = this.wallet.shortAddress(newAddress);
            $('statAddress').textContent = this.wallet.shortAddress(newAddress);
            
            await this.refreshStats();
            await this.refreshLeaderboard();
            
            alert('Wallet imported successfully!');
        } catch (err) {
            alert('Import failed: ' + err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'IMPORT';
        }
    }
    
    async refreshStats() {
        if (!this.wallet.connected) return;
        
        try {
            const res = await fetch(`/api/stats/${encodeURIComponent(this.wallet.address)}`);
            const data = await res.json();
            
            this.highScore = data.highScore || 0;
            $('statHighScore').textContent = data.highScore || 0;
            $('statGames').textContent = data.gamesPlayed || 0;
            
            const lbRes = await fetch('/api/leaderboard');
            const lbData = await lbRes.json();
            const global = lbData.scores?.length ? lbData.scores[0].score : 0;
            $('statGlobal').textContent = global || '—';
            
        } catch (err) {
            console.error('Stats error:', err);
        }
    }
    
    async refreshLeaderboard() {
        const list = $('leaderboardList');
        try {
            const res = await fetch('/api/leaderboard');
            const data = await res.json();
            const scores = data.scores || [];
            
            if (!scores.length) {
                list.innerHTML = '<div class="lb-item lb-empty"><span>No scores yet.</span></div>';
                return;
            }
            
            list.innerHTML = scores.map((s, i) => {
                const rank = i + 1;
                const rankClass = rank === 1 ? 'lb-top1' : rank === 2 ? 'lb-top2' : rank === 3 ? 'lb-top3' : '';
                const medal = rank === 1 ? '★' : rank === 2 ? '☆' : rank === 3 ? '◇' : `#${rank}`;
                return `<div class="lb-item ${rankClass}">
                    <span class="lb-rank">${medal}</span>
                    <span class="lb-addr">${this.wallet.shortAddress(s.address)}</span>
                    <span class="lb-score">${s.score}</span>
                </div>`;
            }).join('');
        } catch (err) {
            console.error('Leaderboard error:', err);
        }
    }
    
    hideAllOverlays() {
        ['loadingScreen', 'startScreen', 'needFaucetScreen', 'gameOverScreen', 'txScreen', 'successScreen']
            .forEach(id => {
                const el = $(id);
                if (el) el.classList.add('overlay-hidden');
            });
    }
}

window.addEventListener('DOMContentLoaded', () => { window.app = new App(); });

// cleanup on unload
window.addEventListener('beforeunload', () => {
    if (window.app && window.app.wallet) {
        window.app.wallet.terminate();
    }
});
