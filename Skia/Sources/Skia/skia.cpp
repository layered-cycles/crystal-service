#include "include/skia.h"
#include <SkSurface.h>
#include <SkCanvas.h>
#include <SkPaint.h>
#include <SkImage.h>
#include <SkData.h>
#include <SkPath.h>

extern void renderFrame(
    double width,
    double height,
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
    (*callbacks).onRender(canvasPointer, width, height, layersPointer);
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

extern void drawPath(
    void *_Nonnull pathPointer,
    Color fillColor,
    void *_Nonnull canvasPointer)
{
    SkPath *path = (SkPath *)pathPointer;
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

extern void addCircleToPath(
    Point center,
    double radius,
    void *_Nonnull pathPointer)
{
    SkPath *path = (SkPath *)pathPointer;
    (*path).addCircle(
        center.x,
        center.y,
        radius);
}

extern void addRectangleToPath(
    Point origin,
    Size size,
    void *_Nonnull pathPointer)
{
    SkPath *path = (SkPath *)pathPointer;
    (*path).addRect(
        origin.x,
        origin.y,
        size.width,
        size.height);
}