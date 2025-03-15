/**
 * 创建难度选择按钮
 * @param {Function} callback - 点击按钮后的回调函数
 * @returns {HTMLElement} 包含难度按钮的容器
 */
function createDifficultyButtons(callback) {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.gap = '10px';

    const createButton = (text, difficulty) => {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.padding = '8px 15px';
        button.style.fontSize = '14px';
        button.style.cursor = 'pointer';
        button.style.backgroundColor = '#4CAF50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.transition = 'all 0.3s ease';

        button.onmouseover = () => {
            button.style.backgroundColor = '#45a049';
            button.style.transform = 'translateY(-2px)';
        };

        button.onmouseout = () => {
            button.style.backgroundColor = '#4CAF50';
            button.style.transform = 'translateY(0)';
        };

        button.onclick = () => callback(difficulty);
        return button;
    };

    container.appendChild(createButton('简单', 'easy'));
    container.appendChild(createButton('中等', 'medium'));
    container.appendChild(createButton('困难', 'hard'));

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
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.size = 1;
        this.gameOver = false;
        this.difficulty = difficulty;

        // 设置画布大小为屏幕大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

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
        this.gameLoop();

        // 开始生成大礼包
        this.startGiftGeneration();

        // 如果是困难模式，开始生成气泡
        if (this.difficulty === 'hard') {
            this.startBubbleGeneration();
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
     * 开始生成大礼包
     */
    startGiftGeneration() {
        const generateGift = () => {
            // 如果玩家是最大的鱼，不再生成大礼包
            if (this.isPlayerLargest()) return;

            if (!this.gift && !this.gameOver) {
                this.gift = {
                    x: Math.random() * (this.canvas.width - 30) + 15,
                    y: Math.random() * (this.canvas.height - 30) + 15,
                    size: 20
                };

                // 随机设置大礼包存在时间（3-8秒）
                const duration = Math.random() * 5000 + 3000;
                this.giftTimeout = setTimeout(() => {
                    this.gift = null;
                }, duration);
            }
        };

        // 每5-10秒生成一个新的大礼包
        setInterval(generateGift, Math.random() * 5000 + 5000);
    }

    /**
     * 生成气泡
     */
    startBubbleGeneration() {
        setInterval(() => {
            // 随机选择一株海草
            const seaweed = this.seaweeds[Math.floor(Math.random() * this.seaweeds.length)];

            // 在海草顶部随机位置生成气泡
            const bubble = {
                x: seaweed.x + Math.random() * 20 - 10,
                y: seaweed.y,
                size: 5 + Math.random() * 15,
                speed: 1 + Math.random(),
                opacity: 0.3 + Math.random() * 0.3
            };

            this.bubbles.push(bubble);
        }, 1000); // 每秒生成一个气泡
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
        // 检测是否是移动设备
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

        if (isMobile) {
            this.createMobileControls();
        } else {
            // 原有的键盘控制代码
            let keys = {
                ArrowLeft: false,
                ArrowRight: false,
                ArrowUp: false,
                ArrowDown: false
            };

            document.addEventListener('keydown', (e) => {
                if (keys.hasOwnProperty(e.key)) {
                    keys[e.key] = true;
                    e.preventDefault();
                }
            });

            document.addEventListener('keyup', (e) => {
                if (keys.hasOwnProperty(e.key)) {
                    keys[e.key] = false;
                    e.preventDefault();
                }
            });
        }

        // 更新玩家移动
        const updatePlayerMovement = () => {
            let dx = 0;
            let dy = 0;

            if (this.touchControls.active) {
                // 移动端控制
                dx = this.touchControls.moveX * 0.1;
                dy = this.touchControls.moveY * 0.1;
            } else {
                // 键盘控制
                if (keys.ArrowLeft) dx -= this.player.speed;
                if (keys.ArrowRight) dx += this.player.speed;
                if (keys.ArrowUp) dy -= this.player.speed;
                if (keys.ArrowDown) dy += this.player.speed;
            }

            // 对角线移动时保持相同速度
            if (dx !== 0 && dy !== 0) {
                const factor = 1 / Math.sqrt(2);
                dx *= factor;
                dy *= factor;
            }

            this.player.x += dx;
            this.player.y += dy;

            // 更新鱼的方向
            if (dx !== 0 || dy !== 0) {
                this.player.direction = Math.atan2(dy, dx);
            }

            // 边界检查
            this.player.x = Math.max(this.player.size, Math.min(this.canvas.width - this.player.size, this.player.x));
            this.player.y = Math.max(this.player.size, Math.min(this.canvas.height - this.player.size, this.player.y));

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
        const controlsContainer = document.createElement('div');
        controlsContainer.id = 'mobileControls';
        controlsContainer.style.position = 'fixed';
        controlsContainer.style.bottom = '20px';
        controlsContainer.style.left = '50%';
        controlsContainer.style.transform = 'translateX(-50%)';
        controlsContainer.style.width = '150px';
        controlsContainer.style.height = '150px';
        controlsContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        controlsContainer.style.borderRadius = '50%';
        controlsContainer.style.touchAction = 'none';

        // 添加触摸事件
        controlsContainer.addEventListener('pointerdown', (e) => {
            this.touchControls.active = true;
            this.touchControls.startX = e.clientX;
            this.touchControls.startY = e.clientY;
            this.touchControls.moveX = 0;
            this.touchControls.moveY = 0;
        });

        controlsContainer.addEventListener('pointermove', (e) => {
            if (this.touchControls.active) {
                const dx = e.clientX - this.touchControls.startX;
                const dy = e.clientY - this.touchControls.startY;
                const maxDistance = 50;

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
        });

        const endTouch = () => {
            this.touchControls.active = false;
            this.touchControls.moveX = 0;
            this.touchControls.moveY = 0;
        };

        controlsContainer.addEventListener('pointerup', endTouch);
        controlsContainer.addEventListener('pointercancel', endTouch);

        document.body.appendChild(controlsContainer);
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
            new Game(difficulty);
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
     * 游戏主循环
     */
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
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
        if (window.gameInstance) {
            window.gameInstance.destroy();
            window.gameInstance = null;
        }
        window.gameInstance = new Game(difficulty);
    });

    container.appendChild(buttons);
    document.body.appendChild(container);

    // 初始化为中等难度
    window.gameInstance = new Game('medium');
}; 