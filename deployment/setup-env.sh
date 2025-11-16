#!/bin/bash

# Deployment setup script
echo "🚀 Setting up production environment..."

# Check if required environment variables are set
required_vars=("MONGODB_URI" "JWT_SECRET" "SESSION_SECRET" "CLIENT_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: $var is not set"
        exit 1
    fi
done

echo "✅ All required environment variables are set"
echo "📦 Installing dependencies..."

# Install backend dependencies
cd server
npm ci --only=production
cd ..

# Install frontend dependencies and build
cd client
npm ci
npm run build
cd ..

echo "✅ Setup completed successfully"