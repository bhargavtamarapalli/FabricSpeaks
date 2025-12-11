FROM node:20-bullseye

# Install psql client
RUN apt-get update && apt-get install -y postgresql-client curl && rm -rf /var/lib/apt/lists/*

WORKDIR /srv/app

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy rest of the app
COPY . ./

EXPOSE 5000

CMD ["sh", "-c", "until pg_isready -h db -p 5432; do sleep 1; done; psql $DATABASE_URL -f /srv/app/supabase/migrations/20251101182524_unified_schema_additions.sql || true; npm run dev"]
