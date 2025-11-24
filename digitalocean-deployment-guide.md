# DigitalOcean Deployment Guide

This guide will help you deploy your YouTube Analytics application on DigitalOcean using Docker and Docker Compose.

## Prerequisites

- A DigitalOcean account
- A droplet with Ubuntu 20.04 or later
- A domain name pointing to your droplet's IP address
- Basic knowledge of Linux command line

## Step 1: Provision Your DigitalOcean Droplet

1. Log into your DigitalOcean account
2. Click "Create" and select "Droplets"
3. Choose:
   - Ubuntu 20.04 x64
   - Standard plan with at least 2GB RAM (4GB recommended for production)
   - Choose your region
   - Add your SSH key for secure access
4. Create the droplet

## Step 2: Connect to Your Droplet

```bash
ssh root@your_droplet_ip
```

## Step 3: Install Docker and Docker Compose

Update your system and install necessary packages:

```bash
# Update packages
apt update && apt upgrade -y

# Install prerequisites
apt install apt-transport-https ca-certificates curl software-properties-common -y

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update package index again
apt update

# Install Docker
apt install docker-ce docker-ce-cli containerd.io -y

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Apply executable permissions
chmod +x /usr/local/bin/docker-compose

# Add your user to the docker group
usermod -aG docker ${USER}

# Configure Docker to start on boot
systemctl enable docker
systemctl start docker
```

## Step 4: Create the Application Directory Structure

```bash
# Create project directory
mkdir -p /opt/youtube-analytics/{nodejs-backend,nextjs-youtube-frontend,nginx,ssl,monitoring,initdb}

# Navigate to the project directory
cd /opt/youtube-analytics
```

## Step 5: Set Up Your Application Code

You'll need to copy your backend and frontend code to the appropriate directories:

```bash
# Assuming your code is in a Git repository, clone it
cd /opt/youtube-analytics/nodejs-backend
# Copy your backend code here
# This should include your package.json, server.js, etc.

cd /opt/youtube-analytics/nextjs-youtube-frontend
# Copy your frontend code here
# This should include package.json, next.config.js, etc.
```

## Step 6: Configure Environment Variables

Create your production environment file:

```bash
# Create .env file
nano /opt/youtube-analytics/.env
```

Add the following content, replacing placeholder values with your actual values:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_postgres_password
DB_NAME=youtube_analytics

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_redis_password

# JWT Configuration
JWT_SECRET=your_very_long_and_secure_jwt_secret

# YouTube API Configuration
YOUTUBE_API_KEY=your_youtube_api_key

# Server Configuration
PORT=3000
NODE_ENV=production

# Frontend Configuration
NEXT_PUBLIC_API_URL=https://yourdomain.com

# Nginx Configuration
SERVER_NAME=yourdomain.com

# Monitoring Configuration
GRAFANA_ADMIN_PASSWORD=secure_grafana_password
```

## Step 7: Set Up SSL Certificates

For production, you'll need SSL certificates. Install Certbot and get certificates from Let's Encrypt:

```bash
# Install Certbot
apt install certbot -y

# Get SSL certificates (replace yourdomain.com with your actual domain)
certbot certonly --standalone -d yourdomain.com

# Create SSL directories if they don't exist
mkdir -p /opt/youtube-analytics/ssl/certs
mkdir -p /opt/youtube-analytics/ssl/private

# Copy certificates to the app directory
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/youtube-analytics/ssl/certs/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/youtube-analytics/ssl/private/

# Set proper permissions
chmod -R 600 /opt/youtube-analytics/ssl/
chown -R root:root /opt/youtube-analytics/ssl/
```

## Step 8: Set Up Nginx Configuration

Create the Nginx configuration:

```bash
# Create conf.d directory
mkdir -p /opt/youtube-analytics/nginx/conf.d

# Create nginx.conf
cat > /opt/youtube-analytics/nginx/nginx.conf << 'EOF'
# Nginx configuration for YouTube Analytics application

# Define upstream servers
upstream backend {
    server backend:3000;
}

