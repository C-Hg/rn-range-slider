import { Animated } from "react-native/types";

export interface InProps {
  low: number;
  high: number;
  min: number;
  max: number;
  step: number;
}

export type AnimatedRef = Animated.Value & { _value: number }
