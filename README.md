# LAMP template

A ready-to-use **L**inux / **A**pache / **M**ariaDB / **P**HP stack running in Docker, with phpMyAdmin.

## Requirements

- [Node.js](https://nodejs.org/) 18+
- [Docker](https://docs.docker.com/get-docker/) with the `docker compose` plugin

## Usage

```bash
npm run config   # pick the PHP version (7.0 → latest), saved in .env
npm start        # start the stack on a random port and open the browser
```

`Ctrl+C` stops all the containers.

| URL                                   | What                                        |
| ------------------------------------- | ------------------------------------------- |
| `http://localhost:<port>/`            | Your website (files from `./www`)           |
| `http://localhost:<port>/phpMyAdmin/` | phpMyAdmin, user `admin`, password `admin`  |

From PHP, connect to the database with host `db`, user `admin`, password `admin` (default database: `app`).

## Structure

```
.
├── www/                 Website root (Apache DocumentRoot), edit your PHP files here
├── db/                  MariaDB data files (git-ignored)
├── docker/
│   ├── Dockerfile       php:<version>-apache image + mysqli/pdo_mysql + proxy modules
│   ├── apache/          Apache config proxying /phpMyAdmin/ to the phpMyAdmin container
│   └── mariadb/         SQL scripts run once, when ./db is empty
├── scripts/
│   ├── config.mjs       `npm run config`: chooses the PHP version
│   └── start.mjs        `npm start`: picks a free port, runs docker compose, opens the browser
├── docker-compose.yml   The 3 services: web (Apache+PHP), db (MariaDB), phpmyadmin
└── .env                 Local configuration (PHP_VERSION), git-ignored
```

## Network

Only Apache is published, and only on `127.0.0.1`.
MariaDB and phpMyAdmin are reachable from inside the Docker network only;
phpMyAdmin is exposed through Apache's reverse proxy.

### Access from other machines

To reach the website from your local network, remove the `127.0.0.1:` prefix
of the `web` port in `docker-compose.yml`:

```yaml
    ports:
      - "${HTTP_PORT:-8080}:80"
```

Then use `http://<your-ip>:<port>/`. For phpMyAdmin, also replace `localhost`
with your IP (or hostname) in `PMA_ABSOLUTE_URI`, otherwise its redirects
point to `localhost`:

```yaml
      PMA_ABSOLUTE_URI: http://192.168.1.42:${HTTP_PORT:-8080}/phpMyAdmin/
```

⚠️ phpMyAdmin then becomes reachable by anyone on the network with
`admin` / `admin`: change the passwords before doing this.
Remember that the port changes on each `npm start`.

## Reset the database

Stop the stack, then delete the content of `./db` (except `.gitkeep`).
The files belong to the container's `mysql` user, so you may need `sudo`.
