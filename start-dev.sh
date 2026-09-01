#!/bin/bash

# Invoice Generator - Dev Start Script
# Starts Express API server + Static frontend server

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:8080"

cleanup() {
    echo "Shutting down servers..."
    kill $API_PID $FRONTEND_PID 2>/dev/null
    wait $API_PID $FRONTEND_PID 2>/dev/null
    echo "Servers stopped."
}
trap cleanup EXIT

# Start Express API server
echo "Starting API server on port 3000..."
cd "$SCRIPT_DIR/server"
node index.js &
API_PID=$!

# Check if API server started successfully
sleep 1
if ! kill -0 $API_PID 2>/dev/null; then
    echo "ERROR: API server failed to start on port 3000"
    exit 1
fi

# Start static frontend server
echo "Starting frontend server on port 8080..."
cd "$SCRIPT_DIR"
node static-server.js &
FRONTEND_PID=$!

# Check if frontend server started successfully
sleep 1
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "ERROR: Frontend server failed to start on port 8080"
    exit 1
fi

# Wait for servers to be ready
echo "Waiting for servers..."
sleep 1

# Open browser
xdg-open "$FRONTEND_URL" 2>/dev/null || google-chrome "$FRONTEND_URL" 2>/dev/null || firefox "$FRONTEND_URL" 2>/dev/null || brave-browser "$FRONTEND_URL" 2>/dev/null

echo "Invoice Generator started:"
echo "  Frontend: $FRONTEND_URL"
echo "  API:      $API_URL"
echo ""
echo "Press Ctrl+C to stop both servers."

wait
