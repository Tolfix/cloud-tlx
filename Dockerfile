FROM node:14-alpine

LABEL author="Tolfix" maintainer="support@tolfix.com"

WORKDIR /usr/src

COPY package*.json ./

RUN npm install

COPY . ./

ENV MONGODB_NAV ""
ENV SESSION_SECRET ""

EXPOSE 8080

CMD [ "node", "Server.js" ]