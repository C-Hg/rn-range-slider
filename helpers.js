export const isLowCloser = (downX, lowPosition, highPosition) => {
  if (lowPosition === highPosition) {
    return downX < lowPosition;
  }
  const distanceFromLow = Math.abs(downX - lowPosition);
  const distanceFromHigh = Math.abs(downX - highPosition);
  return distanceFromLow < distanceFromHigh;
};

export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

export const getValueForPosition = (positionInView, containerWidth, thumbWidth, min, max, step) => {
  const availableSpace = containerWidth - thumbWidth;
  const relStepUnit = step / (max - min);
  let relPosition = (positionInView - thumbWidth / 2) / availableSpace;
  const relOffset = relPosition % relStepUnit;
  relPosition -= relOffset;
  if (relOffset / relStepUnit >= 0.5) {
    relPosition += relStepUnit;
  }
  return clamp(min + Math.round(relPosition / relStepUnit) * step, min, max);
};

export const getHighPosition = (high, min, max, containerWidth, thumbWidth) => {
  return (high - min) / (max - min) * (containerWidth - thumbWidth);
}

export const getLowPosition = (low, min, max, containerWidth, thumbWidth) => {
  return (low - min) / (max - min) * (containerWidth - thumbWidth);
}

export const getRightAndLeftValues = (inPropsRef, containerWidthRef, thumbWidth, disableRange) => {
  const { low, high, min, max } = inPropsRef.current;
  const { current: containerWidth } = containerWidthRef;
  const fullScale = (max - min) / (containerWidth - thumbWidth);
  const leftValue = (low - min) / fullScale;
  const rightValue = (max - high) / fullScale;

  return [
    disableRange ? 0 : leftValue,
    disableRange ? (containerWidth - thumbWidth) - leftValue : rightValue
  ];
}