#!/bin/bash
# Vercel build script
# Handles monorepo builds for Vercel deployment

set -e

echo "Starting Vercel build..."

# Install dependencies (skip optional for faster installs)
echo "Installing dependencies..."
npm ci --omit=optional || npm install --omit=optional

# Build dependencies first
echo "Building dependencies..."
npm run build --workspace=@settler/protocol || true
npm run build --workspace=@settler/sdk || true
npm run build --workspace=@settler/react-settler || true

# Build web package
echo "Building web package..."
npm run build --workspace=@settler/web

echo "Build completed successfully!"
