#ifdef __cplusplus
extern "C"
{
#endif
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
  void drawCircle(float, float, float, void *_Nonnull);
#ifdef __cplusplus
}
#endif