FROM swift:4.2
WORKDIR /CrystalDevelopment
RUN apt-get update \ 
  && apt-get upgrade -y \
  && apt-get install -y \
  openssl \
  libssl-dev \
  uuid-dev
COPY ./Service ./Service  