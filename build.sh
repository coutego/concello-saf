#!/bin/bash

# Build script for SAF Barreiros App
# This script builds the Tauri application for production

set -e

echo "🚀 Building SAF Barreiros App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "❌ Rust is not installed. Please install Rust first."
    exit 1
fi

echo "📦 Installing Node dependencies..."
npm install

echo "🔨 Building frontend..."
npm run build

echo "⚙️ Building Tauri application..."
npm run tauri-build

echo "✅ Build completed!"
echo ""
echo "📁 Binaries are located in:"
echo "   - src-tauri/target/release/bundle/"
echo ""
echo "🎉 You can now distribute the application!"