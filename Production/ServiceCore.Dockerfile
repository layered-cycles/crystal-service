FROM node:11-alpine
WORKDIR /crystal-service-core
COPY ./ServiceCore ./
RUN npm install
CMD node ./Sources/index.js