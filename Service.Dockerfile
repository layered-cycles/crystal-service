FROM swift:4.2
WORKDIR /Crystal
RUN apt-get update \ 
  && apt-get upgrade -y \
  && apt-get install -y \
  libpng-dev