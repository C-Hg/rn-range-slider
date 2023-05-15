import React, { MutableRefObject, PureComponent, ReactNode } from 'react';
import { LayoutChangeEvent, View } from 'react-native';


type LabelContainerProps = {
  onLayout: (event: LayoutChangeEvent) => void;
  ref: MutableRefObject<LabelContainer | null>;
  renderContent: (value: number) => ReactNode;
};

class LabelContainer extends React.Component<LabelContainerProps> {

  state = {
    value: Number.NaN,
  };
  
  setValue = (value: number) => {
    this.setState({ value });
  }

  render() {
    const { onLayout, ref, renderContent } = this.props;
    const { value } = this.state;
    return (
      <View onLayout={onLayout} ref={ref as React.RefObject<View>} >
        {renderContent(value)}
      </View>
    );
  }
}

export default LabelContainer;
