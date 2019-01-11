#include "include/skialib.h"
#include <SkSurface.h>
#include <SkCanvas.h>
#include <SkPaint.h>
#include <SkImage.h>
#include <SkData.h>
#include <SkPath.h>
#include <map>

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

std::map<int, SkPath> pathMap;
int pathCount = 0;

int initPath()
{
  int pathKey = pathCount;
  SkPath newPath = SkPath();
  pathMap[pathKey] = newPath;
  pathCount += 1;
  return pathKey;
}

void deinitPath(int pathKey)
{
  pathMap.erase(pathKey);
}

extern void drawPath(int pathKey, Color fillColor, void *_Nonnull canvasPointer)
{
  SkPath *path = &pathMap[pathKey];
  SkPaint pathPaint;
  pathPaint.setAntiAlias(true);
  SkScalar hsv[3];
  hsv[0] = fillColor.hue;
  hsv[1] = fillColor.saturation;
  hsv[2] = fillColor.value;
  SkColor paintColor = SkHSVToColor(hsv);
  pathPaint.setColor(paintColor);
  SkCanvas *canvas = (SkCanvas *)canvasPointer;
  canvas->drawPath(
      *path,
      pathPaint);
}

extern void addCircleToPath(Point center, float radius, int pathKey)
{
  SkPath *path = &pathMap[pathKey];
  (*path).addCircle(
      center.x,
      center.y,
      radius);
}