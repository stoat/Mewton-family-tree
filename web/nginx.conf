FROM node:20-alpine

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

COPY index.js ./
# Optional seed file; if present it gets used to initialize /data/tree.json
COPY tree.json ./tree.json

EXPOSE 5175
CMD ["npm", "start"]

