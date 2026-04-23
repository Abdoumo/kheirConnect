# VPS Deployment Guide

This guide covers deploying the Fusion Starter application to a Virtual Private Server (VPS).

## Prerequisites

- A VPS running Linux (Ubuntu 20.04+ recommended)
- Node.js 22+ and npm installed
- Git installed
- SSH access to your VPS
- A domain name (optional but recommended)

## Deployment Steps

### 1. Connect to Your VPS

```bash
ssh root@your_vps_ip_address
```

### 2. Install Node.js and npm (if not already installed)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify installation:
```bash
node --version
npm --version
```

### 3. Install pnpm (recommended)

```bash
npm install -g pnpm
```

### 4. Clone Your Repository

```bash
cd /home
git clone <your-repo-url> app
cd app
```

### 5. Install Dependencies

```bash
pnpm install --no-frozen-lockfile
```

### 6. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
nano .env
```

Add the following variables (adjust as needed):

```env
# Server Configuration
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Database Configuration
MONGODB_URI=mongodb://your_db_uri
DB_NAME=khair_db

# JWT Configuration
JWT_SECRET=your_secure_random_secret_key_here

# API Base URL
API_BASE_URL=https://yourdomain.com

# Other configuration as needed
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 7. Build the Application

```bash
npm run build
```

This will create:
- `dist/spa/` - Production build of the React frontend
- `dist/server/node-build.mjs` - Production server build

### 8. Set Up Process Management with PM2

Install PM2 globally:

```bash
npm install -g pm2
```

Create a PM2 ecosystem config file (`ecosystem.config.js`):

```javascript
module.exports = {
  apps: [
    {
      name: "fusion-app",
      script: "./dist/server/node-build.mjs",
      env: {
        NODE_ENV: "production",
        PORT: 8080,
      },
      instances: "max",
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "500M",
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
    },
  ],
};
```

Start the application:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 9. Set Up Nginx as Reverse Proxy (Optional but Recommended)

Install Nginx:

```bash
sudo apt-get update
sudo apt-get install -y nginx
```

Create an Nginx config file:

```bash
sudo nano /etc/nginx/sites-available/default
```

Replace the content with:

```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Test Nginx config:

```bash
sudo nginx -t
```

Enable and start Nginx:

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 10. Set Up HTTPS with Let's Encrypt (Recommended)

Install Certbot:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
```

Generate SSL certificate:

```bash
sudo certbot certonly --nginx -d your_domain.com -d www.your_domain.com
```

Update Nginx config to use SSL:

```bash
sudo nano /etc/nginx/sites-available/default
```

```nginx
server {
    listen 80;
    server_name your_domain.com www.your_domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your_domain.com www.your_domain.com;

    ssl_certificate /etc/letsencrypt/live/your_domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your_domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Reload Nginx:

```bash
sudo systemctl reload nginx
```

Set up automatic certificate renewal:

```bash
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

## Updating the Application

When you need to deploy updates:

```bash
cd /home/app
git pull origin main
pnpm install --no-frozen-lockfile
npm run build
pm2 restart all
```

## Monitoring and Maintenance

### Check Application Status

```bash
pm2 status
pm2 logs fusion-app
```

### Monitor System Resources

```bash
pm2 monit
```

### View Nginx Logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backup Database

Create a backup script (`backup.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/home/app/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/backup_$TIMESTAMP"
```

Make it executable and add to cron:

```bash
chmod +x backup.sh
crontab -e
```

Add line to run daily at 2 AM:

```
0 2 * * * /home/app/backup.sh
```

## Troubleshooting

### Application Won't Start

1. Check logs: `pm2 logs fusion-app`
2. Verify environment variables: `cat .env`
3. Test build locally: `npm run build`
4. Check Node.js version: `node --version` (should be 22+)

### Database Connection Issues

1. Verify connection string in `.env`
2. Check MongoDB is running and accessible
3. Verify firewall rules allow database access

### Nginx Errors

1. Test config: `sudo nginx -t`
2. Check logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify proxy settings are correct

### Port Already in Use

```bash
sudo lsof -i :8080
kill -9 <PID>
pm2 restart all
```

## Security Best Practices

1. **Keep system updated:**
   ```bash
   sudo apt-get update
   sudo apt-get upgrade -y
   ```

2. **Use strong passwords and SSH keys**

3. **Enable firewall:**
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   ```

4. **Use environment variables for secrets** - Never commit `.env` to git

5. **Enable automatic updates:**
   ```bash
   sudo apt-get install -y unattended-upgrades
   ```

6. **Monitor application logs regularly**

## Performance Optimization

1. **Enable compression in Nginx** - Add to nginx config:
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json;
   ```

2. **Use CDN for static assets** - Consider cloudflare or similar

3. **Monitor and optimize database queries**

4. **Enable caching headers** - Add to nginx location block:
   ```nginx
   expires 30d;
   add_header Cache-Control "public, immutable";
   ```

## Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Cloud MongoDB hosting
- [Let's Encrypt](https://letsencrypt.org/) - Free SSL certificates
