FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ sqlite

COPY package.json package-lock.json ./
RUN npm install --production

COPY . .

HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000', (res) => { if (res.statusCode !== 200) throw new Error() })"

CMD ["node", "index.js"]