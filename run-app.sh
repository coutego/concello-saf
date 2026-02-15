#!/bin/bash

echo "Building frontend..."
npm run build

echo "Starting Tauri app..."
npm run tauri dev
