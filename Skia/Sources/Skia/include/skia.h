#ifdef __cplusplus
extern "C"
{
#endif
  typedef struct
  {
    float x;
    float y;
  } Point;
  typedef struct
  {
    float hue;
    float saturation;
    float value;
  } Color;
  struct RenderFrameCallbacks
  {
    void (*_Nonnull onRender)(
        void *_Nonnull canvasPointer,
        void *_Nonnull layersPointer);
    void (*_Nonnull onRendered)(
        const void *_Nonnull dataPointer,
        unsigned long byteCount,
        void *_Nonnull resultPointer);
  };
  typedef struct RenderFrameCallbacks RenderFrameCallbacks;
  void renderFrame(
      int width,
      int height,
      void *_Nonnull layersPointer,
      void *_Nonnull resultPointer,
      const RenderFrameCallbacks *_Nonnull callbacks);
  void drawPath(void *_Nonnull, Color, void *_Nonnull);
  void addCircleToPath(Point, float, void *_Nonnull);
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