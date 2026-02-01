#!/bin/bash

# LiveKit Setup Script
# Helps you choose between LiveKit Cloud or self-hosted setup

set -e

echo "🎙️ LiveKit Voice Agent Setup"
echo "=============================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file first"
    exit 1
fi

echo "Choose LiveKit deployment option:"
echo ""
echo "1️⃣  LiveKit Cloud (Recommended for quick start)"
echo "   - Free tier: 1,000 minutes/month, 5 concurrent sessions"
echo "   - Managed infrastructure, auto-scaling"
echo "   - Setup time: ~5 minutes"
echo ""
echo "2️⃣  Self-hosted with Docker (Unlimited, free)"
echo "   - Unlimited concurrent users"
echo "   - Requires Docker installed"
echo "   - Setup time: ~10 minutes"
echo ""
echo "3️⃣  Skip (Configure manually later)"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "🌐 Setting up LiveKit Cloud"
        echo "============================"
        echo ""
        echo "Steps:"
        echo "1. Visit https://cloud.livekit.io"
        echo "2. Sign up for free account (no credit card required)"
        echo "3. Create a new project"
        echo "4. Go to Settings → API Keys"
        echo "5. Copy your credentials:"
        echo ""
        echo "   - LiveKit URL (e.g., wss://your-project.livekit.cloud)"
        echo "   - API Key"
        echo "   - API Secret"
        echo ""
        
        read -p "LiveKit URL (wss://...): " LIVEKIT_URL
        read -p "API Key: " LIVEKIT_API_KEY
        read -p "API Secret: " LIVEKIT_API_SECRET
        
        # Update .env file
        if grep -q "^LIVEKIT_URL=" .env; then
            sed -i '' "s|^LIVEKIT_URL=.*|LIVEKIT_URL=$LIVEKIT_URL|" .env
        else
            echo "LIVEKIT_URL=$LIVEKIT_URL" >> .env
        fi
        
        if grep -q "^LIVEKIT_API_KEY=" .env; then
            sed -i '' "s|^LIVEKIT_API_KEY=.*|LIVEKIT_API_KEY=$LIVEKIT_API_KEY|" .env
        else
            echo "LIVEKIT_API_KEY=$LIVEKIT_API_KEY" >> .env
        fi
        
        if grep -q "^LIVEKIT_API_SECRET=" .env; then
            sed -i '' "s|^LIVEKIT_API_SECRET=.*|LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET|" .env
        else
            echo "LIVEKIT_API_SECRET=$LIVEKIT_API_SECRET" >> .env
        fi
        
        echo ""
        echo "✅ LiveKit Cloud configured!"
        echo ""
        echo "Next steps:"
        echo "1. Run: pnpm dev"
        echo "2. Open: http://localhost:3000/onboarding/voice-livekit"
        echo "3. Test with multiple browser tabs (concurrent users)"
        echo ""
        ;;
        
    2)
        echo ""
        echo "🐳 Setting up Self-hosted LiveKit Server"
        echo "======================================="
        echo ""
        
        # Check if Docker is installed
        if ! command -v docker &> /dev/null; then
            echo "❌ Docker not found. Please install Docker first:"
            echo "   https://docs.docker.com/get-docker/"
            exit 1
        fi
        
        echo "✅ Docker found"
        echo ""
        
        # Create LiveKit config
        echo "Creating livekit.yaml configuration..."
        cat > livekit.yaml << 'EOF'
port: 7880
rtc:
  port_range_start: 7882
  port_range_end: 7892
  use_external_ip: true
keys:
  devkey: secret
EOF
        
        echo "✅ Configuration created"
        echo ""
        
        # Start LiveKit server
        echo "Starting LiveKit server..."
        docker run -d \
          --name livekit-server \
          -p 7880:7880 \
          -p 7881:7881 \
          -p 7882-7892:7882-7892/udp \
          -v "$(pwd)/livekit.yaml:/livekit.yaml" \
          livekit/livekit-server \
          --config /livekit.yaml
        
        echo "✅ LiveKit server started"
        echo ""
        
        # Update .env for local server
        if grep -q "^LIVEKIT_URL=" .env; then
            sed -i '' "s|^LIVEKIT_URL=.*|LIVEKIT_URL=ws://localhost:7880|" .env
        else
            echo "LIVEKIT_URL=ws://localhost:7880" >> .env
        fi
        
        if grep -q "^LIVEKIT_API_KEY=" .env; then
            sed -i '' "s|^LIVEKIT_API_KEY=.*|LIVEKIT_API_KEY=devkey|" .env
        else
            echo "LIVEKIT_API_KEY=devkey" >> .env
        fi
        
        if grep -q "^LIVEKIT_API_SECRET=" .env; then
            sed -i '' "s|^LIVEKIT_API_SECRET=.*|LIVEKIT_API_SECRET=secret|" .env
        else
            echo "LIVEKIT_API_SECRET=secret" >> .env
        fi
        
        echo "✅ Local LiveKit server configured!"
        echo ""
        echo "Server info:"
        echo "- URL: ws://localhost:7880"
        echo "- API Key: devkey"
        echo "- API Secret: secret"
        echo ""
        echo "Next steps:"
        echo "1. Run: pnpm dev"
        echo "2. Open: http://localhost:3000/onboarding/voice-livekit"
        echo "3. Test with unlimited concurrent users!"
        echo ""
        echo "To stop server: docker stop livekit-server"
        echo "To restart: docker start livekit-server"
        echo "To remove: docker rm -f livekit-server"
        echo ""
        ;;
        
    3)
        echo ""
        echo "⏭️  Skipping automatic setup"
        echo ""
        echo "Manual setup instructions in: docs/LIVEKIT_VOICE_SETUP.md"
        echo ""
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo "📚 Full documentation: docs/LIVEKIT_VOICE_SETUP.md"
echo ""
