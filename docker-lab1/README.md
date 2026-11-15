# Docker Lab 1 – React + Next.js behind Nginx

```
            host :8080
                 │
          ┌──────▼──────┐   config bind-mounted from ./nginx
          │ nginx-proxy │
          └──┬───────┬──┘
     /       │       │  /next
   ┌─────────▼─┐   ┌─▼─────────┐
   │ react-app │   │ next-app  │      (network: lab-net)
   │  :3000    │   │  :3000    │
   └───────────┘   └───────────┘
```

| Service | Image | How |
|---------|-------|-----|
| react | built from `react-app/Dockerfile` | multi-stage: Vite build → `serve` static files |
| next  | built from `next-app/Dockerfile`  | multi-stage: `next build` (standalone) → `node server.js` |
| nginx | `nginx:1.27-alpine` | reverse proxy, config from `./nginx` (bind mount) |

## Run

```bash
docker compose up -d --build
```

- React: http://localhost:8080/
- Next:  http://localhost:8080/next

Only nginx publishes a port; react and next are reachable only inside `lab-net`
by their service names (`react:3000`, `next:3000`).

## Bind-mount exercise

1. Edit `nginx/default.conf` on the host (e.g. add `add_header X-Lab "hello" always;` inside `server {}`).
2. Test and reload without restarting the container:
   ```bash
   docker compose exec nginx nginx -t
   docker compose exec nginx nginx -s reload
   curl -I localhost:8080/
   ```

The whole `./nginx` folder is mounted, not just one file. Many editors save by
replacing the file (new inode), and a single-file bind mount would keep
pointing at the old one.

## Useful commands

```bash
docker compose ps
docker compose logs -f nginx
docker network inspect docker-lab1_lab-net
docker compose down          # stop and remove containers + network
```
