# Vultr + GHCR 自动部署文档

本文记录当前项目的实际部署方式。目标是以后改代码后，只需要 push 到 `main`，GitHub Actions 自动构建镜像、推送 GHCR，并在 Vultr 服务器热部署。

## 当前项目配置

- GitHub 仓库：`felory/chinese-magic`
- 应用名：`chinese-magic`
- 服务名：`web`
- 容器名：`chinese-magic-web`
- 镜像地址：`ghcr.io/felory/chinese-magic-web:latest`
- 服务器目录：`/app/chinese-magic`
- 服务器用户：`deploy`
- 应用端口：`18080`
- 容器健康检查：`http://127.0.0.1:18080/health`
- 当前公网访问：`http://149.28.95.228:18080`

当前是 Vite 静态站，生产镜像使用 Nginx 托管 `dist/`。应用没有后端 API，所以额外在 Nginx 配置里提供 `/health` 返回 `ok`。

## 本机环境变量

本机部署信息沉淀在：

```bash
~/.config/chinese-magic/deploy.env
```

加载方式：

```bash
source ~/.config/chinese-magic/deploy.env
```

可用变量：

```bash
$CHINESE_MAGIC_REPO
$CHINESE_MAGIC_REMOTE
$CHINESE_MAGIC_GHCR_IMAGE
$CHINESE_MAGIC_APP_NAME
$CHINESE_MAGIC_CONTAINER_NAME
$CHINESE_MAGIC_VPS_HOST
$CHINESE_MAGIC_VPS_USER
$CHINESE_MAGIC_VPS_PORT
$CHINESE_MAGIC_VPS_SSH_KEY_PATH
$CHINESE_MAGIC_SERVER_DIR
$CHINESE_MAGIC_PUBLIC_URL
$CHINESE_MAGIC_HEALTH_URL
```

注意：环境变量只保存私钥路径，不保存私钥正文。私钥正文保存在：

```bash
~/.ssh/chinese_magic_vultr_deploy
```

GitHub token 不落明文，使用 `gh` 的系统钥匙串登录态。

## 仓库文件

CI/CD 相关文件：

- `.github/workflows/web-ghcr.yml`
- `Dockerfile`
- `.dockerignore`
- `deploy/nginx.conf`
- `deploy/docker-compose.prod.yml`
- `deploy/.env.example`

样式变量文件：

- `src/styles/theme.css`

不要把真实 `.env`、GitHub PAT、GHCR token、SSH 私钥提交到仓库。

## GitHub Secrets

仓库需要配置 Actions Secrets：

```text
VPS_HOST      Vultr 服务器 IP 或域名
VPS_USER      deploy
VPS_PORT      22
VPS_SSH_KEY   deploy 用户可用的 SSH 私钥完整内容
```

本项目当前使用：

```text
VPS_HOST=149.28.95.228
VPS_USER=deploy
VPS_PORT=22
```

`VPS_SSH_KEY` 不记录在文档中。本机当前私钥文件路径是：

```bash
~/.ssh/chinese_magic_vultr_deploy
```

配置或更新 Secrets：

```bash
source ~/.config/chinese-magic/deploy.env
gh secret set VPS_HOST --repo "$CHINESE_MAGIC_REPO" --body "$CHINESE_MAGIC_VPS_HOST"
gh secret set VPS_USER --repo "$CHINESE_MAGIC_REPO" --body "$CHINESE_MAGIC_VPS_USER"
gh secret set VPS_PORT --repo "$CHINESE_MAGIC_REPO" --body "$CHINESE_MAGIC_VPS_PORT"
gh secret set VPS_SSH_KEY --repo "$CHINESE_MAGIC_REPO" < "$CHINESE_MAGIC_VPS_SSH_KEY_PATH"
```

## 服务器准备

服务器需要满足：

- `deploy` 用户可以 SSH 登录
- `deploy` 用户可以运行 `docker` 和 `docker compose`
- `/app/chinese-magic` 目录存在，或 workflow 能创建
- `/app/chinese-magic/.env` 存在，或 workflow 能创建空文件
- 如果 GHCR package 是 private，服务器已经 `docker login ghcr.io`

检查服务器：

```bash
source ~/.config/chinese-magic/deploy.env
ssh -i "$CHINESE_MAGIC_VPS_SSH_KEY_PATH" -p "$CHINESE_MAGIC_VPS_PORT" "$CHINESE_MAGIC_VPS_USER@$CHINESE_MAGIC_VPS_HOST" \
  'whoami && docker --version && docker compose version'
```

初始化服务器目录：

```bash
source ~/.config/chinese-magic/deploy.env
ssh -i "$CHINESE_MAGIC_VPS_SSH_KEY_PATH" -p "$CHINESE_MAGIC_VPS_PORT" "$CHINESE_MAGIC_VPS_USER@$CHINESE_MAGIC_VPS_HOST" \
  'mkdir -p /app/chinese-magic && touch /app/chinese-magic/.env'
```

当前 `/app/chinese-magic/.env` 可以为空。若要覆盖端口或绑定地址，可写：

```text
APP_BIND=0.0.0.0
APP_PORT=18080
```

## 自动部署流程

触发条件：

- push 到 `main`
- 且改动命中 workflow 里的 paths，例如 `src/**`、`data/**`、`deploy/**`、`Dockerfile` 等

流程：

