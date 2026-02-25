FROM node:20-alpine

WORKDIR /app

# Using npm install instead of npm ci for better resilience in network-restricted environments
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Copy the rest of the frontend
COPY . .

EXPOSE 5173

# Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]