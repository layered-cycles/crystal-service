#include "include/skialib.h"
#include <stdio.h>
#include <SkCanvas.h>
#include <SkPaint.h>
#include <SkSurface.h>
#include <SkImage.h>
#include <SkData.h>
#include <SkStream.h>

const int ROOT_LENGTH = 512;

void draw(SkCanvas *canvas)
{
  SkPaint targetPaint;
  targetPaint.setColor(SK_ColorBLACK);
  targetPaint.setAntiAlias(true);
  targetPaint.setStyle(SkPaint::kStroke_Style);
  targetPaint.setStrokeWidth(8);
  canvas->drawLine(
      0, 0,
      ROOT_LENGTH, ROOT_LENGTH,
      targetPaint);
  canvas->drawLine(
      ROOT_LENGTH, 0,
      0, ROOT_LENGTH,
      targetPaint);
}

void testSkiaLib(void)
{
  printf("\nSkiaLib++\n\n");
  sk_sp<SkSurface> rasterSurface =
      SkSurface::MakeRasterN32Premul(
          ROOT_LENGTH,
          ROOT_LENGTH);
  SkCanvas *rasterCanvas =
      rasterSurface->getCanvas();
  draw(rasterCanvas);
  sk_sp<SkImage> renderedImage =
      rasterSurface->makeImageSnapshot();
  sk_sp<SkData> renderedData =
      renderedImage->encodeToData();
  SkFILEWStream targetFile("test.png");
  targetFile.write(
      renderedData->data(),
      renderedData->size());
}