1. Checkout 仓库
2. 固定 pnpm：`pnpm@10.17.1`
3. Node 20 安装依赖
4. `pnpm lint`
5. `pnpm build`
6. Docker 构建镜像
7. 推送到 GHCR，tag 包含：
   - `latest`
   - `main`
   - `sha-*`
8. SSH 到 Vultr
9. 同步 `deploy/docker-compose.prod.yml` 到：
   - `/app/chinese-magic/docker-compose.yml`
10. 执行：
    - `docker compose pull`
    - `docker compose up -d`
11. 重试健康检查：
    - `curl -fsS http://127.0.0.1:18080/health`
12. 失败时输出容器日志尾部：
    - `docker logs --tail 80 chinese-magic-web`

## 日常热部署

改完代码后：

```bash
pnpm lint
pnpm build
git status --short
git add .
git commit -m "你的提交信息"
git push
```

查看最新 GitHub Actions：

```bash
source ~/.config/chinese-magic/deploy.env
gh run list --repo "$CHINESE_MAGIC_REPO" --workflow web-ghcr --limit 3
```

等待最新 run：

```bash
source ~/.config/chinese-magic/deploy.env
run_id=$(gh run list --repo "$CHINESE_MAGIC_REPO" --workflow web-ghcr --limit 1 --json databaseId --jq '.[0].databaseId')
gh run watch "$run_id" --repo "$CHINESE_MAGIC_REPO" --exit-status
```

失败时看日志：

```bash
gh run view "$run_id" --repo "$CHINESE_MAGIC_REPO" --log-failed
```

服务器检查：

```bash
source ~/.config/chinese-magic/deploy.env
ssh -i "$CHINESE_MAGIC_VPS_SSH_KEY_PATH" -p "$CHINESE_MAGIC_VPS_PORT" "$CHINESE_MAGIC_VPS_USER@$CHINESE_MAGIC_VPS_HOST" \
  'cd /app/chinese-magic && docker compose ps && curl -fsS http://127.0.0.1:18080/health'
```

公网检查：

```bash
source ~/.config/chinese-magic/deploy.env
curl -I "$CHINESE_MAGIC_PUBLIC_URL/"
curl -fsS "$CHINESE_MAGIC_HEALTH_URL"
```

## 手动重新部署

如果代码没有变化，但想重新部署最新镜像：

```bash
source ~/.config/chinese-magic/deploy.env
gh run list --repo "$CHINESE_MAGIC_REPO" --workflow web-ghcr --limit 3
gh run rerun <RUN_ID> --repo "$CHINESE_MAGIC_REPO"
gh run watch <RUN_ID> --repo "$CHINESE_MAGIC_REPO" --exit-status
```

也可以在服务器手动拉取：

```bash
source ~/.config/chinese-magic/deploy.env
ssh -i "$CHINESE_MAGIC_VPS_SSH_KEY_PATH" -p "$CHINESE_MAGIC_VPS_PORT" "$CHINESE_MAGIC_VPS_USER@$CHINESE_MAGIC_VPS_HOST"
cd /app/chinese-magic
docker compose pull
docker compose up -d
docker compose ps
curl -fsS http://127.0.0.1:18080/health
```

## 常见问题

### pnpm / Node 版本失败

曾经遇到过 GitHub Actions 中 Corepack 自动拉 `pnpm@11`，但 Node 20 不兼容，报：

```text
No such built-in module: node:sqlite
```

解决方式：

- `package.json` 固定：
  - `"packageManager": "pnpm@10.17.1"`
- workflow 和 Dockerfile 都执行：
  - `corepack enable && corepack prepare pnpm@10.17.1 --activate`

### Secrets 为空

如果日志出现：

```text
Bad port ''
```

说明 GitHub Secrets 没配好，重点检查：

- `VPS_HOST`
- `VPS_USER`
- `VPS_PORT`
- `VPS_SSH_KEY`

### 服务器拉不到 GHCR 镜像

如果 `docker compose pull` 失败，服务器需要登录 GHCR：

```bash
docker login ghcr.io
```

使用有 `read:packages` 权限的 GitHub PAT。

### 手机打不开

当前 compose 绑定：

```yaml
ports:
  - "${APP_BIND:-0.0.0.0}:${APP_PORT:-18080}:80"
```

所以公网入口是：

```text
http://149.28.95.228:18080
```

如果打不开，检查：

```bash
source ~/.config/chinese-magic/deploy.env
ssh -i "$CHINESE_MAGIC_VPS_SSH_KEY_PATH" -p "$CHINESE_MAGIC_VPS_PORT" "$CHINESE_MAGIC_VPS_USER@$CHINESE_MAGIC_VPS_HOST" \
  'ss -ltnp | grep 18080; cd /app/chinese-magic && docker compose ps'
```

还要检查 Vultr 防火墙和系统防火墙是否允许 `18080`。

## 正式域名和 HTTPS

当前服务器的 `80/443` 已经有系统 Nginx 占用，且 `deploy` 用户没有免密 sudo，因此 workflow 不能直接改系统 Nginx。

正式上线建议：

1. 域名解析到 `149.28.95.228`
2. 用 root 或具备 sudo 权限的用户配置 Nginx / Caddy
3. 把域名反向代理到：

```text
http://127.0.0.1:18080
```

Nginx 示例：

```nginx
server {
  listen 80;
  server_name your-domain.com;

  location / {
    proxy_pass http://127.0.0.1:18080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

配置后检查：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

再用 certbot 或 Caddy 自动签 HTTPS。
