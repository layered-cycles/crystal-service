FROM swift:4.2
WORKDIR /frame-renderer-build-server
RUN apt-get update \ 
  && apt-get upgrade -y \
  && apt-get install -y \
  libpng-dev
COPY ./FrameRenderer ./FrameRenderer
COPY ./FrameInterface ./FrameInterface
COPY ./SkiaWrapper ./SkiaWrapper
RUN cd SkiaWrapper \
  && git config --global user.email "foo@bar.com" \
  && git config --global user.name "Foo Bar" \
  && git init \
  && git add -A \
  && git commit -m "Initial commit" \
  && git tag -a 0.1.0 -m "0.1.0"
RUN cd FrameInterface \
  && git init \
  && git add -A \
  && git commit -m "Initial commit" \
  && git tag -a 0.1.0 -m "0.1.0"
RUN cd FrameRenderer \
  && swift package edit Skia --path ../SkiaWrapper \
  && swift package edit FrameInterface --path ../FrameInterface