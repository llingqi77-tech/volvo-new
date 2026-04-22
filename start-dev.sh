#!/bin/bash

echo "Starting Volvo Research Workbench..."
echo ""

echo "Cleaning up ports..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

echo "Starting frontend + API (npm run dev)..."
npm run dev
