FROM node:20-alpine 

WORKDIR /app

COPY package*.json ./

# Cài cả devDependencies (@babel/node, nodemon)
RUN npm ci

COPY . .

ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "start"]
