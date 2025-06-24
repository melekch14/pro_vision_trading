FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
COPY wait-for-mysql.js .

CMD ["sh", "-c", "node wait-for-mysql.js && node app.js"]
