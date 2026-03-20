# Use official Node.js LTS image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better layer caching)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

# Expose the application port
EXPOSE 2000

# Start the application
CMD ["node", "index.js"]

