FROM node:20-bullseye

# Install psql client (useful for migrations/backups)
RUN apt-get update && apt-get install -y postgresql-client curl && rm -rf /var/lib/apt/lists/*

WORKDIR /srv/app

# Copy package files
COPY package.json package-lock.json ./

# Install ALL dependencies (including dev for building)
RUN npm install

# Copy rest of the app
COPY . ./

# Build the frontend and backend
RUN npm run build

EXPOSE 5000

# Start with production command
CMD ["npm", "run", "start"]
