FROM swift:4.2
WORKDIR /compile-frame-renderer
RUN apt-get update \ 
  && apt-get upgrade -y \
  && apt-get install -y \
  libpng-dev
COPY ./FrameRenderer ./FrameRenderer
COPY ./FrameInterface ./FrameInterface
COPY ./SkiaBuild ./SkiaBuild
COPY ./Skia ./Skia
RUN cd Skia \
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
RUN swift build \ 
  --configuration release \
  --package-path ./FrameRenderer \
  -Xcxx -std=c++11 \
  -Xcxx -I/compile-frame-renderer/SkiaBuild/include/c \
  -Xcxx -I/compile-frame-renderer/SkiaBuild/include/codec \
  -Xcxx -I/compile-frame-renderer/SkiaBuild/include/config \
  -Xcxx -I/compile-frame-renderer/SkiaBuild/include/core \
  -Xcxx -I/compile-frame-renderer/SkiaBuild/include/docs \
  -Xcxx -I/compile-frame-renderer/SkiaBuild/include/effects \
  -Xcxx -I/compile-frame-renderer/SkiaBuild/include/encode \
  -Xcxx -I/compile-frame-renderer/SkiaBuild/include/gpu \
  -Xcxx -I/compile-frame-renderer/SkiaBuild/include/pathops \
  -Xcxx -I/compile-frame-renderer/SkiaBuild/include/ports \
  -Xcxx -I/compile-frame-renderer/SkiaBuild/include/private \
  -Xcxx -I/compile-frame-renderer/SkiaBuild/include/svg \
  -Xcxx -I/compile-frame-renderer/SkiaBuild/include/utils \
  -Xlinker /compile-frame-renderer/SkiaBuild/out/Static/libskia.a \
  -Xlinker -lpthread \
  -Xlinker -lpng