# CogniMesh 情绪日记 — 从零到上线完整指南

本指南面向**零基础用户**。只要你会在电脑上开关机、打开浏览器、复制粘贴文字，按照本指南一步步操作，就能把这个情绪日记项目变成一个在互联网上可以被任何人访问的网站。

---

## 目录

1. [项目文件是什么](#1-项目文件是什么)
2. [准备工作：安装必要的工具](#2-准备工作安装必要的工具)
3. [准备工作：注册云服务账号](#3-准备工作注册云服务账号)
4. [本地测试：先在自己电脑上跑起来](#4-本地测试先在自己电脑上跑起来)
5. [购买云服务器：租一台永远开机的电脑](#5-购买云服务器租一台永远开机的电脑)
6. [部署到服务器：把项目搬上互联网](#6-部署到服务器把项目搬上互联网)
7. [绑定域名 + 配置 HTTPS](#7-绑定域名--配置-https)
8. [用户如何使用你的产品](#8-用户如何使用你的产品)
9. [后台管理：管理员怎么管这个产品](#9-后台管理管理员怎么管这个产品)
10. [数据备份：防止数据丢失](#10-数据备份防止数据丢失)
11. [日常维护](#11-日常维护)
12. [常见问题排查](#12-常见问题排查)

---

## 1. 项目文件是什么

### 1.1 用大白话理解项目结构

你的项目文件夹 `diary` 就像一个**两层的餐厅**：

```
diary/                          ← 餐厅大门口（项目总目录）
├── package.json                ← "遥控器" — 记录了几个快捷操作
├── DEPLOYMENT_GUIDE.md         ← 你现在正在读的这个文件
├── .gitignore                  ← 告诉 Git 哪些文件不用上传（不用管）
│
├── server/                     ← 后厨 — 负责存储数据、和AI对话、验证身份
│   ├── .env                    ← 密码本 — 存着各种密钥和配置（非常重要！）
│   ├── index.js                ← 后厨总管 — 整个服务器的入口
│   ├── db.js                   ← 连接数据库的"电话线"
│   ├── package.json            ← 后厨需要的"食材清单"
│   ├── models/                 ← 数据表格模板（用户表、日记表）
│   ├── routes/                 ← 各个"服务窗口"（登录、写日记、AI分析...）
│   ├── middleware/              ← "保安"（检查身份、限流）
│   ├── services/               ← AI服务（和 DeepSeek 对话）
│   ├── utils/                  ← 工具箱
│   └── scripts/                ← 小工具脚本（如设置管理员）
│
└── client/                     ← 前厅 — 用户看到的网页界面
    ├── package.json            ← 前厅需要的"食材清单"
    ├── index.html              ← 网页的"骨架"
    ├── vite.config.js          ← 打包工具的配置
    └── src/                    ← 网页的所有"装修素材"
        ├── App.jsx             ← 网页的主框架
        ├── App.css             ← 网页的"装修风格"（颜色、字体...）
        ├── api.js              ← 给后厨打电话的"接线员"
        ├── store.js            ← 临时记忆（当前页面的状态）
        └── components/         ← 网页的各个"功能模块"
```

### 1.2 三个最重要的文件你需要了解

| 文件 | 作用 | 什么时候动它 |
|------|------|-------------|
| `server/.env` | 存密码、密钥、数据库地址 | 部署前必须修改 |
| `server/index.js` | 服务器启动文件 | 一般不动 |
| `client/src/api.js` | 前端和后端之间的"电话线" | 一般不动 |

---

## 2. 准备工作：安装必要的工具

你需要在自己的电脑上安装以下工具。每个工具只需要安装一次。

### 2.1 安装 Node.js（让电脑能运行 JavaScript 程序）

1. 打开浏览器，访问：**https://nodejs.org**
2. 你会看到两个绿色的大按钮，点击**左边那个**（写着 LTS 的那个）
3. 下载完成后，双击安装包
4. 一路点 **Next**（下一步），所有选项保持默认即可
5. 安装完成后，验证一下是否成功：
   - 按键盘上的 **Win键 + R**（Win键就是画着 Windows 图标的那个键）
   - 输入 `cmd` 然后按回车，会弹出一个黑色窗口
   - 在黑色窗口里输入：`node --version`
   - 如果显示类似 `v20.11.0` 这样的数字，说明安装成功
   - 再输入：`npm --version`
   - 如果显示类似 `10.2.4` 这样的数字，说明 npm 也装好了

> **什么是 npm？** npm 就像手机上的"应用商店"，用来下载项目需要的各种代码包。

### 2.2 安装 Git（用来下载和管理代码）

1. 打开浏览器，访问：**https://git-scm.com/download/win**
2. 下载会自动开始，如果没有，点击页面上的 "Click here to download manually"
3. 双击安装包，一路点 **Next**，所有选项保持默认
4. 验证：在黑色命令行窗口里输入 `git --version`，看到版本号就说明成功了

### 2.3 安装一个代码编辑器（用来查看和编辑文件）

推荐 **VS Code**（免费又好用）：

1. 访问：**https://code.visualstudio.com**
2. 点击蓝色的大按钮下载
3. 安装（一路 Next 即可）

装好后，你可以用 VS Code 打开项目文件夹来编辑 `.env` 等配置文件。

---

## 3. 准备工作：注册云服务账号

### 3.1 注册 MongoDB Atlas（免费云数据库）

我们需要一个地方"永久保存"用户的日记数据。MongoDB Atlas 提供免费套餐，足够小项目使用。

1. 打开浏览器，访问：**https://www.mongodb.com/atlas**
2. 点击 **Try Free** 或 **Get Started Free**
3. 输入你的邮箱、姓名，设置一个密码，然后点 **Create Account**
4. 打开邮箱，找到 MongoDB 发来的验证邮件，点击验证链接
5. 验证后登录，会进入一个问卷页面，可以全部跳过（点 Skip）
6. 你会看到 **Create a Cluster** 页面：
   - 选择 **M0**（免费套餐，写着 FREE）
   - 云服务商保持默认（AWS 或 Azure 都可以）
   - 区域选择离你最近的（如 **Singapore** 新加坡）
   - 集群名字随便，默认的也可以
   - 点击 **Create Deployment**（绿色按钮）
7. 等待集群创建完成（约 1-3 分钟）
8. 创建完成后，你会进入一个设置页面：
   - 输入一个 **Username**（记下来！如 `admin`）
   - 输入一个 **Password**（记下来！一定要记住！）
   - 点击 **Create User**
9. 往下滚动，在 **IP Access List** 部分：
   - 点击 **Add My Current IP**（会自动添加你当前的IP）
   - 再点击 **Add Entry**，输入 `0.0.0.0/0`，点确认（这样服务器才能连上）
10. 继续往下，点击 **Finish and Close**
11. 现在你会看到集群的卡片，点击 **Connect** 按钮
    - 选择 **Drivers**（驱动程序）
    - 复制那一行连接字符串，看起来像这样：
      ```
      mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
      ```
    - 把 `<password>` 替换成你刚才设置的密码
    - **把整个连接字符串保存到记事本里！**后面要用

### 3.2 注册 DeepSeek API（获取AI对话能力）

这个项目需要 AI 来生成"情绪天气"报告，所以需要一个 DeepSeek 的 API Key。

1. 访问：**https://platform.deepseek.com**
2. 点击注册，用手机号或邮箱注册
3. 登录后，进入控制台
4. 点击左侧菜单的 **API Keys**
5. 点击 **创建 API Key**，起个名字（如 `diary-app`）
6. **立刻复制这个 Key 并保存到记事本！**（它只显示一次，关闭后就看不到了）
7. 这个 Key 的格式是 `sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
8. 你需要在 DeepSeek 平台充值（最少充 10 元即可），用支付宝/微信支付很方便

### 3.3 购买域名（可选，但强烈推荐）

没有域名的话，用户只能用一串数字 IP 访问你的网站（如 `http://123.45.67.89`），很难看也不好记。

**推荐域名购买网站**：
- **Namecheap**：https://www.namecheap.com（国际站，支持支付宝）
- **Cloudflare**：https://www.cloudflare.com（可以买域名，还提供免费的 CDN/防护）
- **阿里云万网**：https://wanwang.aliyun.com（国内，需实名认证）
- **腾讯云**：https://dnspod.cloud.tencent.com

1. 选一个你喜欢的域名（如 `my-diary.online`）
2. 加入购物车，付款
3. 买完后先不用管它，等部署服务器时再来配置

---

## 4. 本地测试：先在自己电脑上跑起来

在部署到互联网之前，我们先在自己的电脑上测试一遍，确保一切正常。

### 4.1 打开项目文件夹

1. 按 **Win键 + R**，输入 `cmd`，按回车打开命令行窗口
2. 在命令行窗口里输入以下命令，进入项目文件夹（请替换成你的实际路径）：
   ```
   cd "d:\桌面\vibe coding\v4\diary"
   ```
   > 注意：如果你把项目文件夹放在了别的位置，替换 `d:\桌面\vibe coding\v4\diary` 为你的实际路径。

### 4.2 修改密码配置文件（.env）

这是**最关键的一步**。我们需要把 `.env` 文件里的占位符替换成真实的密码和地址。

用 VS Code 或记事本打开文件：**`server\.env`**

原始内容（参考 `server/.env.example`）：
```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/cognimesh
JWT_SECRET=your_jwt_secret_here
REFRESH_SECRET=your_refresh_secret_here
DEEPSEEK_API_KEY=sk-your_deepseek_api_key_here
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-v4-flash
CLIENT_URL=http://localhost:5173
```

需要修改的内容：

**① MONGODB_URI**：替换成你在第 3.1 步保存的 MongoDB Atlas 连接字符串。
```
MONGODB_URI=mongodb+srv://admin:你的密码@cluster0.xxxxx.mongodb.net/cognimesh?retryWrites=true&w=majority
```
> 注意：把连接字符串里的 `<password>` 和数据库名替换掉。在 URL 末尾的 `?` 之前加上 `/cognimesh`（数据库名）。

**② JWT_SECRET 和 REFRESH_SECRET**：这是两个"签名密钥"，用来加密用户的登录凭证。你需要随机生成两段长字符串。

生成方法：在命令行窗口输入以下命令两次（每次会生成不同的随机字符串）：
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
把生成的字符串分别填到 `JWT_SECRET` 和 `REFRESH_SECRET` 后面（两个要不一样）。

**③ DEEPSEEK_API_KEY**：替换成你在第 3.2 步获取的 DeepSeek API Key（sk-开头的那个）。

**④ OPENAI_API_KEY**：可以保持原样或删除这一行（项目优先用 DeepSeek）。

修改完成后保存文件。最终看起来像这样：
```
PORT=5000
MONGODB_URI=mongodb+srv://admin:mypassword@cluster0.abcde.mongodb.net/cognimesh?retryWrites=true&w=majority
JWT_SECRET=a1b2c3d4e5f6...（64位随机字符串）
REFRESH_SECRET=f6e5d4c3b2a1...（另一个64位随机字符串）
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AI_BASE_URL=https://api.deepseek.com
AI_MODEL=deepseek-v4-flash
CLIENT_URL=http://localhost:5173
```

### 4.3 安装所有依赖

在命令行窗口中（确保你已经在 `diary` 目录下），输入：

```
npm run install:all
```

这会分别给项目根目录、server 和 client 安装需要的代码包。需要几分钟时间。看到命令完成且没有红色报错就说明成功。

### 4.4 启动服务器端

新开一个命令行窗口（Win+R → cmd），输入：

```
cd "d:\桌面\vibe coding\v4\diary"
npm run dev:server
```

看到 `Server running on port 5000` 就说明后端启动成功了。

> 如果看到红色的错误信息，跳到[第12节：常见问题排查](#12-常见问题排查)。

### 4.5 启动前端界面

**再新开一个**命令行窗口，输入：

```
cd "d:\桌面\vibe coding\v4\diary"
npm run dev:client
```

看到类似 `Local: http://localhost:5173` 就说明前端启动成功了。

### 4.6 打开浏览器测试

1. 打开浏览器
2. 在地址栏输入：`http://localhost:5173`
3. 你应该能看到情绪日记的界面
4. 点击注册，用任意邮箱和密码注册一个账号
5. 写几条日记
6. 测试"情绪天气"里的三个按钮（即时回顾 / 时段报告 / 深度洞察）
7. 测试"认知模式图"

如果一切正常，恭喜！项目在本地跑通了。接下来要把它放到互联网上。

---

## 5. 购买云服务器：租一台永远开机的电脑

要让别人随时访问你的网站，你需要一台 **24小时不关机的电脑**，这就是"云服务器"（也叫 VPS）。

### 5.1 选择云服务商

推荐以下几家（对新手友好，价格便宜）：

| 服务商 | 最低月费 | 特点 |
|-------|---------|------|
| **DigitalOcean** | $4/月 | 教程最多，最国际化的选择 |
| **Vultr** | $3.5/月 | 便宜，节点多 |
| **Hetzner** | €3.99/月 | 性价比最高 |
| **阿里云 ECS** | ¥34/月 | 国内速度快，需实名 |
| **腾讯云轻量** | ¥28/月 | 国内入门首选，带宽大 |

> 本指南以 **DigitalOcean** 为例，其它服务商的操作大同小异。

### 5.2 注册 DigitalOcean 并创建服务器

1. 访问：**https://www.digitalocean.com**
2. 点击 **Sign Up** 注册（支持 Google/GitHub 账号登录）
3. 绑定信用卡或 PayPal（需要一张支持外币的卡）
4. 充值 $5（最低）
5. 登录后，点击顶部的绿色 **Create** 按钮 → 选择 **Droplets**（Droplets = 服务器）
6. 配置选项：
   - **Region**（地区）：选择 **Singapore**（新加坡，国内访问速度较快）
   - **Image**（操作系统）：选择 **Ubuntu 24.04 (LTS)**
   - **Size**（配置）：选择 **Basic** 方案
     - 普通使用：选 $4/月（512MB RAM, 1 CPU）
     - 如果预算充足：选 $6/月（1GB RAM, 1 CPU）
   - **Authentication**（登录方式）：选择 **Password**
     - 输入一个 root 密码（记下来！这是服务器的登录密码）
   - 其他选项保持默认
7. 点击 **Create Droplet**
8. 等待约 1 分钟，服务器就创建好了
9. 你会看到一行 **IP 地址**，类似 `159.89.xxx.xxx`，**把这个 IP 记下来！**

### 5.3 连接你的服务器

1. 在命令行窗口输入（替换成你的服务器IP）：
   ```
   ssh root@你的服务器IP
   ```
   例如：`ssh root@159.89.12.34`

2. 第一次连接会问 `Are you sure you want to continue connecting?`
   - 输入 `yes` 然后按回车

3. 输入服务器的 root 密码（输入时不显示任何字符，这是正常的），然后按回车

4. 看到类似 `Welcome to Ubuntu` 的文字，说明你成功连上了服务器！

> **现在你正在远程操控那台云服务器！** 命令行里输入的任何命令都是在那台服务器上执行的。

---

## 6. 部署到服务器：把项目搬上互联网

以下所有命令都在**连接到服务器的命令行窗口**中执行。

### 6.1 在服务器上安装 Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

验证：输入 `node --version` 和 `npm --version`，看到版本号就行。

### 6.2 在服务器上安装 Git 和 Nginx

```bash
sudo apt update
sudo apt install -y git nginx
```

- **Git**：用来从 GitHub 下载代码
- **Nginx**：网页"门卫"，负责接收用户请求并转发给后端

### 6.3 把项目代码上传到服务器

有两种方式：

**方式A：用 GitHub 中转（推荐）**

1. 在你自己的电脑上，去 **GitHub.com** 注册一个账号
2. 创建一个新的私有仓库（Private repository），名字叫 `cognimesh`
3. 在项目文件夹打开命令行，输入：
   ```bash
   cd "d:\桌面\vibe coding\v4\diary"
   git init
   git add .
   git commit -m "first commit"
   git branch -M main
   git remote add origin https://github.com/你的用户名/cognimesh.git
   git push -u origin main
   ```
4. 在服务器上拉取代码：
   ```bash
   cd /opt
   sudo git clone https://github.com/你的用户名/cognimesh.git
   sudo chown -R $USER:$USER /opt/cognimesh
   ```
   > 如果仓库是私有的，需要输入 GitHub 用户名和 Personal Access Token。生成 Token 的方法：GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → 勾选 repo → 生成后复制。

**方式B：用 SCP 直接上传**

如果你不想用 GitHub，可以从自己电脑直接传文件到服务器（需要在你自己的电脑上开命令行）：

```bash
scp -r "d:\桌面\vibe coding\v4\diary" root@你的服务器IP:/opt/
```
> 注意：这种方式在 Windows 上需要先安装 SCP 工具，或者用 WinSCP 等图形化工具。

### 6.4 在服务器上配置 .env 文件

```bash
cd /opt/cognimesh
```

编辑 `.env` 文件（服务器上的）：

```bash
nano server/.env
```

> `nano` 是一个简单的文本编辑器。用方向键移动光标，编辑完成按 **Ctrl+X**，再按 **Y**，再按 **回车** 保存。

内容和之前本地测试的一样。但注意两处修改：
- `CLIENT_URL` 先改成 `http://你的服务器IP`
- MONGODB_URI、JWT_SECRET、REFRESH_SECRET、DEEPSEEK_API_KEY 和本地保持一致

保存后退出。

### 6.5 安装依赖并构建前端

```bash
cd /opt/cognimesh
npm run install:all
npm run build
```

`npm run build` 会把前端网页打包成静态文件，放在 `client/dist/` 目录下。

### 6.6 安装 PM2（让服务器一直在后台运行）

如果没有 PM2，当你关闭命令行窗口后服务器就停了。PM2 能让它一直在后台跑。

```bash
sudo npm install -g pm2
```

启动服务器：

```bash
cd /opt/cognimesh
NODE_ENV=production pm2 start server/index.js --name cognimesh
```

设置 PM2 开机自启：

```bash
pm2 startup
```

执行它输出的那条命令（它会自动复制粘贴）。然后：

```bash
pm2 save
```

验证：输入 `pm2 status`，看到 `cognimesh` 的状态是 `online` 就对了。

### 6.7 配置 Nginx（反向代理）

Nginx 的作用是：接收来自互联网的网页请求，然后把它们转交给你的 Node.js 服务器。

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/sites-available/cognimesh
```

在里面粘贴以下内容（把 `你的服务器IP` 替换成实际 IP）：

```nginx
server {
    listen 80;
    server_name 你的服务器IP;

    # 日志文件
    access_log /var/log/nginx/cognimesh-access.log;
    error_log /var/log/nginx/cognimesh-error.log;

    # 上传大小限制
    client_max_body_size 10m;

    # 把请求转给 Node.js 服务器
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

保存退出（Ctrl+X → Y → 回车）。

启用这个配置：

```bash
sudo ln -s /etc/nginx/sites-available/cognimesh /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default   # 删除默认配置
sudo nginx -t        # 测试配置是否有错误
sudo systemctl restart nginx   # 重启 Nginx
```

### 6.8 配置防火墙

```bash
sudo ufw allow 22/tcp     # SSH 远程连接
sudo ufw allow 80/tcp     # HTTP 网页
sudo ufw allow 443/tcp    # HTTPS 网页（后面会用到）
sudo ufw enable           # 开启防火墙
```

看到提示输入 `y` 确认。

### 6.9 打开浏览器访问

在你自己的电脑上，打开浏览器，输入 `http://你的服务器IP`，应该能看到情绪日记的登录界面了！

---

## 7. 绑定域名 + 配置 HTTPS

### 7.1 把域名指向服务器

1. 登录你购买域名的网站（如 Namecheap、Cloudflare、阿里云）
2. 找到 **DNS 管理** 或 **域名解析** 页面
3. 添加一条 **A 记录**：
   - **主机记录**（Name/Host）：`@`（代表根域名，如 `my-diary.online`）
   - **记录值**（Value）：你的服务器 IP 地址
   - **TTL**：保持默认或选 600（10分钟）
4. 如果想用 `www.my-diary.online`，再添加一条 CNAME 记录：
   - **主机记录**：`www`
   - **记录值**：`@` 或你的根域名
5. 保存设置，等待几分钟到几小时让 DNS 生效

验证：在浏览器输入你的域名，如果能打开网站，就说明 DNS 生效了。

### 7.2 更新服务器配置中的域名

```bash
cd /opt/cognimesh
nano server/.env
```

把 `CLIENT_URL` 改成你的域名：`CLIENT_URL=https://你的域名`

重启后端：

```bash
pm2 restart cognimesh
```

### 7.3 配置 Let's Encrypt 免费 HTTPS 证书

HTTPS 让网站更安全，而且在浏览器地址栏会显示小锁图标。

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d 你的域名
```

按提示操作：
1. 输入邮箱地址（用于证书到期提醒）
2. 同意服务条款（输入 Y）
3. 是否接收推广邮件（N 不接收）
4. 等待证书生成

完成后，Certbot 会自动修改 Nginx 配置，加入 HTTPS 支持。

### 7.4 设置证书自动续期

Let's Encrypt 证书 90 天过期，需要自动续期：

```bash
sudo certbot renew --dry-run   # 测试自动续期是否正常
```

这个命令会自动添加一个定时任务，每天检查证书是否需要续期。不需要做额外配置。

### 7.5 最后验证

1. 打开浏览器，输入 `https://你的域名`
2. 地址栏应该出现小锁图标
3. 注册、登录、写日记、测试"情绪天气"

---

## 8. 用户如何使用你的产品

### 8.1 用户访问流程

1. **访问网址**：用户打开浏览器，输入 `https://你的域名`
2. **注册账号**：输入邮箱和密码，点击注册
   - 密码要求：至少8位，包含大小写字母、数字、符号中的至少两种
3. **登录使用**：注册后自动登录，开始写日记
4. **写日记**：在左侧面板记录当时的想法、情绪评分（-5到+5）、精神活跃度（0-10）
5. **查看日历**：在日历视图查看每月的情绪记录
6. **情绪分析**：
   - 即时回顾（近3天情绪觉察）
   - 时段报告（两周情绪故事，需要至少7天数据）
   - 深度洞察（半年模式探索）
7. **认知模式图**：查看关键词在情绪环状模型上的分布
8. **数据导出**：支持导出 CSV 和 JSON 备份

### 8.2 用户隐私说明

- 每个用户只能看到自己的日记
- 密码经过加密存储（即使数据库泄露，密码也无法被破解）
- AI 分析基于匿名的日记摘要生成
- 建议在网站上添加隐私政策和使用条款（可用免费生成工具创建）

---

## 9. 后台管理：管理员怎么管这个产品

### 9.1 设置第一个管理员

首先你自己注册一个账号（用你常用的邮箱），然后通过命令行把它提升为管理员。

在服务器上执行：

```bash
cd /opt/cognimesh
npm run seed-admin 你的邮箱
```

例如：`npm run seed-admin admin@example.com`

成功后会显示 `用户 admin@example.com 已升级为管理员`。

### 9.2 管理员能做什么

用管理员账号登录后，在左上角会多出一个**"管理"按钮**。点击进入管理后台，可以：

**统计页面**：
- 查看总用户数
- 查看最近7天活跃用户数
- 查看总日记条目数
- 查看本月新增条目数
- 查看月度注册趋势图

**用户管理**：
- 浏览所有用户列表（邮箱、日记数量、最后记录日期、注册日期）
- 点击"查看"进入某个用户的日记列表
- 可以在用户日记列表中删除单个条目
- 可以删除非管理员用户（同时删除该用户的所有日记）

> 注意：管理员之间的互删保护 — 不能删除其他管理员账号。

### 9.3 管理员注意事项

- 删除用户操作**不可撤销**，确认后再操作
- 建议定期查看统计数据，了解产品使用情况
- 如果发现异常内容，管理员可以进入用户日记列表进行管理

---

## 10. 数据备份：防止数据丢失

### 10.1 MongoDB Atlas 自动备份

MongoDB Atlas 免费套餐（M0）不包含自动备份。如果你比较在意数据安全：

1. 升级到 M2 套餐（约 $9/月），获得自动每日备份
2. 或者使用下面的手动备份方式

### 10.2 应用内备份

用户和管理员可以在应用内导出数据：
- **CSV 导出**：在左侧面板选择年月，导出为 CSV 文件
- **JSON 全量导出**：在"数据管理"模块，导出全部数据为 JSON 文件
- **JSON 导入**：可以将之前导出的 JSON 文件导入恢复

### 10.3 服务器端数据库备份（手动/定时）

在服务器上安装 mongodump 工具并定期备份：

```bash
# 安装 MongoDB Database Tools
wget https://fastdl.mongodb.org/tools/db/mongodb-database-tools-ubuntu2204-x86_64-100.9.4.tgz
tar -xf mongodb-database-tools-*.tgz
sudo cp mongodb-database-tools-*/bin/* /usr/local/bin/

# 创建备份目录
mkdir -p /opt/backups

# 手动备份（替换成你的 MongoDB Atlas 连接字符串）
mongodump --uri="你的MONGODB_URI" --out=/opt/backups/$(date +%Y%m%d)
```

设置每天自动备份（crontab）：

```bash
crontab -e
```

添加一行：
```
0 3 * * * mongodump --uri="你的MONGODB_URI" --out=/opt/backups/$(date +\%Y\%m\%d)
```

这会在每天凌晨 3 点自动备份数据库。

---

## 11. 日常维护

### 11.1 常规检查（每个月做一次）

在服务器上执行：

```bash
# 1. 检查服务运行状态
pm2 status

# 2. 检查磁盘空间
df -h

# 3. 查看最近的服务日志
pm2 logs cognimesh --lines 20

# 4. 检查 Nginx 状态
sudo systemctl status nginx
```

### 11.2 更新代码（当有新功能或修复时）

```bash
cd /opt/cognimesh
git pull                    # 拉取最新代码
npm run build               # 重新构建前端
pm2 restart cognimesh       # 重启服务
```

### 11.3 系统更新

```bash
sudo apt update
sudo apt upgrade -y
```

建议每月执行一次，保持系统安全。

### 11.4 DeepSeek API 余额

定期登录 DeepSeek 平台检查 API 余额，确保还有余额。余额用完的话，"情绪天气"功能会报错。

---

## 12. 常见问题排查

### 12.1 服务器启动失败

**现象**：`npm run dev:server` 直接出错退出

**检查**：
1. `.env` 文件里的 `JWT_SECRET` 和 `REFRESH_SECRET` 是否改了？（不能保留 `your_` 开头的占位符）
2. `MONGODB_URI` 是否填写正确？（密码、数据库名）
3. MongoDB Atlas 的 IP Access List 是否添加了 `0.0.0.0/0`？
4. 端口 5000 是否被占用？

### 12.2 情绪天气显示"请求失败"

**这是最常见的问题。** 现在代码已经改进，会显示更详细的错误信息。

**排查步骤**：

1. 在服务器上查看后端日志：
   ```bash
   pm2 logs cognimesh --lines 50
   ```
   看是否有 `EmotionWeather error:` 开头的错误

2. 常见原因及解决：

   | 错误信息 | 原因 | 解决方案 |
   |----------|------|---------|
   | `401 Unauthorized` | API Key 无效 | 检查 `.env` 里的 `DEEPSEEK_API_KEY` 是否正确 |
   | `insufficient_quota` | DeepSeek 余额不足 | 去 DeepSeek 平台充值 |
   | `Connection timeout` | 服务器连不上 DeepSeek | 检查服务器防火墙，确保能访问外网 |
   | `model not found` | 模型名错误 | 检查 `.env` 里的 `AI_MODEL` 是否为 `deepseek-v4-flash` |

3. 直接在服务器上用 curl 测试 DeepSeek API：
   ```bash
   curl -X POST https://api.deepseek.com/chat/completions \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer 你的API_KEY" \
     -d '{"model":"deepseek-v4-flash","messages":[{"role":"user","content":"你好"}],"max_tokens":50}'
   ```
   看返回结果是否有 `choices` 字段

### 12.3 网站打开一片空白

1. 检查 Nginx 是否运行：`sudo systemctl status nginx`
2. 检查 PM2 是否运行：`pm2 status`
3. 查看 Nginx 错误日志：`sudo tail -f /var/log/nginx/cognimesh-error.log`
4. 检查防火墙：`sudo ufw status`

### 12.4 MongoDB 连接失败

1. 检查 MongoDB Atlas 上的 IP Access List 是否包含 `0.0.0.0/0`
2. 检查数据库用户名和密码是否正确
3. 检查连接字符串格式是否正确
4. 在服务器上测试连接：
   ```bash
   curl -v 你的MONGODB_URI 2>&1 | head -20
   ```

### 12.5 域名解析不生效

1. DNS 修改后需要等几分钟到 48 小时不等
2. 用在线工具检查：https://www.whatsmydns.net
3. 确认 A 记录指向了正确的服务器 IP
4. 本地可以尝试清除 DNS 缓存：命令行输入 `ipconfig /flushdns`

### 12.6 HTTPS 证书配置失败

1. 确认域名已经正确解析到服务器 IP
2. 确认 Nginx 正在运行且 80 端口可以访问
3. 防火墙需要开放 80 和 443 端口
4. 重新运行：`sudo certbot --nginx -d 你的域名`

### 12.7 忘记管理员密码

目前应用没有"找回密码"功能。如果忘记了管理员密码：

1. SSH 连接到服务器
2. 通过 MongoDB 直接修改：
   ```bash
   mongosh "你的MONGODB_URI"
   ```
   然后在 MongoDB shell 里执行：
   ```javascript
   use cognimesh
   // 你需要通过应用重新注册，然后用 seed-admin 升权
   ```
3. 更简单的做法：用另一个邮箱注册新账号，再用 `npm run seed-admin` 提升为管理员

---

## 附录：可能的产品问题和改进方向

### 已知限制

1. **没有"忘记密码"功能**：目前的注册登录系统比较基础，用户如果忘记密码无法自行重置
2. **没有邮箱验证**：注册时不会发送验证邮件，任何人都可以用任意邮箱注册
3. **AI 报告质量依赖数据量**：如果用户日记很少，AI 生成的分析可能比较泛泛
4. **没有数据删除自动化**：被管理员删除的用户，其数据直接从数据库删除，不存在"回收站"
5. **并发能力有限**：当前架构适合几十到几百个用户同时使用，如果用户量很大（上千人同时用），需要进一步优化

### 建议的改进方向

1. **添加密码重置功能**：用邮件发送重置链接
2. **添加邮箱验证**：防止恶意注册
3. **添加操作日志**：记录管理员的操作历史
4. **添加数据统计面板**：在管理后台增加更多图表
5. **多语言支持**：支持英文界面
6. **移动端适配**：优化手机浏览体验

---

## 结语

恭喜！看到这里，你已经完成了：

1. 理解了项目文件结构
2. 在本地跑通了项目
3. 买了一台云服务器
4. 把项目部署到了互联网上
5. 绑定了域名并配置了 HTTPS
6. 了解了管理员操作和日常维护

现在任何人都可以通过 `https://你的域名` 访问你的情绪日记产品了。

如果遇到本指南没有覆盖的问题，可以检查服务器日志（`pm2 logs cognimesh`）来获取更多线索。
