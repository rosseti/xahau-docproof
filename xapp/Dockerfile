FROM node:20-alpine

WORKDIR /usr/src/app/

COPY . .

RUN npm install

EXPOSE 3001

CMD ["npm", "run", "start"]