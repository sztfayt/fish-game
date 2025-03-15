# 大鱼吃小鱼

一个简单有趣的网页游戏，支持电脑和手机端。

## 游戏说明

- 控制你的小鱼吃掉比自己小的鱼来成长
- 避开比自己大的鱼
- 收集珍珠可以快速成长
- 注意避开岩石和海草
- 在困难模式下还需要避开气泡

## 控制方式

### 电脑端
- 使用方向键控制鱼的移动

### 手机端
- 使用屏幕底部的虚拟摇杆控制鱼的移动

## 部署到 GitHub Pages

1. 创建一个新的 GitHub 仓库

2. 将代码推送到仓库：
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

3. 在仓库设置中启用 GitHub Pages：
   - 进入仓库的 Settings 标签
   - 找到 Pages 选项
   - 在 Source 中选择 main 分支
   - 点击 Save

4. 等待几分钟后，你的游戏就会在以下地址上线：
```
https://你的用户名.github.io/仓库名
```

## 本地开发

1. 克隆仓库：
```bash
git clone https://github.com/你的用户名/仓库名.git
```

2. 使用本地服务器运行游戏：
   - 可以使用 Python 的简单 HTTP 服务器：
     ```bash
     python -m http.server
     ```
   - 或者使用 Node.js 的 http-server：
     ```bash
     npx http-server
     ```

3. 在浏览器中访问 `http://localhost:8000` 即可运行游戏

## 技术栈

- HTML5 Canvas
- JavaScript
- CSS3 