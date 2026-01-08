#!/bin/bash

# E2E Test Setup Script
# This script sets up the environment and runs e2e tests

set -e

echo "🚀 Setting up E2E testing environment..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "✓ Docker is running"

# Start database containers
echo ""
echo "📦 Starting PostgreSQL database..."
bun docker:up

# Wait for PostgreSQL to be ready
echo ""
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if database is accessible
MAX_RETRIES=30
RETRY_COUNT=0
until docker exec ai-saas-postgres pg_isready -U postgres > /dev/null 2>&1; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ Error: PostgreSQL failed to start after ${MAX_RETRIES} attempts"
        exit 1
    fi
    echo "Waiting for PostgreSQL... (attempt $RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

echo "✓ PostgreSQL is ready"

# Push database schema
echo ""
echo "📋 Pushing database schema..."
bun db:push

# Seed database (optional, but good for testing)
echo ""
echo "🌱 Seeding database with test data..."
bun db:seed || echo "⚠️  Warning: Database seeding failed, continuing anyway..."

echo ""
echo "✅ Environment setup complete!"
echo ""
echo "📝 You can now run tests with:"
echo "   bun test:e2e              # Run all tests"
echo "   bun test:e2e:ui           # Run with UI"
echo "   bun test:e2e:headed       # Run in headed mode"
echo "   bun test:e2e:debug        # Run in debug mode"
echo ""
echo "🧹 To clean up after testing:"
echo "   bun docker:down           # Stop containers"
echo "   bun docker:reset          # Reset database completely"
echo ""

# Ask if user wants to run tests now
read -p "Would you like to run the e2e tests now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🧪 Running e2e tests..."
    bun test:e2e
fi
