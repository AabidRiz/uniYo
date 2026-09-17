FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY sidecar.cjs ./

ENV PORT=10000
EXPOSE 10000

CMD ["node", "sidecar.cjs"]
