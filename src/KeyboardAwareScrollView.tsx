import React, { useCallback } from 'react'

import {
  ScrollView, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent, ScrollViewProps
} from 'react-native';

import useKeyboardAwareBase, { KeyboardAwareBaseProps } from './useKeyboardAwareBase';
import useMergedRef from './useMergedRef';

const KeyboardAwareScrollView = React.forwardRef<ScrollView, ScrollViewProps & KeyboardAwareBaseProps & {
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
}>((props, ref) => {
  const {
    keyboardHeight,
    keyboardAwareView,
    onKeyboardAwareViewLayout,
    onKeyboardAwareViewScroll,
    updateKeyboardAwareViewContentSize,
    wrapRender
  } = useKeyboardAwareBase({
    ...props
  })
  const mergedRef = useMergedRef<ScrollView>(ref, keyboardAwareView)

  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    onKeyboardAwareViewLayout(e.nativeEvent.layout)
  }, [onKeyboardAwareViewLayout])

  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onKeyboardAwareViewScroll(e.nativeEvent.contentOffset)
    if (props.onScroll) {
      props.onScroll(e);
    }
  }, [props.onScroll, onKeyboardAwareViewLayout])

  return wrapRender(
    // @ts-ignore scrollToOverflowEnabled is missing from type
    <ScrollView
      {...props}
      ref={mergedRef}
      scrollToOverflowEnabled
      scrollEnabled={keyboardHeight === 0}
      onLayout={handleLayout}
      onScroll={onScroll}
      automaticallyAdjustContentInsets={false}
      onContentSizeChange={updateKeyboardAwareViewContentSize}
      scrollEventThrottle={200}
    />
  )
})

export default KeyboardAwareScrollView
