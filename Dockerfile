# Build stage - using Node 20 to address security vulnerabilities
FROM node:20-alpine as builder
WORKDIR /usr/src/app

# Install latest npm to fix vulnerabilities in semver and ip packages
RUN npm install -g npm@11.0.0

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /usr/src/app

# Install latest npm
RUN npm install -g npm@11.0.0

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built application from builder stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose application port
EXPOSE 8081

# Run application
CMD ["node", "dist/app.js"]

#Finalize & Deploy