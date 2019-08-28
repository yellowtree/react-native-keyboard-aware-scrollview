import React, { useCallback } from 'react'
import PropTypes from 'prop-types'

import {
  ScrollView, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent, ScrollViewProps
} from 'react-native';

import useKeyboardAwareBase, { KeyboardAwareBaseProps } from './useKeyboardAwareBase';

const KeyboardAwareScrollView: React.FunctionComponent<ScrollViewProps & KeyboardAwareBaseProps & {
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
}> = props => {
  const {
    keyboardHeight,
    keyboardAwareView,
    onKeyboardAwareViewLayout,
    onKeyboardAwareViewScroll,
    updateKeyboardAwareViewContentSize
  } = useKeyboardAwareBase(props)

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    onKeyboardAwareViewLayout(e.nativeEvent.layout)
  }, [onKeyboardAwareViewLayout])

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onKeyboardAwareViewScroll(e.nativeEvent.contentOffset)
    if (props.onScroll) {
      props.onScroll(e);
    }
  }, [props.onScroll, onKeyboardAwareViewLayout])

  return (
    <ScrollView
      {...props}
      contentInset={{ bottom: keyboardHeight }}
      ref={keyboardAwareView}
      onLayout={handleLayout}
      onScroll={onScroll}
      onContentSizeChange={updateKeyboardAwareViewContentSize}
      scrollEventThrottle={200}
    />
  )
}

export default KeyboardAwareScrollView
