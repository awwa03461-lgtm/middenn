// ============================================================
// FLAPPY MIDEN — Game Engine
// ============================================================

export class FlappyGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.state = 'idle';
        this.score = 0;
        this.frameCount = 0;
        this.bird = { x: 80, y: 280, width: 32, height: 24, velocity: 0, gravity: 0.45, jumpPower: -7.5, rotation: 0 };
        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 150;
        this.pipeSpeed = 2.2;
        this.pipeSpawnInterval = 90;
        this.groundY = this.height - 80;
        this.groundOffset = 0;
        this.onGameOver = null;
        this.onScore = null;
        this.handleInput = this.handleInput.bind(this);
        this.animationId = null;
        this.startTime = 0;
        this.endTime = 0;
    }
    start() {
        this.state = 'playing';
        this.score = 0;
        this.frameCount = 0;
        this.bird.y = 280;
        this.bird.velocity = 0;
        this.pipes = [];
        this.startTime = Date.now();
        document.addEventListener('keydown', this.handleInput);
        this.canvas.addEventListener('click', this.handleInput);
        this.canvas.addEventListener('touchstart', this.handleInput);
        this.loop();
    }
    stop() {
        if (this.animationId) { cancelAnimationFrame(this.animationId); this.animationId = null; }
        document.removeEventListener('keydown', this.handleInput);
        this.canvas.removeEventListener('click', this.handleInput);
        this.canvas.removeEventListener('touchstart', this.handleInput);
    }
    handleInput(e) {
        if (e.type === 'keydown' && e.code !== 'Space') return;
        if (e.preventDefault) e.preventDefault();
        if (this.state === 'playing') this.bird.velocity = this.bird.jumpPower;
    }
    update() {
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;
        this.bird.rotation = Math.max(-25, Math.min(70, this.bird.velocity * 4));
        if (this.bird.y + this.bird.height >= this.groundY) {
            this.bird.y = this.groundY - this.bird.height;
            this.gameOver(); return;
        }
        if (this.bird.y < 0) { this.bird.y = 0; this.bird.velocity = 0; }
        if (this.frameCount % this.pipeSpawnInterval === 0) this.spawnPipe();
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed;
            if (!pipe.scored && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.scored = true;
                this.score++;
                if (this.onScore) this.onScore(this.score);
            }
            if (this.checkCollision(pipe)) { this.gameOver(); return; }
            if (pipe.x + this.pipeWidth < 0) this.pipes.splice(i, 1);
        }
        this.groundOffset = (this.groundOffset + this.pipeSpeed) % 24;
        this.frameCount++;
    }
    spawnPipe() {
        const minTop = 60;
        const maxTop = this.groundY - this.pipeGap - 60;
        const topHeight = Math.random() * (maxTop - minTop) + minTop;
        this.pipes.push({ x: this.width, topHeight, bottomY: topHeight + this.pipeGap, scored: false });
    }
    checkCollision(pipe) {
        const b = this.bird;
        const margin = 4;
        const bx = b.x + margin, by = b.y + margin;
        const bw = b.width - margin * 2, bh = b.height - margin * 2;
        if (bx + bw > pipe.x && bx < pipe.x + this.pipeWidth) {
            if (by < pipe.topHeight || by + bh > pipe.bottomY) return true;
        }
        return false;
    }
    gameOver() {
        this.state = 'gameover';
        this.endTime = Date.now();
        if (this.onGameOver) this.onGameOver(this.score, this.startTime, this.endTime);
        this.stop();
    }
    draw() {
        const ctx = this.ctx;
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
        skyGrad.addColorStop(0, '#1a3a5c');
        skyGrad.addColorStop(0.6, '#2d5a8c');
        skyGrad.addColorStop(1, '#4ec0ca');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, this.groundY);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let i = 0; i < 30; i++) {
            const x = (i * 37 + this.frameCount * 0.1) % this.width;
            const y = (i * 23) % (this.groundY * 0.5);
            ctx.fillRect(x, y, 2, 2);
        }
        ctx.fillStyle = 'rgba(20, 30, 50, 0.6)';
        for (let i = 0; i < 8; i++) {
            const x = (i * 60 - this.frameCount * 0.2) % (this.width + 60);
            const h = 40 + (i * 17) % 60;
            ctx.fillRect(x, this.groundY - h, 50, h);
        }
        for (const pipe of this.pipes) this.drawPipe(pipe);
        ctx.fillStyle = '#ded895';
        ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
        ctx.fillStyle = '#c4b86e';
        for (let x = -this.groundOffset; x < this.width; x += 24) {
            ctx.fillRect(x, this.groundY, 12, 12);
            ctx.fillRect(x + 12, this.groundY + 12, 12, 12);
        }
        ctx.fillStyle = '#52a83a';
        ctx.fillRect(0, this.groundY - 4, this.width, 4);
        ctx.fillStyle = '#3d8429';
        ctx.fillRect(0, this.groundY, this.width, 3);
        this.drawBird();
    }
    drawPipe(pipe) {
        const ctx = this.ctx;
        const grad = ctx.createLinearGradient(pipe.x, 0, pipe.x + this.pipeWidth, 0);
        grad.addColorStop(0, '#5a8c2a');
        grad.addColorStop(0.4, '#a8d847');
        grad.addColorStop(0.6, '#a8d847');
        grad.addColorStop(1, '#3d6b1a');
        ctx.fillStyle = grad;
        ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
        ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.groundY - pipe.bottomY);
        ctx.fillStyle = '#5a8c2a';
        ctx.fillRect(pipe.x - 4, pipe.topHeight - 24, this.pipeWidth + 8, 24);
        ctx.fillRect(pipe.x - 4, pipe.bottomY, this.pipeWidth + 8, 24);
        ctx.fillStyle = '#a8d847';
        ctx.fillRect(pipe.x - 2, pipe.topHeight - 22, this.pipeWidth + 4, 18);
        ctx.fillRect(pipe.x - 2, pipe.bottomY + 4, this.pipeWidth + 4, 18);
        ctx.fillStyle = '#1a3a0a';
        ctx.fillRect(pipe.x, pipe.topHeight - 2, this.pipeWidth, 2);
        ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, 2);
    }
    drawBird() {
        const ctx = this.ctx;
        const b = this.bird;
        ctx.save();
        ctx.translate(b.x + b.width / 2, b.y + b.height / 2);
        ctx.rotate(b.rotation * Math.PI / 180);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(-16, -10, 28, 20);
        ctx.fillStyle = '#00b8c8';
        ctx.fillRect(-16, 4, 28, 6);
        const wingFlap = Math.sin(this.frameCount * 0.4) * 3;
        ctx.fillStyle = '#ffdc3d';
        ctx.fillRect(-10, -2 + wingFlap, 12, 8);
        ctx.fillStyle = '#d4b428';
        ctx.fillRect(-10, 4 + wingFlap, 12, 2);
        ctx.fillStyle = '#fff';
        ctx.fillRect(4, -8, 8, 8);
        ctx.fillStyle = '#000';
        ctx.fillRect(7, -6, 4, 4);
        ctx.fillStyle = '#ff8c00';
        ctx.fillRect(12, -2, 8, 6);
        ctx.fillStyle = '#cc6e00';
        ctx.fillRect(12, 2, 8, 2);
        ctx.fillStyle = '#0a1a2a';
        ctx.fillRect(-16, -10, 28, 1);
        ctx.fillRect(-16, 9, 28, 1);
        ctx.fillRect(-16, -10, 1, 20);
        ctx.fillRect(11, -10, 1, 20);
        ctx.restore();
    }
    loop() {
        if (this.state !== 'playing') return;
        this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.loop());
    }
    drawIdle() {
        const ctx = this.ctx;
        const skyGrad = ctx.createLinearGradient(0, 0, 0, this.groundY);
        skyGrad.addColorStop(0, '#1a3a5c');
        skyGrad.addColorStop(1, '#4ec0ca');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, this.width, this.groundY);
        ctx.fillStyle = '#ded895';
        ctx.fillRect(0, this.groundY, this.width, this.height - this.groundY);
        ctx.fillStyle = '#52a83a';
        ctx.fillRect(0, this.groundY - 4, this.width, 4);
    }
}


