import React, {
  memo,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import {
  Animated,
  GestureResponderEvent,
  LayoutChangeEvent,
  PanResponder,
  PanResponderGestureState,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

import styles from './styles';
import {
  useThumbFollower,
  useLowHigh,
  useWidthLayout,
  useLabelContainerProps,
  useSelectedRail,
} from './hooks';
import {clamp, getHighPosition, getLowPosition, getValueForPosition, isLowCloser, shouldCaptureFocus} from './helpers';
import { AnimatedRef } from './interfaces';

const trueFunc = () => true;
const falseFunc = () => false;

export interface SliderProps extends ViewProps {
  min: number;
  max: number;
  fixedContainerWidth?: number;
  fixedThumbWidth?: number;
  focusHeightLimit?: number;
  minRange?: number;
  step: number;
  renderThumb: (name: 'high' | 'low') => ReactNode;
  low?: number;
  high?: number;
  allowLabelOverflow?: boolean;
  disableRange?: boolean;
  disabled?: boolean;
  floatingLabel?: boolean;
  renderLabel?: (value: number) => ReactNode;
  renderNotch?: (value: number) => ReactNode;
  renderRail: () => ReactNode;
  renderRailSelected: () => ReactNode;
  onValueChanged?: (low: number, high: number, byUser: boolean) => void;
  onSliderTouchStart?: (low: number, high: number) => void;
  onSliderTouchEnd?: (low: number, high: number) => void;
}

const Slider: React.FC<SliderProps> = ({
  fixedContainerWidth = 0,
  fixedThumbWidth = 0,
  focusHeightLimit = 100,
  min,
  max,
  minRange = 0,
  step,
  low: lowProp,
  high: highProp,
  floatingLabel = false,
  allowLabelOverflow = false,
  disableRange = false,
  disabled = false,
  onValueChanged,
  onSliderTouchStart,
  onSliderTouchEnd,
  renderThumb,
  renderLabel,
  renderNotch,
  renderRail,
  renderRailSelected,
  ...restProps
}) => {
  const containerWidthRef = useRef(fixedContainerWidth);
  const [thumbWidth, setThumbWidth] = useState(fixedThumbWidth);
  const [touchCanceled, setTouchCanceled] = useState(false);

  const {inPropsRef, inPropsRefPrev, setLow, setHigh} = useLowHigh(
    lowProp,
    disableRange ? max : highProp,
    min,
    max,
    step,
  );
  const lowThumbXRef = useRef<AnimatedRef>(new Animated.Value(getLowPosition(inPropsRef.current.low, min, max, containerWidthRef.current, thumbWidth)) as unknown as AnimatedRef);
  const highThumbXRef = useRef<AnimatedRef>(new Animated.Value(disableRange ? 0 : getHighPosition(inPropsRef.current.high, min, max, containerWidthRef.current, thumbWidth)) as unknown as AnimatedRef);
  const pointerX = useRef<Animated.Value>(new Animated.Value(0)).current;
  const {current: lowThumbX} = lowThumbXRef;
  const {current: highThumbX} = highThumbXRef;

  const gestureStateRef = useRef({isLow: true, lastValue: 0, lastPosition: 0});
  const [isPressed, setPressed] = useState(false);

  const [selectedRailStyle, updateSelectedRail] = useSelectedRail(
    inPropsRef,
    containerWidthRef,
    thumbWidth,
    disableRange,
  );

  const updateThumbs = useCallback(() => {
    const {current: containerWidth} = containerWidthRef;
    if (!thumbWidth || !containerWidth) {
      return;
    }
    const {low, high} = inPropsRef.current;
    if (!disableRange) {
      const {current: highThumbX} = highThumbXRef;
      const highPosition = getHighPosition(high, min, max, containerWidth, thumbWidth);
      highThumbX.setValue(highPosition);
    }
    const {current: lowThumbX} = lowThumbXRef;
    const lowPosition = getLowPosition(low, min, max, containerWidth, thumbWidth);
    lowThumbX.setValue(lowPosition);
    updateSelectedRail();
    onValueChanged?.(low, high, false);
    
  }, [
    disableRange,
    inPropsRef,
    max,
    min,
    onValueChanged,
    thumbWidth,
    updateSelectedRail,
  ]);

  useEffect(() => {
    const {lowPrev, highPrev} = inPropsRefPrev;
    if (
      (lowProp !== undefined && lowProp !== lowPrev) ||
      (highProp !== undefined && highProp !== highPrev)
    ) {
      updateThumbs();
    }
  }, [highProp, inPropsRefPrev.lowPrev, inPropsRefPrev.highPrev, lowProp]);

  useEffect(() => {
    updateThumbs();
  }, [updateThumbs]);

  const handleContainerLayout = fixedContainerWidth ? updateThumbs() : useWidthLayout(containerWidthRef, updateThumbs);
  const handleThumbLayout = useCallback(
    ({nativeEvent}: LayoutChangeEvent) => {
      const {
        layout: {width},
      } = nativeEvent;
      if (thumbWidth !== width && fixedThumbWidth === 0) {
        setThumbWidth(width);
      }
    },
    [fixedThumbWidth, thumbWidth],
  );

  const lowStyles = useMemo(() => {
    return {transform: [{translateX: lowThumbX}]};
  }, [lowThumbX]);

  const highStyles = useMemo(() => {
    return disableRange
      ? null
      : [styles.highThumbContainer, {transform: [{translateX: highThumbX}]}];
  }, [disableRange, highThumbX]);

  const railContainerStyles = useMemo(() => {
    return [styles.railsContainer, {marginHorizontal: thumbWidth / 2}];
  }, [thumbWidth]);

  const [labelView, labelUpdate] = useThumbFollower(
    containerWidthRef,
    gestureStateRef,
    renderLabel,
    isPressed,
    allowLabelOverflow,
  );
  const [notchView, notchUpdate] = useThumbFollower(
    containerWidthRef,
    gestureStateRef,
    renderNotch,
    isPressed,
    allowLabelOverflow,
  );
  const lowThumb = renderThumb('low');
  const highThumb = renderThumb('high');

  const labelContainerProps = useLabelContainerProps(floatingLabel);

  const {panHandlers} = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: (evt) => shouldCaptureFocus(evt, thumbWidth, lowThumbXRef, highThumbXRef, disableRange),
        onStartShouldSetPanResponderCapture: (evt) => shouldCaptureFocus(evt, thumbWidth, lowThumbXRef, highThumbXRef, disableRange),
        onMoveShouldSetPanResponder: (evt) => shouldCaptureFocus(evt, thumbWidth, lowThumbXRef, highThumbXRef, disableRange),
        onMoveShouldSetPanResponderCapture: (evt) => shouldCaptureFocus(evt, thumbWidth, lowThumbXRef, highThumbXRef, disableRange),
        onPanResponderTerminate: () => {
          setPressed(false);
        },
        
        onPanResponderTerminationRequest: falseFunc,
        onShouldBlockNativeResponder: trueFunc,

        onPanResponderGrant: ({nativeEvent}, gestureState) => {
          if (disabled) {
            return;
          }
          const {numberActiveTouches} = gestureState;
          if (numberActiveTouches > 1) {
            return;
          }
          setPressed(true);
          const {current: lowThumbX} = lowThumbXRef;
          const {current: highThumbX} = highThumbXRef;
          const {locationX: downX, pageX} = nativeEvent;
          const containerX = pageX - downX;

          const {low, high, min, max} = inPropsRef.current;
          onSliderTouchStart?.(low, high);
          const containerWidth = containerWidthRef.current;

          const lowPosition =
            thumbWidth / 2 +
            ((low - min) / (max - min)) * (containerWidth - thumbWidth);
          const highPosition =
            thumbWidth / 2 +
            ((high - min) / (max - min)) * (containerWidth - thumbWidth);

          const isLow =
            disableRange || isLowCloser(downX, lowPosition, highPosition);
          gestureStateRef.current.isLow = isLow;

          const handlePositionChange = (positionInView: number) => {
            const {low, high, min, max, step} = inPropsRef.current;
            const minValue = isLow ? min : low + minRange;
            const maxValue = isLow ? high - minRange : max;
            const value = clamp(
              getValueForPosition(
                positionInView,
                containerWidth,
                thumbWidth,
                min,
                max,
                step,
              ),
              minValue,
              maxValue,
            );
            if (gestureStateRef.current.lastValue === value) {
              return;
            }
            const availableSpace = containerWidth - thumbWidth;
            const absolutePosition =
              ((value - min) / (max - min)) * availableSpace;
            gestureStateRef.current.lastValue = value;
            gestureStateRef.current.lastPosition =
              absolutePosition + thumbWidth / 2;
            (isLow ? lowThumbX : highThumbX).setValue(absolutePosition);
            onValueChanged?.(isLow ? value : low, isLow ? high : value, true);
            (isLow ? setLow : setHigh)(value);
            labelUpdate &&
            labelUpdate(gestureStateRef.current.lastPosition, value);
            notchUpdate &&
            notchUpdate(gestureStateRef.current.lastPosition, value);
            updateSelectedRail();
          };
          handlePositionChange(downX);
          pointerX.removeAllListeners();
          pointerX.addListener(({value: pointerPosition}) => {
            const positionInView = pointerPosition - containerX;
            handlePositionChange(positionInView);
          });
        },

        onPanResponderMove: disabled
          ? undefined
          : (e, gestureState) => {
            const {dy, vy, moveX} = gestureState;
            if(touchCanceled) {
              return
            }
            if(Math.abs(dy) > focusHeightLimit || Math.abs(vy) > 1) {
              // cancel the gesture if the user has moved the thumb too far, or vertically rapidly suggesting they wanted to scroll vertically
              setPressed(false);
              setTouchCanceled(true)
              return
            }
            pointerX.setValue(moveX)
          },

        onPanResponderRelease: () => {
          if(!touchCanceled) {
            // cancel the gesture if the user has moved the thumb too far
            const { low, high } = inPropsRef.current;
            onSliderTouchEnd?.(low, high);
          }
          setPressed(false);
          setTouchCanceled(false)
        },

      }),
    [
      pointerX,
      inPropsRef,
      thumbWidth,
      disableRange,
      disabled,
      onValueChanged,
      setLow,
      setHigh,
      labelUpdate,
      notchUpdate,
      updateSelectedRail,
    ],
  );

  return (
    <View {...restProps}>
      <View {...labelContainerProps}>
        {labelView}
        {notchView}
      </View>
      <View onLayout={handleContainerLayout as (event: LayoutChangeEvent) => void} style={styles.controlsContainer}>
        <View style={railContainerStyles}>
          {renderRail()}
          <Animated.View style={selectedRailStyle as ViewStyle}>
            {renderRailSelected()}
          </Animated.View>
        </View>
        <Animated.View style={lowStyles} onLayout={handleThumbLayout}>
          {lowThumb}
        </Animated.View>
        {!disableRange && (
          <Animated.View style={highStyles}>{highThumb}</Animated.View>
        )}
        <View
          {...panHandlers}
          style={styles.touchableArea}
          collapsable={false}
        />
      </View>
    </View>
  );
};

export default memo(Slider);
