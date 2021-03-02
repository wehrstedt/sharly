FROM node:latest

WORKDIR /usr/src/userstorage

ENV MONGO_DB_URL mongodb://mongo:27017
ENV MONGO_DB_NAME sharly
ENV MONGO_DB_USER root
ENV MONGO_DB_PASSWORD toor

# Sourcen kopieren
COPY package.json .
COPY yarn.lock .

# Module installieren
RUN yarn install

# Transpilieren
COPY src src
COPY tsconfig.json .
COPY tslint.json .
RUN yarn run build

# Aufräumen
RUN yarn install --production
RUN rm -r src
RUN rm tsconfig.json tslint.json yarn.lock

# REST-Service starten
EXPOSE 8082
CMD [ "node", "dist/index.js" ]
