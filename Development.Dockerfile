FROM swift:4.2
WORKDIR /CrystalDevelopment
RUN apt-get update \ 
  && apt-get upgrade -y \
  && apt-get install -y \
  libpng-dev
COPY ./Service ./Service
COPY ./SkiaBuild ./SkiaBuild
COPY ./SkiaLib ./SkiaLib
RUN cd SkiaLib \
  && git config --global user.email "refectjam@gmail.com" \
  && git config --global user.name "Jared Mathews" \
  && git init \
  && git add -A \
  && git commit -m "Initial commit" \
  && git tag -a 0.0.0 -m "0.0.0"
RUN cd Service \
  && swift package edit SkiaLib --path ../SkiaLib