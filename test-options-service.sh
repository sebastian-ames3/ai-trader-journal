#!/bin/bash
# Quick test script for Options Data Service

echo "========================================="
echo "Options Data Service - Quick Test"
echo "========================================="
echo ""

# Check if service is running
echo "1. Testing health endpoint..."
curl -s http://localhost:8000/health | jq . || echo "❌ Service not running. Start with: uvicorn options_service:app --reload"
echo ""

# Test expirations
echo "2. Testing expirations endpoint (AAPL)..."
curl -s "http://localhost:8000/api/options/expirations?ticker=AAPL" | jq '.ticker, .count, .expirations[0:3]' || echo "❌ Failed"
echo ""

# Test options chain
echo "3. Testing options chain endpoint (AAPL nearest expiration)..."
EXPIRATION=$(curl -s "http://localhost:8000/api/options/expirations?ticker=AAPL" | jq -r '.expirations[0]')
echo "   Using expiration: $EXPIRATION"
curl -s "http://localhost:8000/api/options/chain?ticker=AAPL&expiration=$EXPIRATION" | jq '{ticker, expiration, underlyingPrice, callCount: (.calls | length), putCount: (.puts | length)}' || echo "❌ Failed"
echo ""

echo "========================================="
echo "✅ All tests complete!"
echo ""
echo "Next steps:"
echo "1. Start Next.js dev server: npm run dev"
echo "2. Test proxy routes:"
echo "   curl http://localhost:3000/api/options/health"
echo "========================================="