upstream frontend {
    server frontend:3000;
}

# Main server configuration
server {
    listen 80;
    server_name ${SERVER_NAME};

    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

# SSL/HTTPS server configuration
server {
    listen 443 ssl http2;
    server_name ${SERVER_NAME};

    # SSL Configuration
    ssl_certificate ${SSL_CERT_PATH};
    ssl_certificate_key ${SSL_KEY_PATH};
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Logging
    access_log /var/log/nginx/youtube-analytics.access.log;
    error_log /var/log/nginx/youtube-analytics.error.log;

    # API routes - proxy to backend
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Security headers for API
        add_header X-Content-Type-Options nosniff;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend routes - proxy to Next.js app
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}

# Additional server for monitoring
server {
    listen 8080;
    server_name _;
    
    location / {
        return 301 https://$server_name:443$request_uri;
    }
}

# Security: Block access to sensitive files
location ~ /\. {
    deny all;
    log_not_found off;
    access_log off;
}

# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
EOF
```

## Step 9: Set Up Monitoring Configuration

Create monitoring configuration files:

```bash
# Create monitoring directories
mkdir -p /opt/youtube-analytics/monitoring/{dashboards,datasources}

# Create Prometheus configuration
cat > /opt/youtube-analytics/monitoring/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
EOF

# Create Grafana datasource configuration
cat > /opt/youtube-analytics/monitoring/datasources/datasource.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    url: http://prometheus:9090
    access: proxy
    isDefault: true
EOF
```

## Step 10: Create Database Initialization Scripts

Create your database schema initialization script:

```bash
# Create database initialization script
cat > /opt/youtube-analytics/initdb/001_schema.sql << 'EOF'
-- PostgreSQL database schema for YouTube Analytics

-- Channels table
CREATE TABLE channels (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    custom_url VARCHAR(255),
    thumbnail_url VARCHAR(500),
    banner_url VARCHAR(500),
    subscriber_count BIGINT,
    video_count BIGINT,
    view_count BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Videos table
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR(50) UNIQUE NOT NULL,
    channel_id VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    published_at TIMESTAMP NOT NULL,
    duration_seconds INTEGER,
    view_count BIGINT,
    like_count BIGINT,
    comment_count BIGINT,
    thumbnail_url VARCHAR(500),
    is_short BOOLEAN DEFAULT FALSE,
    category_id VARCHAR(10),
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES channels(channel_id)
);

-- Channel analytics summary table
CREATE TABLE channel_analytics (
    id SERIAL PRIMARY KEY,
    channel_id VARCHAR(50) NOT NULL,
    total_videos BIGINT,
    total_shorts BIGINT,
    shorts_percentage DECIMAL(5,2),
    total_views BIGINT,
    average_view_count DECIMAL(15,2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES channels(channel_id)
);

-- Job queue table (for tracking background jobs)
CREATE TABLE job_queue (
    id SERIAL PRIMARY KEY,
    job_type VARCHAR(50) NOT NULL,
    channel_id VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    progress INTEGER DEFAULT 0
);

-- Indexes for better performance
CREATE INDEX idx_videos_channel_id ON videos(channel_id);
CREATE INDEX idx_videos_published_at ON videos(published_at);
CREATE INDEX idx_videos_is_short ON videos(is_short);
CREATE INDEX idx_channel_analytics_channel_id ON channel_analytics(channel_id);
CREATE INDEX idx_job_queue_status ON job_queue(status);
CREATE INDEX idx_job_queue_channel_id ON job_queue(channel_id);
EOF
```

## Step 11: Create Docker Compose File

Create the production Docker Compose file:

```bash
cat > /opt/youtube-analytics/docker-compose.yml << 'EOF'
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: youtube_analytics_postgres_prod
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./initdb:/docker-entrypoint-initdb.d
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: youtube_analytics_redis_prod
    command: redis-server --requirepass ${REDIS_PASSWORD}
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    environment:
      - REDIS_PASSWORD=${REDIS_PASSWORD}
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend API
  backend:
    build:
      context: ./nodejs-backend
      dockerfile: Dockerfile
    container_name: youtube_analytics_backend_prod
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_NAME=${DB_NAME}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=${REDIS_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - YOUTUBE_API_KEY=${YOUTUBE_API_KEY}
      - PORT=3000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend Next.js App
  frontend:
    build:
      context: ./nextjs-youtube-frontend
      dockerfile: Dockerfile
    container_name: youtube_analytics_frontend_prod
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    networks:
      - app-network
    restart: unless-stopped
    depends_on:
      - backend

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: youtube_analytics_nginx_prod
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./ssl/certs:/etc/ssl/certs
      - ./ssl/private:/etc/ssl/private
    depends_on:
      - backend
      - frontend
    networks:
      - app-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "service", "nginx", "status"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Monitoring - Prometheus
  prometheus:
    image: prom/prometheus
    container_name: youtube_analytics_prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - app-network
    restart: unless-stopped

  # Monitoring - Grafana
  grafana:
    image: grafana/grafana
    container_name: youtube_analytics_grafana
    ports:
      - "3003:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/datasources:/etc/grafana/provisioning/datasources
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_ADMIN_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    networks:
      - app-network
    restart: unless-stopped
    depends_on:
      - prometheus

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  app-network:
    driver: bridge
EOF
```

## Step 12: Set Up Firewall

Configure the firewall to allow necessary traffic:

```bash
# Allow SSH, HTTP, and HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'

# Enable firewall
ufw --force enable

# Check status
ufw status
```

## Step 13: Deploy the Application

Now deploy your application:

```bash
# Navigate to the project directory
cd /opt/youtube-analytics

# Build and start the services
docker-compose up -d

# Check the status of all services
docker-compose ps

# View logs for any issues
docker-compose logs -f
```

## Step 14: Configure SSL Certificate Renewal

Set up auto-renewal for your Let's Encrypt certificates:

```bash
# Test the renewal process
certbot renew --dry-run

# Add a cron job for automatic renewal
crontab -e

# Add the following line to run twice daily
0 12 * * * /usr/bin/certbot renew --quiet
```

## Step 15: Configure Automatic Docker Restart

To ensure containers restart after system reboots:

```bash
# Verify that Docker is configured to start on boot
systemctl is-enabled docker

# If not enabled, enable it
systemctl enable docker
```

## Step 16: Verify Deployment

Check that all services are running properly:

```bash
# Check all containers
docker-compose ps

# Check logs for the nginx container
docker-compose logs nginx

# Test the application
curl -I https://yourdomain.com
```

## Monitoring and Maintenance

### Accessing Grafana Dashboard
- Visit `https://yourdomain.com:3003`
- Use the credentials from your .env file (`GRAFANA_ADMIN_PASSWORD`)

### Database Backup
```bash
# Create a backup of the database
docker exec youtube_analytics_postgres_prod pg_dump -U postgres youtube_analytics > backup.sql
```

### Updating the Application
```bash
# Stop the current services
docker-compose down

# Pull the latest code
cd /opt/youtube-analytics/nodejs-backend
git pull origin main

cd /opt/youtube-analytics/nextjs-youtube-frontend
git pull origin main

# Rebuild and start services
docker-compose build
docker-compose up -d
```

## Troubleshooting

### If Nginx is not starting
- Check the SSL certificate paths in the nginx configuration
- Ensure SSL certificates have the correct permissions
- Verify that port 80 and 443 are not in use by other services

### If the application is not accessible
- Check firewall settings
- Verify DNS is pointing to your droplet's IP
- Check the application logs: `docker-compose logs -f <service-name>`

### If the database won't start
- Check that the init script is correctly formatted
- Ensure the database volume has the correct permissions
- Check database logs: `docker-compose logs postgres`

## Scaling Considerations

For high-traffic applications, consider:

1. Using DigitalOcean's managed database service instead of a containerized database
2. Adding Redis as a managed service
3. Using a CDN for static assets
4. Scaling application containers with multiple replicas
5. Implementing load balancing for multiple application instances