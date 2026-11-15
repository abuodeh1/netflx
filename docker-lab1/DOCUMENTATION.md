# Docker Lab 1: React and Next.js behind Nginx

This lab runs two web apps, React and Next.js, in separate containers behind one Nginx reverse proxy. Nginx reads its configuration from a bind-mounted folder on the host.

## 1. Overview

```
                 Browser
                    │  http://localhost:8080
                    ▼
        ┌───────────────────────┐
        │      nginx-proxy      │◄── ./nginx  (bind mount, read-only)
        │  nginx:1.27-alpine    │
        └─────┬───────────┬─────┘
       /      │           │   /next
              ▼           ▼
     ┌──────────────┐ ┌──────────────┐
     │  react-app   │ │   next-app   │
     │  :3000       │ │   :3000      │
     └──────────────┘ └──────────────┘
           Docker network: lab-net
```

| Service | Image | Role | Reachable from host? |
|---|---|---|---|
| `react` | built from `react-app/Dockerfile` | Static React (Vite) app | No, only through Nginx |
| `next` | built from `next-app/Dockerfile` | Server-rendered Next.js app | No, only through Nginx |
| `nginx` | `nginx:1.27-alpine` | Reverse proxy, the single entry point | Yes, on port 8080 |

Learning goals:

- Containerize a React app and a Next.js app with multi-stage Dockerfiles.
- Route traffic to several containers through one Nginx reverse proxy.
- Use a bind mount to change the Nginx config without rebuilding or restarting the container.
- Use a Docker network so containers can reach each other by service name.

## 2. Prerequisites and project structure

You need Docker Engine with the Compose plugin. The lab was tested with Docker 29.4.3 and Compose v5.1.3 on Ubuntu 22.04 (WSL2). You do not need Node.js on the host: both apps are built inside their images.

```
docker-lab1/
├── docker-compose.yml        # wires the three services together
├── README.md
├── DOCUMENTATION.md
├── react-app/
│   ├── Dockerfile            # multi-stage: build -> serve
│   ├── .dockerignore
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       └── App.jsx
├── next-app/
│   ├── Dockerfile            # multi-stage: build -> standalone server
│   ├── .dockerignore
│   ├── package.json
│   ├── next.config.js        # basePath /next, output standalone
│   └── app/
│       ├── layout.js
│       └── page.js
└── nginx/
    └── default.conf          # bind-mounted into the nginx container
```

## 3. React service

The React app is a small Vite project with one page and a click counter. Its image builds the app in one stage and serves only the built files in the next, on port 3000.

`react-app/Dockerfile`:

```dockerfile
# ---- Stage 1: build the static files ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Stage 2: serve the static files ----
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve@14
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

| Line | Why it is there |
|---|---|
| `FROM node:20-alpine AS build` | Names the first stage so the second stage can copy from it. |
| `COPY package*.json ./` then `RUN npm install` | Copies only the dependency list first. Docker caches this layer, so editing code does not reinstall packages. |
| `RUN npm run build` | Vite writes the finished site to `/app/dist`. |
| Second `FROM` | Starts a clean image. Source code and `node_modules` from stage 1 are left behind. |
| `serve -s dist -l 3000` | Serves the static files on port 3000. `-s` sends unknown paths to `index.html`, which client-side routing needs. |

`.dockerignore` keeps `node_modules` and `dist` from the host out of the build, so the image always builds from a clean state.

## 4. Next.js service

The Next.js app renders its page on the server for each request and lives under `/next`. Two settings in `next.config.js` make that work:

```js
const nextConfig = {
  output: 'standalone',  // small self-contained server in .next/standalone
  basePath: '/next',     // every page and asset URL starts with /next
}
```

- `basePath: '/next'` must match the Nginx `location /next`. Without it, the page loads but its JavaScript and CSS requests go to `/_next/...`, which Nginx sends to React.
- `output: 'standalone'` copies only the files the server needs. The final image does not need a full `node_modules`.

`next-app/Dockerfile`:

```dockerfile
# ---- Stage 1: install dependencies and build ----
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# ---- Stage 2: run the standalone server ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

| Line | Why it is there |
|---|---|
| `ENV HOSTNAME=0.0.0.0` | Makes the server listen on all interfaces. Without it, Nginx in another container cannot reach it. |
| `COPY .next/standalone` | The server and the minimum dependencies it needs. |
| `COPY .next/static` | The standalone output leaves out static assets, so they are copied separately. |
| `node server.js` | Starts the standalone server on `PORT` (3000). |

The page uses `export const dynamic = 'force-dynamic'`, so it shows a new server time on every refresh. That is how you can tell the page is rendered on the server.

## 5. Nginx reverse proxy and the bind mount

Nginx is the only container open to the host. It sends `/next` to the Next.js container and everything else to the React container.

`nginx/default.conf`:

```nginx
upstream react_app {
    server react:3000;    # service name from docker-compose.yml
}

upstream next_app {
    server next:3000;
}

server {
    listen 80;
    server_name localhost;

    # Next.js app (basePath is /next)
    location /next {
        proxy_pass http://next_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # React app (everything else)
    location / {
        proxy_pass http://react_app;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

| Part | What it does |
|---|---|
| `upstream react_app { server react:3000; }` | `react` is the Compose service name. Docker's internal DNS turns it into the container's IP. |
| `location /next` | Matches `/next` and everything under it. Nginx picks the longest matching prefix, so this wins over `/`. |
| `location /` | Catches every other path and sends it to React. |
| `proxy_set_header ...` | Passes the original host, client IP and protocol to the app. |

The bind mount in `docker-compose.yml`:

```yaml
volumes:
  - ./nginx:/etc/nginx/conf.d:ro
