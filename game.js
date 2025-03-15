/**
 * 创建难度选择按钮
 * @param {Function} callback - 点击按钮后的回调函数
 * @returns {HTMLElement} 包含难度按钮的容器
 */
function createDifficultyButtons(callback) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.gap = '10px';
    container.style.justifyContent = 'center';
    container.style.alignItems = 'flex-start';
    container.style.width = '100%';
    container.style.maxWidth = '100%';
    container.style.padding = '0 10px';
    container.style.boxSizing = 'border-box';

    // 创建难度按钮的函数
    const createDifficultySection = (text, difficulty, instructions) => {
        const section = document.createElement('div');
        section.style.display = 'flex';
        section.style.flexDirection = 'column';
        section.style.alignItems = 'center';
        section.style.flex = '1';
        section.style.minWidth = '0';
        section.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        section.style.padding = '10px';
        section.style.borderRadius = '8px';

        // 按钮
        const button = document.createElement('button');
        button.textContent = text;
        button.style.padding = '8px 12px';
        button.style.fontSize = '14px';
        button.style.cursor = 'pointer';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.transition = 'all 0.3s ease';
        button.style.width = '100%';
        button.style.marginBottom = '8px';

        button.onmouseover = () => {
            button.style.backgroundColor = '#45a049';
            button.style.transform = 'translateY(-2px)';
        };

        button.onmouseout = () => {
            button.style.backgroundColor = '#4CAF50';
            button.style.transform = 'translateY(0)';
        };

        button.onclick = () => callback(difficulty);

        // 说明文字
        const desc = document.createElement('div');
        desc.style.color = 'white';
        desc.style.fontSize = '12px';
        desc.style.lineHeight = '1.3';
        desc.style.textAlign = 'left';
        desc.style.width = '100%';
        desc.style.wordBreak = 'break-word';
        desc.innerHTML = instructions.map(line => `• ${line}`).join('<br>');

        section.appendChild(button);
        section.appendChild(desc);
        return section;
    };

    // 添加各难度级别及其说明
    container.appendChild(createDifficultySection('简单', 'easy', [
        '方向键或触摸控制移动',
        '吃掉小鱼成长，躲避大鱼',
        '白色珍珠可快速增大'
    ]));

    container.appendChild(createDifficultySection('中等', 'medium', [
        '方向键或触摸控制移动',
        '吃掉小鱼成长，躲避大鱼',
        '白色珍珠可快速增大',
        '需躲避岩石和海草'
    ]));

    container.appendChild(createDifficultySection('困难', 'hard', [
        '方向键或触摸控制移动',
        '吃掉小鱼成长，躲避大鱼',
        '白色珍珠可快速增大',
        '需躲避岩石和海草',
        '当心海草释放的气泡'
    ]));

    return container;
}

/**
 * 游戏主类
 */
class Game {
    /**
     * 初始化游戏
     * @param {string} difficulty - 游戏难度：'easy', 'medium', 'hard'
     */
    constructor(difficulty = 'medium') {
        // 如果已经存在游戏实例，先销毁它
        if (window.gameInstance) {
            window.gameInstance.destroy();
            window.gameInstance = null;
        }

        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.size = 1;
        this.gameOver = false;
        this.difficulty = difficulty;
        this.animationFrameId = null;
        this.giftIntervalId = null;
        this.bubbleIntervalId = null;
        this.keys = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            ArrowDown: false
        };

        // 设置画布大小为屏幕大小
        this.resizeCanvas();

        // 移动控制状态
        this.touchControls = {
            active: false,
            startX: 0,
            startY: 0,
            moveX: 0,
            moveY: 0
        };

        // 波浪参数
        this.waveTime = 0;
        this.waveAmplitude = 20;
        this.waveFrequency = 0.02;

        // 礁石参数
        this.rocks = this.generateRocks();

        // 海草参数
        this.seaweeds = this.generateSeaweeds();

        // 气泡参数（困难模式）
        this.bubbles = [];

