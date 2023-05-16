import React, { ReactNode, forwardRef, useImperativeHandle, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

export type LabelContainerRef = {
  setThumbValue: React.Dispatch<React.SetStateAction<number>>
}

type LabelContainerProps = {
  onLayout: (event: LayoutChangeEvent) => void;
  renderContent: (value: number) => ReactNode;
};

const LabelContainer = forwardRef<LabelContainerRef, LabelContainerProps>((props: LabelContainerProps, ref) => {
  const [thumbValue, setThumbValue] = useState(Number.NaN);

  const { onLayout, renderContent } = props;

  useImperativeHandle(ref, () => ({
    setThumbValue,
  }));

  return (
    <View onLayout={onLayout} ref={ref as React.RefObject<View>} >
      {renderContent(thumbValue)}
    </View>
  );
})

export default LabelContainer;
