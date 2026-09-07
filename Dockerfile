# 1. Use official lightweight Node.js LTS image
FROM node:20-alpine

# 2. Set working directory inside container
WORKDIR /usr/src/app

# 3. Copy package dependency manifests
COPY package*.json ./

# 4. Install production dependencies
RUN npm ci --only=production

# 5. Copy rest of application source code
COPY . .

# 6. Expose the port (matches default PORT=5000)
EXPOSE 5000

# 7. Define environment variable default
ENV NODE_ENV=production

# 8. Start the application
CMD ["npm", "start"]
