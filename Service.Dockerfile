FROM swift:4.2
WORKDIR /CrystalService
RUN apt-get update \ 
  && apt-get upgrade -y \
  && apt-get install -y \
  openssl \
  libssl-dev \
  uuid-dev
COPY ./Development/Temp/CrystalService ./
CMD ./CrystalService