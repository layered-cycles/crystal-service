FROM swift:4.2
WORKDIR /crystal-frame-renderer
RUN apt-get update \ 
  && apt-get upgrade -y \
  && apt-get install -y \
  libpng-dev
COPY ./Production/Stage/FrameRenderer ./
COPY ./FrameInterface ./FrameInterface
COPY ./FrameSchemaTemplate ./FrameSchema
RUN cd FrameInterface \
  && git config --global user.email "foo@bar.com" \
  && git config --global user.name "Foo Bar" \
  && git init \
  && git add -A \
  && git commit -m "Initial commit" \
  && git tag -a 0.1.0 -m "0.1.0"
CMD ./FrameRenderer