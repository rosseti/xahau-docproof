FROM node:20-slim

WORKDIR /usr/src/app/

RUN apt-get update && apt-get install -y curl

COPY . .

RUN npm install

EXPOSE 3000

CMD ["npm", "run", "dev"]