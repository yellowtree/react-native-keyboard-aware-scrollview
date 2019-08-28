import React, { useCallback, useRef, useState, useEffect, useMemo } from 'react'
import PropTypes from 'prop-types'

import {
  ScrollView, NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent, ScrollViewProps, Dimensions, View
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
    updateKeyboardAwareViewContentSize,
    wrapRender
  } = useKeyboardAwareBase({
    ...props
  })

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
      ref={keyboardAwareView}
      scrollToOverflowEnabled
      onLayout={handleLayout}
      onScroll={onScroll}
      automaticallyAdjustContentInsets={false}
      onContentSizeChange={updateKeyboardAwareViewContentSize}
      scrollEventThrottle={200}
    />
  )
}

export default KeyboardAwareScrollView
