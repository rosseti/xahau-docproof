FROM node:20-slim

WORKDIR /usr/src/app/

RUN apt-get update && apt-get install -y curl

COPY . .

RUN npm install

# Disable, needs `--expose` during `docker run` to prevent collisions
# EXPOSE 3001

CMD ["npm", "run", "dev"]