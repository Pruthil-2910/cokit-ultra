FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

# Expose port for HTTP API (optional)
EXPOSE 8765

# Run MCP server
CMD ["node", "dist/server.js"]