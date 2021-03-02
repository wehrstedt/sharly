# develop stage
FROM node:13.14-alpine as develop-stage
WORKDIR /app
COPY package*.json ./
COPY yarn.lock ./
RUN yarn global add @quasar/cli

# build stage
FROM develop-stage as build-stage
RUN yarn
COPY .quasar .quasar
COPY public public
COPY src src
COPY src-pwa src-pwa
COPY .eslintignore ./
COPY .eslintrc.js ./
COPY .postcssrc.js ./
COPY babel.config.js ./
COPY quasar.conf.js ./
COPY tsconfig.json ./
RUN quasar build -m pwa

# production stage
FROM nginx:1.17.5-alpine as production-stage
COPY --from=build-stage /app/dist/pwa /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/conf.d/default.conf.template
COPY nginx/docker-entrypoint.sh .
EXPOSE 80
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
