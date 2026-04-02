#!/bin/bash

echo "Starting Volvo Research Workbench..."
echo ""

# Kill any existing processes on port 3001 and 3000
echo "Cleaning up ports..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

# Start API server in background
echo "Starting API server on port 3001..."
npm run api > api.log 2>&1 &
API_PID=$!

sleep 3

# Start frontend in background
echo "Starting frontend on port 3000..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "Volvo Research Workbench is running!"
echo "========================================"
echo "Frontend: http://localhost:3000/volvo-new/"
echo "API Server: http://localhost:3001"
echo "========================================"
echo ""
echo "Press Ctrl+C to stop all servers..."

# Wait for Ctrl+C
trap "echo 'Stopping servers...'; kill $API_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait
