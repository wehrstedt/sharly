FROM node:latest

WORKDIR /usr/src/userstorage

ENV MONGO_DB_URL mongodb://mongo:27017
ENV MONGO_DB_NAME project-icetea
ENV MONGO_DB_USER root
ENV MONGO_DB_PASSWORD toor

# Sourcen kopieren
COPY . .
RUN mv config/default-dockerfile.json config/default.json

# Module installieren
RUN yarn install

# Transpilieren
RUN yarn run compile

# Aufräumen
RUN yarn install --production
RUN rm -r src
RUN rm tsconfig-base.json tsconfig.json yarn.lock

# REST-Service starten
EXPOSE 50051
CMD [ "npm", "start" ]
