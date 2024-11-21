# Base image
FROM node:20-alpine

# Configura o diretório de trabalho
WORKDIR /usr/src/app/

COPY package*.json ./

RUN npm install

# Exponha a porta da aplicação
EXPOSE 3001

# Comando para iniciar a aplicação
CMD ["npm", "run", "serve"]