FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
# Cài đặt toàn bộ dependencies
RUN npm install

COPY . .

# Ép React chạy trên port 8080 bên trong container
ENV PORT=8080
EXPOSE 8080

# Chạy lệnh start của React (để có Hot Reload)
CMD ["npm", "start"]