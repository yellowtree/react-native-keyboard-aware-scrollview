import React, { useCallback, useState, useMemo, PropsWithChildren } from 'react'

import {
  NativeSyntheticEvent,
  NativeScrollEvent,
  LayoutChangeEvent,
  ScrollViewProps,
  Platform,
  View,
  StyleSheet,
  ScrollView,
  FlatList
} from 'react-native'

import useKeyboardAwareBase, {
  KeyboardAwareBaseProps
} from './useKeyboardAwareBase'
import useMergedRef from './useMergedRef'

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function makeKeyboardAware<
  Props extends Pick<
    ScrollViewProps,
    | 'scrollEventThrottle'
    | 'scrollEnabled'
    | 'onLayout'
    | 'onScroll'
    | 'automaticallyAdjustContentInsets'
    | 'onContentSizeChange'
    | 'contentContainerStyle'
  >,
  T extends React.ComponentType<Props>
>(ScrollViewComponent: T) {
  return React.forwardRef<
    T,
    PropsWithChildren<Props> &
      KeyboardAwareBaseProps & {
        onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void
      }
  >((props, ref) => {
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
    const handleLayout = useCallback(
      (e: LayoutChangeEvent) => {
        setOuterHeight(e.nativeEvent.layout.height)
        onKeyboardAwareViewLayout(e.nativeEvent.layout)
      },
      [onKeyboardAwareViewLayout]
    )

    const propsOnScroll = props.onScroll
    const onScroll = useCallback(
      (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        onKeyboardAwareViewScroll(e.nativeEvent.contentOffset)
        if (propsOnScroll) {
          propsOnScroll(e)
        }
      },
      [onKeyboardAwareViewScroll, propsOnScroll]
    )

    const { contentContainerStyle, wrapStyle } = useMemo(() => {
      const nextWrapStyle = {
        ...StyleSheet.flatten(props.contentContainerStyle)
      }
      const nextContentContainerStyle = { flexGrow: 0 }

      if ((nextWrapStyle.flexGrow || 0) > 0) {
        nextContentContainerStyle.flexGrow = nextWrapStyle.flexGrow || 0
        if (Platform.OS === 'android') {
          nextWrapStyle.minHeight = outerHeight || 0
        }
      }

      return {
        contentContainerStyle: nextContentContainerStyle,
        wrapStyle: nextWrapStyle
      }
    }, [props.contentContainerStyle, outerHeight])

    return wrapRender(
      // @ts-ignore scrollToOverflowEnabled is missing from type
      <ScrollViewComponent
        scrollEventThrottle={16}
        {...props}
        ref={mergedRef}
        scrollToOverflowEnabled
        scrollEnabled={keyboardHeight === 0}
        onLayout={handleLayout}
        onScroll={onScroll}
        automaticallyAdjustContentInsets={false}
        onContentSizeChange={updateKeyboardAwareViewContentSize}
        contentContainerStyle={contentContainerStyle}>
        <View style={wrapStyle}>{props.children}</View>
      </ScrollViewComponent>
    )
  })
}

export default makeKeyboardAware
