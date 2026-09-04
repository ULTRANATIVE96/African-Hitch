#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Limpopo Hitch Connect Automated Deployment..."

# 1. Update Backend Dependencies & Build
echo "📦 Installing backend dependencies..."
cd limpopo-hitch-backend
npm install --production=false

echo "🗄️ Running Prisma database migrations..."
npx prisma generate
npx prisma db push

echo "🔨 Building TypeScript backend..."
npm run build

# 2. Update Frontend & Build
echo "📦 Installing frontend dependencies..."
cd ../limpopo-hitch-main
npm install

echo "🔨 Building React frontend bundle..."
npm run build

# 3. Deploy Frontend Static Files
echo "📁 Syncing static frontend bundle to Nginx web root..."
sudo mkdir -p /var/www/limpopo-hitch/dist
sudo cp -r dist/* /var/www/limpopo-hitch/dist/

# 4. Restart Backend PM2 Service
echo "🔄 Reloading PM2 backend service..."
cd ../limpopo-hitch-backend
pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs

# 5. Reload Nginx Web Server
echo "🌐 Reloading Nginx..."
sudo systemctl reload nginx

echo "✅ Limpopo Hitch Connect Deployment Complete!"
