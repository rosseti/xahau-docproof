FROM node:20-alpine

WORKDIR /usr/src/app/

COPY . .

RUN apk update && apk add --no-cache wget && apk --no-cache add openssl wget && apk add ca-certificates && update-ca-certificates

RUN wget -qO- "https://github.com/fgrehm/docker-phantomjs2/releases/download/v2.0.0-20150722/dockerized-phantomjs.tar.gz" | tar xz -C / \
    && npm install -g phantomjs-prebuilt --force

RUN apk add --update ttf-dejavu ttf-droid ttf-freefont ttf-liberation && rm -rf /var/cache/apk/*

# see this: https://github.com/marcbachmann/node-html-pdf/issues/563#issuecomment-712852134
RUN echo "" > /tmp/openssl.cnf

RUN npm install

EXPOSE 3001

CMD ["npm", "run", "serve"]