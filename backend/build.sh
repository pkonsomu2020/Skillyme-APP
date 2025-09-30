#!/bin/bash

# Production build script for Skillyme Backend
echo "🚀 Building Skillyme Backend for Production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads

# Set permissions
echo "🔐 Setting permissions..."
chmod 755 server.js
chmod 755 database_migrations/*.js

echo "✅ Build completed successfully!"
echo "🎯 Ready for deployment to Render"
