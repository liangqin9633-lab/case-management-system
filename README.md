# 刑事律师案件管理系统

这是一个简单的网页版案件管理系统，支持分类管理：在办案件、客户线索、案件收款、财务收支、备用金收支。

## 功能

- 分类展示：在办案件、客户线索、案件收款、财务收支、备用金收支
- “案件收款”分类承接原“财务事项”内容
- “财务收支”分类包含合同/项目名称、日期、金额、收/支、交易对手、开票信息、收款/支出说明、附件、备注说明
- 添加、编辑、删除记录
- 后端数据库：MySQL

## 目录结构

- `server.js`：Express 后端服务器
- `public/index.html`：前端界面
- `public/style.css`：样式
- `public/app.js`：前端逻辑

## 运行步骤

1. 安装 Node.js（包含 npm）
2. 安装 MySQL 服务并创建数据库，例如：
   ```sql
   CREATE DATABASE case_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. 设置 MySQL 环境变量（本机直接在命令行设置）：
   ```bash
   export MYSQL_HOST=127.0.0.1
   export MYSQL_PORT=3306
   export MYSQL_USER=root
   export MYSQL_PASSWORD=你的密码
   export MYSQL_DATABASE=case_management
   ```
4. 在项目目录执行：
   ```bash
   npm install
   ```
5. 启动服务：
   ```bash
   npm start
   ```
6. 在浏览器打开：
   ```
   http://localhost:3000
   ```

## 云部署

本项目已经支持 Docker 部署，已创建 `Dockerfile` 和 `.dockerignore`。

### 推荐部署方式

1. 将项目推送到 GitHub
2. 使用云服务部署：
   - Render
   - Railway
   - DigitalOcean App Platform
   - Heroku（仅限旧版支持）
   - 任何支持 Docker 的云主机

### 直接使用 Docker 部署

如果你有自己的云主机或 VPS，可以执行：

```bash
docker build -t case-management-system .
docker run -d -p 3000:3000 \
  -e MYSQL_HOST=your_mysql_host \
  -e MYSQL_PORT=3306 \
  -e MYSQL_USER=your_mysql_user \
  -e MYSQL_PASSWORD=your_mysql_password \
  -e MYSQL_DATABASE=case_management \
  --name case-management-system case-management-system
```

然后访问：

```text
http://your-server-ip:3000
```

### 关于 MySQL 数据库

当前项目已改为使用 MySQL 存储数据，云部署时请注意：

- 确保 MySQL 数据库已经创建并能从应用所在服务器访问。
- 如果使用 Docker 部署，请通过环境变量传入 MySQL 连接信息。
- 如果你在云平台部署应用，建议同时使用云数据库服务或持久化 MySQL 实例。

## 云上 MySQL + 云上应用完整部署流程

### 1. 准备 GitHub 仓库

1. 在 GitHub 新建一个仓库。
2. 将当前项目全部推送到仓库中。

### 2. 选择云平台

推荐优先级：
- Railway
- Render
- DigitalOcean App Platform
- AWS Elastic Beanstalk / Azure App Service

这些平台可以同时运行你的应用，并对接一个云上 MySQL 实例。

### 3. 建立云上 MySQL

在目标平台创建一个 MySQL 数据库实例：

- Railway：添加 `MySQL` 插件
- Render：选择 managed PostgreSQL/MySQL（如果支持）或自托管数据库
- DigitalOcean：创建一个 Managed Database for MySQL
- AWS：使用 Amazon RDS for MySQL

记录好数据库的连接信息：

- 主机地址（HOST）
- 端口（PORT）
- 用户名（USER）
- 密码（PASSWORD）
- 数据库名（DATABASE）

### 4. 配置云上应用

在云平台创建一个 Web 应用服务：

- 仓库来源：选择你刚推送的 GitHub 仓库
- 分支：通常选择 `main` 或 `master`
- 构建命令：`npm install`
- 启动命令：`npm start`
- 环境变量：
  - `MYSQL_HOST`
  - `MYSQL_PORT`
  - `MYSQL_USER`
  - `MYSQL_PASSWORD`
  - `MYSQL_DATABASE`

如果平台允许，你也可以直接把数据库服务与应用绑定，平台会自动注入环境变量。

### 5. 应用自动初始化

本项目启动时会自动：

- 连接 MySQL
- 创建数据库（如果不存在）
- 创建 `items` 表（如果不存在）

所以你只要保证云数据库连接正确，应用首次启动后就能自动初始化表结构。

### 6. 访问云端地址

部署完成后，平台会给出一个公网 URL，例如：

```text
https://your-app-name.onrender.com
```

任何人都可以通过这个地址访问你的应用。

### 7. 数据持久化与备份

- 请使用云上数据库服务，避免把数据库文件写在无状态容器里。
- 如果你使用 Docker 或容器服务，确保数据库是独立的云数据库实例。
- 定期备份数据库，以防数据丢失。

## 最基础你要做的事

1. 推送项目到 GitHub
2. 选择一个云服务平台
3. 创建云上 MySQL 实例
4. 配置应用的环境变量
5. 部署应用并访问 URL

如果你愿意，我可以继续帮你写一个“Railway 一键部署”的具体步骤。
当前环境未检测到 `node` 和 `npm`，请先安装 Node.js。推荐从 https://nodejs.org 下载 LTS 版本。