```

- **Bind mount**: the container sees the host folder `./nginx` directly. A change on the host shows up inside the container right away, with no rebuild.
- **`:ro`** (read-only): the container can read the config but cannot change it.
- **The whole folder is mounted, not one file.** Many editors (and `sed -i`) save by writing a new file and renaming it over the old one. A single-file bind mount stays attached to the old file, so the container never sees your edit.

## 6. docker-compose.yml

```yaml
services:
  react:
    build: ./react-app
    container_name: react-app
    expose:
      - "3000"
    networks:
      - lab-net

  next:
    build: ./next-app
    container_name: next-app
    expose:
      - "3000"
    networks:
      - lab-net

  nginx:
    image: nginx:1.27-alpine
    container_name: nginx-proxy
    ports:
      - "8080:80"   # host:container (80 is taken on this machine)
    volumes:
      # Bind mount: host folder ./nginx -> container conf.d (read-only)
      - ./nginx:/etc/nginx/conf.d:ro
    depends_on:
      - react
      - next
    networks:
      - lab-net

networks:
  lab-net:
    driver: bridge
```

| Key | Meaning |
|---|---|
| `build: ./react-app` | Build the image from that folder's Dockerfile. |
| `image: nginx:1.27-alpine` | Use the official Nginx image as is. |
| `expose: "3000"` | Documents the port for other containers on the network. Does **not** publish it to the host. |
| `ports: "8080:80"` | Publishes container port 80 on host port 8080. Only Nginx has this. |
| `depends_on` | Starts `react` and `next` before `nginx`. It does not wait for them to be ready. |
| `networks: lab-net` | A user-defined bridge network. Containers on it find each other by service name. |

## 7. Run and verify

Build the images and start the stack:

```bash
cd docker-lab1
docker compose up -d --build
```

Check that all three containers are up:

```bash
docker compose ps
```

Expected:

```
NAME          IMAGE               SERVICE   STATUS   PORTS
next-app      docker-lab1-next    next      Up       3000/tcp
nginx-proxy   nginx:1.27-alpine   nginx     Up       0.0.0.0:8080->80/tcp
react-app     docker-lab1-react   react     Up       3000/tcp
```

Open in a browser:

| URL | Expected page |
|---|---|
| http://localhost:8080/ | "Hello from React container" with a click counter |
| http://localhost:8080/next | "Hello from Next.js container" with the server time |

Or test from the terminal:

```bash
curl -s -o /dev/null -w "%{http_code}\n" localhost:8080/       # 200
curl -s -o /dev/null -w "%{http_code}\n" localhost:8080/next   # 200
```

Prove that only Nginx is published: `react-app` and `next-app` show `3000/tcp` with no `0.0.0.0:` mapping, so `curl localhost:3000` from the host fails.

## 8. Exercise: change the Nginx config through the bind mount

Goal: change Nginx's behaviour without rebuilding or restarting the container.

1. Open `nginx/default.conf` on the host and add this line inside the `server { }` block, under `server_name`:

   ```nginx
   add_header X-Lab "hello-from-bind-mount" always;
   ```

2. Confirm the container sees the change:

   ```bash
   docker compose exec nginx cat /etc/nginx/conf.d/default.conf | grep X-Lab
   ```

3. Test the config, then reload Nginx:

   ```bash
   docker compose exec nginx nginx -t
   docker compose exec nginx nginx -s reload
   ```

4. Check the new header:

   ```bash
   curl -I localhost:8080/
   ```

   Expected: a line `X-Lab: hello-from-bind-mount`.

5. Remove the line, reload again, and confirm the header is gone.

Extra challenges:

- Add a `location /health { return 200 "ok\n"; }` block and test it.
- Try to write a file inside `/etc/nginx/conf.d` from the container. It fails because the mount is `:ro`.

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `localhost` (port 80) returns plain text `404 page not found` | k3s is running on this machine. Its built-in Traefik proxy takes port 80 through firewall rules, so it does not show in `ss -ltn`. | Use port 8080 (the default here), or free port 80: `sudo systemctl stop k3s`, then change `ports` to `"80:80"` and run `docker compose up -d`. |
| Edits to the Nginx config don't take effect | A single file was bind-mounted, and the editor replaced the file. | Mount the folder (`./nginx:/etc/nginx/conf.d:ro`), as this lab does. Then reload Nginx. |
| Edits are visible in the container but behaviour is unchanged | Nginx was not reloaded. | `docker compose exec nginx nginx -s reload` |
| `/next` loads without styles, or JavaScript files return 404 | `basePath` in `next.config.js` doesn't match the Nginx `location`. | Keep both set to `/next`, then `docker compose up -d --build next`. |
| `502 Bad Gateway` | Nginx can't reach an app container: it is stopped, crashed or still starting. | `docker compose ps` and `docker compose logs react next` |
| `wget localhost` inside the Nginx container is refused | `localhost` resolves to IPv6 `::1`, and Nginx listens on IPv4 only. | Use `127.0.0.1` instead. |
| `host not found in upstream "react"` in the Nginx logs | Nginx is not on the same network as the apps. | Check every service lists `networks: [lab-net]`. |

## 10. Cleanup and useful commands

```bash
docker compose ps                         # container status
docker compose logs -f nginx              # follow Nginx logs
docker compose logs react next            # app logs
docker compose exec nginx sh              # shell inside the Nginx container
docker network inspect docker-lab1_lab-net   # containers and IPs on the network
docker compose up -d --build react        # rebuild one service after a code change

docker compose down                       # stop and remove containers and network
docker compose down --rmi local           # also remove the images built by this lab
```
