FROM swift:4.2
WORKDIR /crystal-development
RUN apt-get update \ 
  && apt-get upgrade -y \
  && apt-get install -y \
  libpng-dev
COPY ./FrameRenderer ./FrameRenderer
COPY ./FrameInterface ./FrameInterface
COPY ./DefaultFrameSchema ./DefaultFrameSchema
COPY ./SkiaBuild ./SkiaBuild
COPY ./Skia ./Skia
RUN cd Skia \
  && git config --global user.email "refectjam@gmail.com" \
  && git config --global user.name "Jared Mathews" \
  && git init \
  && git add -A \
  && git commit -m "Initial commit" \
  && git tag -a 0.0.0 -m "0.0.0"
RUN cd FrameInterface \
  && git init \
  && git add -A \
  && git commit -m "Initial commit" \
  && git tag -a 0.0.0 -m "0.0.0"
RUN cd DefaultFrameSchema \
  && git init \
  && git add -A \
  && git commit -m "Initial commit" \
  && git tag -a 0.0.0 -m "0.0.0"
RUN cd FrameRenderer \
  && swift package edit Skia --path ../Skia \
  && swift package edit FrameInterface --path ../FrameInterface \
  && swift package edit FrameSchema --path ../DefaultFrameSchema
RUN cd DefaultFrameSchema \
  && swift package edit FrameInterface --path ../FrameInterface