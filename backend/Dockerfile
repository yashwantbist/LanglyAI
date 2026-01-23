FROM node:20 
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["pm2-runtime", "index.js"]
