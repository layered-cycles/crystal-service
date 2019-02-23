FROM swift:4.2
WORKDIR /build-skia-library
RUN apt-get update \ 
  && apt-get upgrade -y \
  && apt-get install -y \
  wget \
  unzip \
  libpng-dev
RUN wget https://github.com/ninja-build/ninja/releases/download/v1.7.2/ninja-linux.zip \
  && unzip ninja-linux.zip
RUN git clone https://skia.googlesource.com/skia.git \
  && cd skia \
  && python tools/git-sync-deps
RUN cd skia \
  && bin/gn gen out/Static --args=' \
  is_official_build=true \
  skia_use_libjpeg_turbo=false \
  skia_use_sfntly=false \
  skia_use_libwebp=false \
  skia_enable_gpu=false \
  skia_use_fontconfig=false \
  skia_use_freetype=false \
  skia_use_expat=false \
  skia_enable_fontmgr_empty=true \
  skia_enable_fontmgr_android=false' \
  && ../ninja -C out/Static