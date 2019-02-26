#ifdef __cplusplus
extern "C"
{
#endif
  typedef struct
  {
    void (*_Nonnull onRender)(
        void *_Nonnull canvasPointer,
        double frameWidth,
        double frameHeight,
        void *_Nonnull layersPointer);
    void (*_Nonnull onRendered)(
        const void *_Nonnull dataPointer,
        unsigned long byteCount,
        void *_Nonnull resultPointer);
  } RenderFrameCallbacks;
  void renderFrame(
      double width,
      double height,
      void *_Nonnull layersPointer,
      void *_Nonnull resultPointer,
      const RenderFrameCallbacks *_Nonnull callbacks);
  typedef struct
  {
    double x;
    double y;
  } Point;
  typedef struct
  {
    double hue;
    double saturation;
    double value;
  } Color;
  void drawPath(
      void *_Nonnull pathPointer,
      Color fillColor,
      void *_Nonnull canvasPointer);
  void addCircleToPath(
      Point center,
      double radius,
      void *_Nonnull pathPointer);
  void addRectangleToPath(
      double left,
      double top,
      double right,
      double bottom,
      void *_Nonnull pathPointer);
  typedef struct
  {
    int key;
    void *_Nonnull pointer;
  } PathPair;
  PathPair initPath();
  void deinitPath(
      int pathKey);
#ifdef __cplusplus
}
#endif