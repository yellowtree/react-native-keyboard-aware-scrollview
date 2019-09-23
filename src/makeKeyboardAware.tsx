import React, { useCallback, useState, useMemo } from 'react'

import {
  NativeSyntheticEvent, NativeScrollEvent, LayoutChangeEvent, ScrollViewProps, Platform, View, StyleSheet, ScrollView, FlatList
} from 'react-native';

import useKeyboardAwareBase, { KeyboardAwareBaseProps } from './useKeyboardAwareBase';
import useMergedRef from './useMergedRef';

function makeKeyboardAware<T extends typeof ScrollView | typeof FlatList, Props extends ScrollViewProps> (ScrollViewComponent: T) {
  return React.forwardRef<T, Props & KeyboardAwareBaseProps & {
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
    const mergedRef = useMergedRef<T>(ref, keyboardAwareView)

    const [outerHeight, setOuterHeight] = useState(0)
    const handleLayout = useCallback((e: LayoutChangeEvent) => {
      setOuterHeight(e.nativeEvent.layout.height)
      onKeyboardAwareViewLayout(e.nativeEvent.layout)
    }, [onKeyboardAwareViewLayout, keyboardHeight])

    const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
      onKeyboardAwareViewScroll(e.nativeEvent.contentOffset)
      if (props.onScroll) {
        props.onScroll(e);
      }
    }, [props.onScroll, onKeyboardAwareViewLayout])

    const { contentContainerStyle, wrapStyle, paddingStyle } = useMemo(() => {
      const wrapStyle = { ...StyleSheet.flatten(props.contentContainerStyle) }
      const contentContainerStyle = { flexGrow: 0 }

      if ((wrapStyle.flexGrow || 0) > 0) {
        contentContainerStyle.flexGrow = wrapStyle.flexGrow || 0
        if (Platform.OS === 'android') {
          wrapStyle.minHeight = outerHeight || 0
        }
      }

      return {
        contentContainerStyle,
        wrapStyle,
        paddingStyle: { height: keyboardHeight }
      }
    }, [props.contentContainerStyle, outerHeight, keyboardHeight])

    return wrapRender(
      // @ts-ignore scrollToOverflowEnabled is missing from type
      <ScrollViewComponent
        {...props}
        ref={mergedRef}
        scrollToOverflowEnabled
        scrollEnabled={keyboardHeight === 0}
        onLayout={handleLayout}
        onScroll={onScroll}
        automaticallyAdjustContentInsets={false}
        onContentSizeChange={updateKeyboardAwareViewContentSize}
        scrollEventThrottle={200}
        contentContainerStyle={contentContainerStyle}
      >
        <View style={wrapStyle}>
          {props.children}
        </View>
      </ScrollViewComponent>
    )
  })
}

export default makeKeyboardAware
