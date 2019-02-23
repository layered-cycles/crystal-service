FROM node
WORKDIR /crystal-service-core
COPY ./ServiceCore ./
RUN npm install