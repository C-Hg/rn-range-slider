// the best practice for accessibility is around 40, so 20 from the center of the thumb
const RANGE_TO_CAPTURE_FOCUS_ON_THUMB = 20;

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

/**
 * Only captures the focus if the user touches one of the thumbs.
 * This is the expected behavior for a slider.
 */
export const shouldCaptureFocus = (evt, thumbWidth, lowThumbXRef, highThumbXRef, disableRange) => {
  const { locationX } = evt.nativeEvent;
  const correctedLocationX = locationX - thumbWidth / 2; // correct for the half of the thumb width
  if (correctedLocationX - RANGE_TO_CAPTURE_FOCUS_ON_THUMB <= lowThumbXRef.current._value  && correctedLocationX + RANGE_TO_CAPTURE_FOCUS_ON_THUMB > lowThumbXRef.current._value) {
    return true
  }
  if (!disableRange && highThumbXRef.current._value - RANGE_TO_CAPTURE_FOCUS_ON_THUMB < correctedLocationX && correctedLocationX < highThumbXRef.current._value + RANGE_TO_CAPTURE_FOCUS_ON_THUMB) {
    return true;
  }
  return false
}
