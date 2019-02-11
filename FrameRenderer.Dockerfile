FROM swift:4.2
WORKDIR /crystal-frame-renderer
RUN apt-get update \ 
  && apt-get upgrade -y \
  && apt-get install -y \
  libpng-dev
COPY ./FrameInterface ./FrameInterface
COPY ./FrameSchemaTemplate ./FrameSchema
RUN cd FrameInterface \
  && git config --global user.email "refectjam@gmail.com" \
  && git config --global user.name "Jared Mathews" \
  && git init \
  && git add -A \
  && git commit -m "Initial commit" \
  && git tag -a 0.0.0 -m "0.0.0"
RUN cd FrameSchema \
  && swift package edit FrameInterface --path ../FrameInterface