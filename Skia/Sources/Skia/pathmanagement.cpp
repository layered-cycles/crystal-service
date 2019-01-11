#include "include/skia.h"
#include <map>
#include <SkPath.h>

std::map<int, SkPath> pathMap;
int pathCount = 0;

PathPair initPath()
{
  int pathKey = pathCount;
  SkPath newPath = SkPath();
  pathMap[pathKey] = newPath;
  PathPair newPair = {
      .key = pathKey,
      .pointer = (void *_Nonnull)(&pathMap[pathKey])};
  pathCount += 1;
  return newPair;
}

void deinitPath(
    int pathKey)
{
  pathMap.erase(pathKey);
}