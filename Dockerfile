# --- Build stage ---
FROM node:20-alpine AS build
WORKDIR /usr/src/app
COPY app/package*.json ./
RUN npm install --production
COPY app/ .

# --- Runtime stage ---
FROM node:20-alpine
WORKDIR /usr/src/app
COPY --from=build /usr/src/app .
ENV PORT=3000
EXPOSE 3000
# Run as non-root user for better security posture
USER node
CMD ["node", "index.js"]