        // 玩家鱼
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            size: 20,
            speed: 5,
            direction: 0
        };

        // 其他鱼
        this.fishes = [];
        this.generateFishes(10);

        // 大礼包
        this.gift = null;
        this.giftTimeout = null;

        // 绑定事件
        this.bindEvents();

        // 开始游戏循环
        this.startGameLoop();

        // 开始生成大礼包
        this.startGiftGeneration();

        // 如果是困难模式，开始生成气泡
        if (this.difficulty === 'hard') {
            this.startBubbleGeneration();
        }

        // 更新分数显示
        this.updateScore();

        window.gameInstance = this;
    }

    /**
     * 销毁游戏实例
     */
    destroy() {
        // 停止游戏循环
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // 清除所有定时器
        if (this.giftIntervalId) {
            clearInterval(this.giftIntervalId);
            this.giftIntervalId = null;
        }
        if (this.bubbleIntervalId) {
            clearInterval(this.bubbleIntervalId);
            this.bubbleIntervalId = null;
        }
        if (this.giftTimeout) {
            clearTimeout(this.giftTimeout);
            this.giftTimeout = null;
        }

        // 移除事件监听器
        window.removeEventListener('resize', this.resizeCanvas.bind(this));

        // 移除键盘事件监听器
        if (this.handleKeyDown) {
            document.removeEventListener('keydown', this.handleKeyDown);
        }
        if (this.handleKeyUp) {
            document.removeEventListener('keyup', this.handleKeyUp);
        }

        // 移除触摸事件监听器
        if (this.canvas) {
            this.canvas.removeEventListener('touchstart', this.handleStart);
            this.canvas.removeEventListener('touchmove', this.handleMove);
            this.canvas.removeEventListener('touchend', this.handleEnd);
            this.canvas.removeEventListener('touchcancel', this.handleEnd);
            this.canvas.removeEventListener('mousedown', this.handleStart);
            this.canvas.removeEventListener('mousemove', this.handleMove);
            this.canvas.removeEventListener('mouseup', this.handleEnd);
            this.canvas.removeEventListener('mouseleave', this.handleEnd);
        }

        // 重置游戏状态
        this.score = 0;
        this.size = 1;
        this.gameOver = true;
        this.fishes = [];
        this.gift = null;
        this.bubbles = [];
        this.touchControls = {
            active: false,
            startX: 0,
            startY: 0,
            moveX: 0,
            moveY: 0
        };

        // 更新分数显示
        this.updateScore();

        // 清空画布
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    /**
     * 调整画布大小
     */
    resizeCanvas() {
        const maxWidth = 800;
        const maxHeight = 600;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        if (windowWidth <= maxWidth) {
            this.canvas.width = windowWidth;
            this.canvas.height = windowHeight * 0.8; // 留出空间给控制器
        } else {
            this.canvas.width = maxWidth;
            this.canvas.height = maxHeight;
        }

        // 调整玩家位置到新的画布中心
        if (this.player) {
            this.player.x = this.canvas.width / 2;
            this.player.y = this.canvas.height / 2;
        }
    }

    /**
     * 生成礁石
     * @returns {Array} 礁石数组
     */
    generateRocks() {
        const rocks = [];
        const rockCount = 2; // 减少到两个大岩石

        for (let i = 0; i < rockCount; i++) {
            const width = 150 + Math.random() * 50; // 更大的宽度
            const height = 60 + Math.random() * 40; // 更大的高度
            const x = (this.canvas.width / (rockCount + 1)) * (i + 1);

            rocks.push({
                x: x,
                y: this.canvas.height - height,
                width: width,
                height: height,
                points: this.generateRockPoints(width, height)
            });
        }

        return rocks;
    }

    /**
     * 生成礁石的点
     * @param {number} width - 礁石宽度
     * @param {number} height - 礁石高度
     * @returns {Array} 礁石的点数组
     */
    generateRockPoints(width, height) {
        const points = [];
        const segments = 12; // 增加分段数使形状更不规则

        for (let i = 0; i <= segments; i++) {
            const x = (width / segments) * i;
            // 使用多个正弦函数叠加，创造更不规则的形状
            const y = height * (0.5 +
                Math.sin(i * 0.3) * 0.2 +
                Math.sin(i * 0.7) * 0.15 +
                Math.sin(i * 1.2) * 0.1);
            points.push({ x, y });
        }

        return points;
    }

    /**
     * 生成海草
     * @returns {Array} 海草数组
     */
    generateSeaweeds() {
        const seaweeds = [];
        const seaweedCount = 6; // 减少数量但增加长度

        for (let i = 0; i < seaweedCount; i++) {
            const x = Math.random() * this.canvas.width;
            const height = 100 + Math.random() * 80; // 更长的海草
            const segments = 12 + Math.floor(Math.random() * 6); // 更多的分段
            const points = [];

            // 生成海草的点
            for (let j = 0; j <= segments; j++) {
                const t = j / segments;
                const y = height * t;
                // 使用多个正弦函数叠加，创造更自然的摆动
                const offset = Math.sin(t * Math.PI) * (15 + Math.random() * 15) +
                    Math.sin(t * Math.PI * 2) * (5 + Math.random() * 5);
                points.push({
                    x: offset,
                    y: y
                });
            }

            seaweeds.push({
                x: x,
                y: this.canvas.height - height,
                points: points,
                swayOffset: Math.random() * Math.PI * 2,
                swaySpeed: 0.01 + Math.random() * 0.02, // 降低摇摆速度
                height: height
            });
        }

        return seaweeds;
    }

    /**
     * 绘制背景
     */
    drawBackground() {
        // 绘制海洋背景
        this.ctx.fillStyle = '#1e3c72';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制波浪
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);

        for (let x = 0; x <= this.canvas.width; x++) {
            const y = Math.sin(x * this.waveFrequency + this.waveTime) * this.waveAmplitude;
            this.ctx.lineTo(x, y + 50);
        }

        this.ctx.lineTo(this.canvas.width, this.canvas.height);
        this.ctx.lineTo(0, this.canvas.height);
        this.ctx.closePath();
        this.ctx.fillStyle = '#2a5298';
        this.ctx.fill();

        // 绘制海草
        this.seaweeds.forEach(seaweed => {
            this.ctx.save();
            this.ctx.translate(seaweed.x, seaweed.y);

            // 添加更自然的摇摆效果
            const sway = Math.sin(this.waveTime + seaweed.swayOffset) * seaweed.swaySpeed;
            this.ctx.rotate(sway);

            // 绘制海草主干
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);

            seaweed.points.forEach((point, index) => {
                if (index === 0) {
                    this.ctx.moveTo(point.x, point.y);
                } else {
                    this.ctx.lineTo(point.x, point.y);
                }
            });

            this.ctx.strokeStyle = '#2ecc71';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();

            // 添加更多叶子
            seaweed.points.forEach((point, index) => {
                if (index > 0 && index < seaweed.points.length - 1) {
                    const prev = seaweed.points[index - 1];
                    const next = seaweed.points[index + 1];
                    const angle = Math.atan2(next.y - prev.y, next.x - prev.x);

                    this.ctx.save();
                    this.ctx.translate(point.x, point.y);
                    this.ctx.rotate(angle);

                    // 绘制更大的叶子
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, 0);
                    this.ctx.quadraticCurveTo(8, -15, 15, 0);
                    this.ctx.quadraticCurveTo(8, 15, 0, 0);
                    this.ctx.fillStyle = '#27ae60';
                    this.ctx.fill();

                    // 添加叶子纹理
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, 0);
                    this.ctx.lineTo(15, 0);
                    this.ctx.strokeStyle = '#219a52';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();

                    this.ctx.restore();
                }
            });

            this.ctx.restore();
        });

        // 绘制礁石
        this.rocks.forEach(rock => {
            this.ctx.beginPath();
            this.ctx.moveTo(rock.x, rock.y + rock.height);

            rock.points.forEach(point => {
                this.ctx.lineTo(rock.x + point.x, rock.y + point.y);
            });

            this.ctx.lineTo(rock.x + rock.width, rock.y + rock.height);
            this.ctx.closePath();
            this.ctx.fillStyle = '#4a4a4a';
            this.ctx.fill();

            // 添加礁石阴影
            this.ctx.fillStyle = '#2a2a2a';
            this.ctx.fillRect(rock.x, rock.y + rock.height - 5, rock.width, 5);
        });
    }

    /**
     * 检查玩家是否是最大的鱼
     * @returns {boolean} 是否是最大的鱼
     */
    isPlayerLargest() {
        return this.fishes.every(fish => this.player.size >= fish.size);
    }

    /**
     * 生成其他鱼
     * @param {number} count - 要生成的鱼的数量
     */
    generateFishes(count) {
        // 根据难度设置速度范围
        let minSpeed, maxSpeed;
        switch (this.difficulty) {
            case 'easy':
                minSpeed = 0.5;
                maxSpeed = 1.5;
                break;
            case 'medium':
                minSpeed = 1;
                maxSpeed = 3;
                break;
            case 'hard':
                minSpeed = 1.5;
                maxSpeed = 4;
                break;
        }

        for (let i = 0; i < count; i++) {
            // 如果玩家是最大的鱼，生成更大的鱼
            const minSize = this.isPlayerLargest() ? this.player.size * 1.2 : 10;
            const maxSize = this.isPlayerLargest() ? this.player.size * 1.5 : 40;

            // 随机生成初始位置
            let x, y;
            const side = Math.floor(Math.random() * 4); // 0:上, 1:右, 2:下, 3:左
            const margin = 50; // 边距

            switch (side) {
                case 0: // 上边
                    x = Math.random() * this.canvas.width;
                    y = -margin;
                    break;
                case 1: // 右边
                    x = this.canvas.width + margin;
                    y = Math.random() * this.canvas.height;
                    break;
                case 2: // 下边
                    x = Math.random() * this.canvas.width;
                    y = this.canvas.height + margin;
                    break;
                case 3: // 左边
                    x = -margin;
                    y = Math.random() * this.canvas.height;
                    break;
            }

            // 使用难度相关的速度
            const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
            const angle = Math.random() * Math.PI * 2;

            this.fishes.push({
                x: x,
                y: y,
                size: Math.random() * (maxSize - minSize) + minSize,
                speed: speed,
                dx: Math.cos(angle) * speed,
                dy: Math.sin(angle) * speed,
                direction: angle,
                targetX: Math.random() * this.canvas.width,
                targetY: Math.random() * this.canvas.height
            });
        }
    }

    /**
     * 开始游戏循环
     */
    startGameLoop() {
        const loop = () => {
            this.update();
            this.draw();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        loop();
    }

    /**
     * 开始生成大礼包
     */
    startGiftGeneration() {
        const generateGift = () => {
            if (this.isPlayerLargest() || this.gameOver) return;

            if (!this.gift) {
                this.gift = {
                    x: Math.random() * (this.canvas.width - 30) + 15,
                    y: Math.random() * (this.canvas.height - 30) + 15,
                    size: 20
                };

                this.giftTimeout = setTimeout(() => {
                    this.gift = null;
                }, Math.random() * 5000 + 3000);
            }
        };

        this.giftIntervalId = setInterval(generateGift, Math.random() * 5000 + 5000);
    }

    /**
     * 生成气泡
     */
    startBubbleGeneration() {
        this.bubbleIntervalId = setInterval(() => {
            if (this.gameOver) return;

            const seaweed = this.seaweeds[Math.floor(Math.random() * this.seaweeds.length)];
            const bubble = {
                x: seaweed.x + Math.random() * 20 - 10,
                y: seaweed.y,
                size: 5 + Math.random() * 15,
                speed: 1 + Math.random(),
                opacity: 0.3 + Math.random() * 0.3
            };
            this.bubbles.push(bubble);
        }, 1000);
    }

    /**
     * 更新气泡状态
     */
    updateBubbles() {
        for (let i = this.bubbles.length - 1; i >= 0; i--) {
            const bubble = this.bubbles[i];

            // 气泡上升
            bubble.y -= bubble.speed;

            // 轻微左右摆动
            bubble.x += Math.sin(this.waveTime + i) * 0.5;

            // 如果气泡到达顶部，移除它
            if (bubble.y < 0) {
                this.bubbles.splice(i, 1);
                continue;
            }

            // 检查与玩家的碰撞
            const dx = this.player.x - bubble.x;
            const dy = this.player.y - bubble.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < (this.player.size + bubble.size) / 2) {
                this.gameOver = true;
                document.getElementById('gameOver').style.display = 'block';
                document.getElementById('finalScore').textContent = this.score;
                return;
            }
        }
    }

    /**
     * 绘制气泡
     */
    drawBubbles() {
        this.bubbles.forEach(bubble => {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(bubble.x, bubble.y, bubble.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${bubble.opacity})`;
            this.ctx.fill();

            // 添加光泽效果
            const gradient = this.ctx.createRadialGradient(
                bubble.x - bubble.size / 3,
                bubble.y - bubble.size / 3,
                0,
                bubble.x,
                bubble.y,
                bubble.size
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fill();
            this.ctx.restore();
        });
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 绑定窗口大小改变事件
        window.addEventListener('resize', this.resizeCanvas.bind(this));

        // 检测是否是移动设备（包括平板）
        const isMobileOrTablet = window.innerWidth <= 1024;

        if (isMobileOrTablet) {
            this.createMobileControls();
        } else {
            // 键盘控制
            this.handleKeyDown = (e) => {
                if (this.keys.hasOwnProperty(e.key)) {
                    this.keys[e.key] = true;
                    e.preventDefault();
                }
            };

            this.handleKeyUp = (e) => {
                if (this.keys.hasOwnProperty(e.key)) {
                    this.keys[e.key] = false;
                    e.preventDefault();
                }
            };

            document.addEventListener('keydown', this.handleKeyDown);
            document.addEventListener('keyup', this.handleKeyUp);
        }

        // 更新玩家移动
        const updatePlayerMovement = () => {
            if (!this.gameOver) {
                let dx = 0;
                let dy = 0;

                if (this.touchControls.active) {
                    // 移动端控制 - 降低灵敏度
                    dx = this.touchControls.moveX * 0.03;
                    dy = this.touchControls.moveY * 0.03;
                } else {
                    // 键盘控制
                    if (this.keys.ArrowLeft) dx -= this.player.speed;
                    if (this.keys.ArrowRight) dx += this.player.speed;
                    if (this.keys.ArrowUp) dy -= this.player.speed;
                    if (this.keys.ArrowDown) dy += this.player.speed;
                }

                // 对角线移动时保持相同速度
                if (dx !== 0 && dy !== 0) {
                    const factor = 1 / Math.sqrt(2);
                    dx *= factor;
                    dy *= factor;
                }

                // 添加平滑移动效果
                const smoothFactor = 0.8;
                this.player.dx = (this.player.dx || 0) * smoothFactor + dx * (1 - smoothFactor);
                this.player.dy = (this.player.dy || 0) * smoothFactor + dy * (1 - smoothFactor);

                this.player.x += this.player.dx;
                this.player.y += this.player.dy;

                // 更新鱼的方向
                if (this.player.dx !== 0 || this.player.dy !== 0) {
                    this.player.direction = Math.atan2(this.player.dy, this.player.dx);
                }

                // 边界检查
                this.player.x = Math.max(this.player.size, Math.min(this.canvas.width - this.player.size, this.player.x));
                this.player.y = Math.max(this.player.size, Math.min(this.canvas.height - this.player.size, this.player.y));
            }

            requestAnimationFrame(updatePlayerMovement);
        };

        updatePlayerMovement();

        document.getElementById('restartButton').addEventListener('click', () => {
            this.restart();
        });
    }

    /**
     * 创建移动端控制器
     */
    createMobileControls() {
        let touchId = null;

        this.handleStart = (e) => {
            if (touchId === null) {
                e.preventDefault();
                touchId = e.pointerId || (e.touches ? e.touches[0].identifier : null);
                this.touchControls.active = true;
                this.touchControls.startX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
                this.touchControls.startY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
                this.touchControls.moveX = 0;
                this.touchControls.moveY = 0;
            }
        };

        this.handleMove = (e) => {
            if (this.touchControls.active) {
                e.preventDefault();
                const touch = e.touches ? e.touches[0] : e;
                const dx = (touch.clientX - this.touchControls.startX);
                const dy = (touch.clientY - this.touchControls.startY);
                const maxDistance = 100;

                // 计算移动方向和距离
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance > maxDistance) {
                    const factor = maxDistance / distance;
                    this.touchControls.moveX = dx * factor;
                    this.touchControls.moveY = dy * factor;
                } else {
                    this.touchControls.moveX = dx;
                    this.touchControls.moveY = dy;
                }
            }
        };

        this.handleEnd = (e) => {
            if (e.pointerId === touchId || !e.touches || e.touches.length === 0) {
                touchId = null;
                this.touchControls.active = false;
                this.touchControls.moveX = 0;
                this.touchControls.moveY = 0;
            }
        };

        // 添加触摸事件监听器
        this.canvas.addEventListener('touchstart', this.handleStart, { passive: false });
        this.canvas.addEventListener('touchmove', this.handleMove, { passive: false });
        this.canvas.addEventListener('touchend', this.handleEnd);
        this.canvas.addEventListener('touchcancel', this.handleEnd);

        // 同时支持鼠标事件（用于开发者工具中的移动设备模拟）
        this.canvas.addEventListener('mousedown', this.handleStart);
        this.canvas.addEventListener('mousemove', this.handleMove);
        this.canvas.addEventListener('mouseup', this.handleEnd);
        this.canvas.addEventListener('mouseleave', this.handleEnd);

        // 添加指针事件支持
        this.canvas.addEventListener('pointerdown', this.handleStart);
        this.canvas.addEventListener('pointermove', this.handleMove);
        this.canvas.addEventListener('pointerup', this.handleEnd);
        this.canvas.addEventListener('pointercancel', this.handleEnd);
    }

    /**
     * 检查碰撞
     * @param {Object} fish1 - 第一条鱼
     * @param {Object} fish2 - 第二条鱼
     * @returns {boolean} 是否发生碰撞
     */
    checkCollision(fish1, fish2) {
        const dx = fish1.x - fish2.x;
        const dy = fish1.y - fish2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (fish1.size + fish2.size) / 2;
    }

    /**
     * 绘制鱼
     * @param {Object} fish - 鱼对象
     * @param {boolean} isPlayer - 是否是玩家
     */
    drawFish(fish, isPlayer = false) {
        this.ctx.save();
        this.ctx.translate(fish.x, fish.y);
        this.ctx.rotate(fish.direction);

        // 绘制鱼身（椭圆）
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, fish.size, fish.size * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fillStyle = isPlayer ? '#4CAF50' : '#FF5722';
        this.ctx.fill();

        // 绘制鱼尾（三角形）
        this.ctx.beginPath();
        this.ctx.moveTo(-fish.size * 0.8, 0);
        this.ctx.lineTo(-fish.size * 1.5, -fish.size * 0.3);
        this.ctx.lineTo(-fish.size * 1.5, fish.size * 0.3);
        this.ctx.closePath();
        this.ctx.fill();

        // 绘制眼睛
        this.ctx.beginPath();
        this.ctx.arc(fish.size * 0.4, -fish.size * 0.2, fish.size * 0.1, 0, Math.PI * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.arc(fish.size * 0.45, -fish.size * 0.2, fish.size * 0.05, 0, Math.PI * 2);
        this.ctx.fillStyle = 'black';
        this.ctx.fill();

        this.ctx.restore();
    }

    /**
     * 绘制珍珠
     * @param {Object} pearl - 珍珠对象
     */
    drawPearl(pearl) {
        this.ctx.save();
        this.ctx.translate(pearl.x, pearl.y);

        // 绘制珍珠主体
        this.ctx.beginPath();
        this.ctx.arc(0, 0, pearl.size / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();

        // 添加光泽效果
        const gradient = this.ctx.createRadialGradient(
            -pearl.size / 4, -pearl.size / 4, 0,
            0, 0, pearl.size / 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // 添加发光效果
        this.ctx.beginPath();
        this.ctx.arc(0, 0, pearl.size, 0, Math.PI * 2);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.fill();

        // 添加脉动效果
        const pulseSize = pearl.size * (1 + Math.sin(this.waveTime * 2) * 0.1);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.restore();
    }

    /**
     * 检查与岩石的碰撞
     * @param {Object} fish - 鱼对象
     * @returns {boolean} 是否发生碰撞
     */
    checkRockCollision(fish) {
        return this.rocks.some(rock => {
            // 简化的碰撞检测：检查鱼的中心点是否在岩石的边界框内
            const fishLeft = fish.x - fish.size;
            const fishRight = fish.x + fish.size;
            const fishTop = fish.y - fish.size;
            const fishBottom = fish.y + fish.size;

            return fishLeft < rock.x + rock.width &&
                fishRight > rock.x &&
                fishTop < rock.y + rock.height &&
                fishBottom > rock.y;
        });
    }

    /**
     * 检查与海草的碰撞
     * @param {Object} fish - 鱼对象
     * @returns {boolean} 是否发生碰撞
     */
    checkSeaweedCollision(fish) {
        return this.seaweeds.some(seaweed => {
            // 简化的碰撞检测：检查鱼的中心点是否在海草的边界框内
            const fishLeft = fish.x - fish.size;
            const fishRight = fish.x + fish.size;
            const fishTop = fish.y - fish.size;
            const fishBottom = fish.y + fish.size;

            return fishLeft < seaweed.x + 20 &&
                fishRight > seaweed.x - 20 &&
                fishTop < seaweed.y + seaweed.height &&
                fishBottom > seaweed.y;
        });
    }

    /**
     * 显示游戏结束界面
     */
    showGameOver() {
        const gameOver = document.getElementById('gameOver');
        gameOver.style.display = 'block';

        // 清除原有的难度选择按钮（如果存在）
        const oldButtons = gameOver.querySelector('.difficulty-buttons');
        if (oldButtons) {
            oldButtons.remove();
        }

        // 添加新的难度选择按钮
        const buttons = createDifficultyButtons((difficulty) => {
            gameOver.style.display = 'none';
            if (window.gameInstance) {
                window.gameInstance.destroy();
                window.gameInstance = null;
            }
            window.gameInstance = new Game(difficulty);
        });
        buttons.className = 'difficulty-buttons';
        gameOver.appendChild(buttons);

        document.getElementById('finalScore').textContent = this.score;
    }

    /**
     * 更新游戏状态
     */
    update() {
        if (this.gameOver) return;

        // 更新波浪时间
        this.waveTime += 0.05;

        // 如果是困难模式，更新气泡
        if (this.difficulty === 'hard') {
            this.updateBubbles();
        }

        // 更新其他鱼的位置
        this.fishes.forEach(fish => {
            // 计算到目标点的方向
            const dx = fish.targetX - fish.x;
            const dy = fish.targetY - fish.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 如果接近目标点，生成新的目标点
            if (distance < 10) {
                fish.targetX = Math.random() * this.canvas.width;
                fish.targetY = Math.random() * this.canvas.height;
            }

            // 逐渐调整方向朝向目标点
            const targetAngle = Math.atan2(dy, dx);
            const angleDiff = targetAngle - fish.direction;

            // 确保角度在 -PI 到 PI 之间
            let normalizedAngleDiff = angleDiff;
            while (normalizedAngleDiff > Math.PI) normalizedAngleDiff -= Math.PI * 2;
            while (normalizedAngleDiff < -Math.PI) normalizedAngleDiff += Math.PI * 2;

            // 平滑转向
            fish.direction += normalizedAngleDiff * 0.05;

            // 更新速度向量
            fish.dx = Math.cos(fish.direction) * fish.speed;
            fish.dy = Math.sin(fish.direction) * fish.speed;

            // 更新位置
            fish.x += fish.dx;
            fish.y += fish.dy;

            // 边界检查
            if (fish.x < -100 || fish.x > this.canvas.width + 100 ||
                fish.y < -100 || fish.y > this.canvas.height + 100) {
                // 如果鱼游出太远，重新从边缘生成
                const side = Math.floor(Math.random() * 4);
                switch (side) {
                    case 0: // 上边
                        fish.x = Math.random() * this.canvas.width;
                        fish.y = -50;
                        break;
                    case 1: // 右边
                        fish.x = this.canvas.width + 50;
                        fish.y = Math.random() * this.canvas.height;
                        break;
                    case 2: // 下边
                        fish.x = Math.random() * this.canvas.width;
                        fish.y = this.canvas.height + 50;
                        break;
                    case 3: // 左边
                        fish.x = -50;
                        fish.y = Math.random() * this.canvas.height;
                        break;
                }
                // 设置新的目标点
                fish.targetX = Math.random() * this.canvas.width;
                fish.targetY = Math.random() * this.canvas.height;
            }
        });

        // 检查玩家与岩石和海草的碰撞
        if (this.checkRockCollision(this.player) || this.checkSeaweedCollision(this.player)) {
            this.gameOver = true;
            this.showGameOver();
            return;
        }

        // 检查碰撞
        for (let i = this.fishes.length - 1; i >= 0; i--) {
            const fish = this.fishes[i];

            if (this.checkCollision(this.player, fish)) {
                if (this.player.size > fish.size) {
                    // 玩家吃掉小鱼
                    this.score += Math.floor(fish.size);
                    this.size += 0.1;
                    this.player.size += 0.5;
                    this.fishes.splice(i, 1);
                    this.updateScore();

                    // 如果玩家成为最大的鱼，清除大礼包
                    if (this.isPlayerLargest()) {
                        this.gift = null;
                        if (this.giftTimeout) {
                            clearTimeout(this.giftTimeout);
                        }
                    }
                } else {
                    // 玩家被大鱼吃掉
                    this.gameOver = true;
                    this.showGameOver();
                }
            }
        }

        // 检查珍珠碰撞
        if (this.gift && this.checkCollision(this.player, this.gift)) {
            // 随机增加5%-30%的大小
            const increase = 0.05 + Math.random() * 0.25;
            this.player.size *= (1 + increase);
            this.size *= (1 + increase);
            this.gift = null;
            clearTimeout(this.giftTimeout);
            this.updateScore();
        }

        // 如果鱼太少，生成新的鱼
        if (this.fishes.length < 5) {
            this.generateFishes(5);
        }
    }

    /**
     * 更新分数显示
     */
    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('size').textContent = this.size.toFixed(1);
    }

    /**
     * 绘制游戏画面
     */
    draw() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制背景
        this.drawBackground();

        // 如果是困难模式，绘制气泡
        if (this.difficulty === 'hard') {
            this.drawBubbles();
        }

        // 绘制玩家
        this.drawFish(this.player, true);

        // 绘制其他鱼
        this.fishes.forEach(fish => this.drawFish(fish));

        // 绘制珍珠
        if (this.gift) {
            this.drawPearl(this.gift);
        }
    }

    /**
     * 重新开始游戏
     */
    restart() {
        this.score = 0;
        this.size = 1;
        this.player.size = 20;
        this.player.direction = 0;
        this.fishes = [];
        this.gift = null;
        this.bubbles = []; // 清空气泡
        if (this.giftTimeout) {
            clearTimeout(this.giftTimeout);
        }
        this.generateFishes(10);
        this.seaweeds = this.generateSeaweeds();
        this.gameOver = false;
        document.getElementById('gameOver').style.display = 'none';
        this.updateScore();
    }
}

// 启动游戏
window.onload = () => {
    // 创建难度选择容器
    const container = document.createElement('div');
    container.id = 'difficultyContainer';
    container.style.position = 'fixed';
    container.style.top = '10px';
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
    container.style.zIndex = '1000';
    container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    container.style.padding = '10px';
    container.style.borderRadius = '5px';

    const title = document.createElement('div');
    title.textContent = '选择难度';
    title.style.color = 'white';
    title.style.fontSize = '18px';
    title.style.marginBottom = '10px';
    title.style.textAlign = 'center';
    title.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.3)';

    container.appendChild(title);

    const buttons = createDifficultyButtons((difficulty) => {
        container.style.display = 'none';
        if (window.gameInstance) {
            window.gameInstance.destroy();
            window.gameInstance = null;
        }
        window.gameInstance = new Game(difficulty);
    });

    container.appendChild(buttons);
    document.body.appendChild(container);
}; 