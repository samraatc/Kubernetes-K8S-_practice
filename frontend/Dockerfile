# Use official Node.js image as base
FROM node:21-alpine

# Set working directory inside container
WORKDIR /app/practice

# Copy package.json and package-lock.json first (to leverage caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the project files
COPY . .

# Expose the Vite default port
EXPOSE 5173

# Start the Vite development server
CMD ["npm", "run", "dev"]
