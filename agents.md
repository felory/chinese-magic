# Agents Index

This file is the quick index for future Codex work in this project.

## Deployment

Use [docs/deploy-vultr-ghcr.md](docs/deploy-vultr-ghcr.md) for every future deployment or hot-deploy update.

Current production path:

- GitHub repo: `felory/chinese-magic`
- Workflow: `.github/workflows/web-ghcr.yml`
- Image: `ghcr.io/felory/chinese-magic-web:latest`
- Server directory: `/app/chinese-magic`
- Container: `chinese-magic-web`
- Public URL: `http://149.28.95.228:18080`
- Health URL: `http://149.28.95.228:18080/health`

Local deployment env is stored outside the repo:

```bash
source ~/.config/chinese-magic/deploy.env
```

Do not commit real `.env`, GitHub PAT, GHCR token, SSH private keys, or copied secret values.

## Content Agents

- Main project plan: [agent.md](agent.md)
- Translator subagent: [agents/translater/agent.md](agents/translater/agent.md)
- Logic subagent: [agents/logic/agent.md](agents/logic/agent.md)

For content work, keep using the manual JSON workflow described in `agent.md`. For deployment work, do not improvise from memory; follow `docs/deploy-vultr-ghcr.md`.

