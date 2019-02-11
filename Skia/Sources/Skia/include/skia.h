#ifdef __cplusplus
extern "C"
{
#endif
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
  struct RenderFrameCallbacks
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
  };
  typedef struct RenderFrameCallbacks RenderFrameCallbacks;
  void renderFrame(
      double width,
      double height,
      void *_Nonnull layersPointer,
      void *_Nonnull resultPointer,
      const RenderFrameCallbacks *_Nonnull callbacks);
  void drawPath(void *_Nonnull, Color, void *_Nonnull);
  void addCircleToPath(Point, double, void *_Nonnull);
  void addRectangleToPath(double, double, double, double, void *_Nonnull);
  struct PathPair
  {
    int key;
    void *_Nonnull pointer;
  };
  typedef struct PathPair PathPair;
  PathPair initPath();
  void deinitPath(int);
#ifdef __cplusplus
}
#endif