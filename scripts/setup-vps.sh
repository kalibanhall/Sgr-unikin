#!/bin/bash
set -e

echo "========================================"
echo " SGR-UNIKIN VPS Setup Script"
echo "========================================"

# Update system
echo "[1/10] Updating system..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get upgrade -y -qq

# Install essentials
echo "[2/10] Installing essentials..."
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx ufw postgresql postgresql-contrib build-essential

# Install Node.js 20
echo "[3/10] Installing Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
fi
node -v
npm -v

# Install PM2
echo "[4/10] Installing PM2..."
npm install -g pm2

# Setup PostgreSQL
echo "[5/10] Setting up PostgreSQL..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='sgr_user'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER sgr_user WITH PASSWORD 'SgrUnikin2026!Secure';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='sgr_unikin'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE sgr_unikin OWNER sgr_user;"

sudo -u postgres psql -d sgr_unikin -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE sgr_unikin TO sgr_user;"
sudo -u postgres psql -d sgr_unikin -c "GRANT ALL ON SCHEMA public TO sgr_user;"
sudo -u postgres psql -d sgr_unikin -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO sgr_user;"

echo "[6/10] Configuring firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# Clone repository
echo "[7/10] Cloning repository..."
mkdir -p /var/www
cd /var/www
if [ -d "sgr-unikin" ]; then
    cd sgr-unikin
    git pull
else
    git clone https://github.com/kalibanhall/Sgr-unikin.git sgr-unikin
    cd sgr-unikin
fi

# Create uploads directory
mkdir -p uploads

# Create .env file
echo "[8/10] Creating environment file..."
cat > .env << 'ENVEOF'
DATABASE_URL=postgresql://sgr_user:SgrUnikin2026!Secure@localhost:5432/sgr_unikin
NEXTAUTH_SECRET=MVUvJ+CWYEzSVbkbMyUFi9sSNUV+WuF4kWIiX6lzTCI=
NEXTAUTH_URL=https://sgr.unikin.ac.cd
AUTH_TRUST_HOST=true
NODE_ENV=production
ENVEOF

# Install dependencies & build
echo "[9/10] Installing dependencies & building..."
npm ci
npm run build

# Setup PM2
echo "[10/10] Starting application with PM2..."
pm2 delete sgr-unikin 2>/dev/null || true
pm2 start npm --name "sgr-unikin" -- start
pm2 save
pm2 startup systemd -u root --hp /root

# Setup Nginx
cat > /etc/nginx/sites-available/sgr-unikin << 'NGINXEOF'
server {
    listen 80;
    server_name sgr.unikin.ac.cd;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        client_max_body_size 50M;
    }
}

server {
    listen 80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
        client_max_body_size 50M;
    }
}
NGINXEOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/sgr-unikin /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Setup daily backup
echo "[BONUS] Setting up daily database backup..."
mkdir -p /var/backups/postgresql
cat > /etc/cron.daily/backup-sgr << 'BACKUPEOF'
#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump sgr_unikin > "$BACKUP_DIR/sgr_unikin_$DATE.sql"
# Keep only last 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
BACKUPEOF
chmod +x /etc/cron.daily/backup-sgr

echo ""
echo "========================================"
echo " SETUP COMPLETE!"
echo "========================================"
echo "App running on http://5.189.163.4:3000"
echo "Nginx proxy on http://5.189.163.4"
echo ""
echo "Next steps:"
echo "1. Point sgr.unikin.ac.cd A record to 5.189.163.4"
echo "2. Run: certbot --nginx -d sgr.unikin.ac.cd"
echo "========================================"
