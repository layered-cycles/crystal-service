#include "include/skialib.h"
#include <SkCanvas.h>
#include <SkPaint.h>
#include <SkSurface.h>
#include <SkImage.h>
#include <SkData.h>

extern void renderFrame(
    int width,
    int height,
    void *_Nonnull layersPointer,
    void *_Nonnull resultPointer,
    const RenderFrameCallbacks *callbacks)
{
  sk_sp<SkSurface> rasterSurface =
      SkSurface::MakeRasterN32Premul(
          width, height);
  SkCanvas *rasterCanvas =
      rasterSurface->getCanvas();
  void *_Nonnull canvasPointer = rasterCanvas;
  (*callbacks).onRender(canvasPointer, layersPointer);
  sk_sp<SkImage> renderedImage =
      rasterSurface->makeImageSnapshot();
  sk_sp<SkData> renderedData =
      renderedImage->encodeToData();
  const void *_Nonnull dataPointer =
      renderedData->data();
  unsigned long dataByteCount =
      renderedData->size();
  (*callbacks).onRendered(dataPointer, dataByteCount, resultPointer);
  return;
}

extern void drawCircle(
    float centerX,
    float centerY,
    float radius,
    void *_Nonnull canvasPointer)
{
  SkCanvas *canvas = (SkCanvas *)canvasPointer;
  SkPaint circlePaint;
  circlePaint.setAntiAlias(true);
  circlePaint.setColor(SK_ColorRED);
  canvas->drawCircle(
      centerX,
      centerY,
      radius,
      circlePaint);
}