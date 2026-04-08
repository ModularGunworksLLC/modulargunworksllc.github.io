FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install --omit=dev

# Copy app code
COPY . .

# Expose port (Northflank injects PORT)
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "serve.js"]
