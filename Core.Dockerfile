FROM node
WORKDIR /crystal-core
COPY ./Core ./
RUN npm install