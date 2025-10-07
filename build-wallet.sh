#!/bin/bash

# Build script for React Privy Wallet integration
echo "🔨 Building React Privy Wallet..."

# Navigate to wallet directory
cd wallet

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Build the wallet bundle
echo "🏗️ Building wallet bundle..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Wallet bundle built successfully!"
    echo "📁 Output: dist/wallet.bundle.js"
else
    echo "❌ Build failed!"
    exit 1
fi

# Go back to game directory
cd ..

echo "🎉 Build complete! You can now run your game with Privy wallet integration."


