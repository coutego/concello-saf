#!/bin/bash

cd "$(dirname "$0")/saf-tauri-app"

echo "Building frontend..."
npm run build

echo "Starting Tauri app..."
npm run tauri dev