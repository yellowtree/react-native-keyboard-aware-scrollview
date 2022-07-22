import {
  useState,
  useCallback,
  useRef,
  useEffect,
  ReactElement,
  useMemo
} from 'react'
import ReactNative, {
  Keyboard,
  NativeModules,
  ScrollView,
  TextInput,
  LayoutRectangle,
  NativeScrollPoint,
  Platform,
  KeyboardEventName,
  StyleProp,
  ViewStyle
} from 'react-native'
import usePageY from './usePageY'
import { useProvideKeyboardAwareContext } from './useKeyboardAwareContext'

const ScrollViewManager = NativeModules.ScrollViewManager

export interface KeyboardAwareBaseProps {
  style?: StyleProp<ViewStyle>
  scrollToInputAdditionalOffset?: number
  scrollToBottomOnKBShow?: boolean
  startScrolledToBottom?: boolean
}

type KeyboardAwareViewRef = React.MutableRefObject<ScrollView | undefined>

const useKeyboardAwareBase: (
  props: KeyboardAwareBaseProps
) => {
  keyboardHeight: number
  keyboardAwareView: KeyboardAwareViewRef
  onKeyboardAwareViewLayout: (layout: LayoutRectangle) => void
  onKeyboardAwareViewScroll: (contentOffset: NativeScrollPoint) => void
  updateKeyboardAwareViewContentSize: () => void
  dimensions: LayoutRectangle | undefined
  contentOffset: { x: number; y: number } | undefined
  contentSize: LayoutRectangle | undefined
  wrapRender: (children: ReactElement) => ReactElement
} = ({
  style = undefined,
  scrollToInputAdditionalOffset = 75,
  scrollToBottomOnKBShow = false,
  startScrolledToBottom = false
}) => {
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const keyboardAwareView: KeyboardAwareViewRef = useRef<ScrollView>()
  const dimensions = useRef<LayoutRectangle>()
  const contentOffset = useRef<{ x: number; y: number }>()
  const contentSize = useRef<LayoutRectangle>()

  const [getPageY, wrapPageY] = usePageY(style)

  const scrollToTextInput = useCallback(
    (input: TextInput) => {
      if (Platform.OS === 'android') {
        return
      }
      if (!input) {
        return
      }
      setImmediate(() => {
        getPageY((pageY) => {
          if (!keyboardAwareView.current) {
            return
          }
          keyboardAwareView.current
            .getScrollResponder()
            // @ts-ignore This function is missing from react-native's types
            .scrollResponderScrollNativeHandleToKeyboard(
              ReactNative.findNodeHandle(input),
              scrollToInputAdditionalOffset + pageY,
              true
            )
        })
      })
    },
    [getPageY, scrollToInputAdditionalOffset]
  )
  const { textInputRefs, wrap: wrapContext } = useProvideKeyboardAwareContext(
    scrollToTextInput
  )

  const scrollToFocusedTextInput = useCallback(() => {
    if (Platform.OS === 'android') {
      return
    }
    textInputRefs.some((textInputRef) => {
      if (!textInputRef) {
        return false
      }
      if (
        !textInputRef.isFocused ||
        typeof textInputRef.isFocused !== 'function'
      ) {
        return false
      }
      if (textInputRef.isFocused()) {
        scrollToTextInput(textInputRef)
      }
      return textInputRef.isFocused()
    })
  }, [scrollToTextInput, textInputRefs])

  const scrollToBottom = useCallback((scrollAnimated = true) => {
    if (keyboardAwareView.current) {
      if (!contentSize.current) {
        setTimeout(() => scrollToBottom(scrollAnimated), 50)
        return
      }

      const bottomYOffset =
        contentSize.current.height -
        (dimensions.current?.height || 0) +
        (keyboardAwareView.current.props.contentInset?.bottom || 0)
      keyboardAwareView.current &&
        keyboardAwareView.current.scrollTo({
          x: 0,
          y: bottomYOffset,
          animated: scrollAnimated
        })
    }
  }, [])

  const onKeyboardWillShow = useCallback<ReactNative.KeyboardEventListener>(
    (event) => {
      setTimeout(() => scrollToFocusedTextInput(), 400)

      const newKeyboardHeight = event.endCoordinates.height
      if (keyboardHeight === newKeyboardHeight) {
        return
      }

      setKeyboardHeight(newKeyboardHeight)

      if (scrollToBottomOnKBShow) {
        scrollToBottom()
      }
    },
    [
      keyboardHeight,
      scrollToBottom,
      scrollToBottomOnKBShow,
      scrollToFocusedTextInput
    ]
  )

  const onKeyboardWillHide = useCallback<ReactNative.KeyboardEventListener>(
    (_event) => {
      const _keyboardHeight = keyboardHeight
      setKeyboardHeight(0)

      const yOffset =
        contentOffset.current && contentOffset.current.y
          ? Math.max(contentOffset.current.y - _keyboardHeight, 0)
          : 0
      keyboardAwareView.current &&
        keyboardAwareView.current.scrollTo({ x: 0, y: yOffset, animated: true })
    },
    [keyboardHeight]
  )

  useEffect(() => {
    if (Platform.OS === 'android') {
      return
    }
    const keyboardEventListeners = [
      Keyboard.addListener('keyboardWillShow', onKeyboardWillShow),
      Keyboard.addListener('keyboardWillHide', onKeyboardWillHide)
    ]
    return (): void =>
      keyboardEventListeners.forEach((eventListener) => eventListener.remove())
  }, [onKeyboardWillShow, onKeyboardWillHide])

  useEffect(() => {
    if (keyboardAwareView.current && startScrolledToBottom) {
      scrollToBottom(false)
      setTimeout(
        //@ts-ignore
        () => keyboardAwareView.current.setNativeProps({ opacity: 1 }),
        100
      )
    }
  }, [scrollToBottom, startScrolledToBottom])

  //const scrollBottomOnNextSizeChangeRef = useRef(false)
  const updateKeyboardAwareViewContentSize = useCallback(() => {
    if (
      keyboardAwareView.current &&
      ScrollViewManager &&
      ScrollViewManager.getContentSize
    ) {
      ScrollViewManager.getContentSize(
        ReactNative.findNodeHandle(keyboardAwareView.current),
        (res: ReactNative.LayoutRectangle) => {
          contentSize.current = res
        }
      )
    }
  }, [])

  const onKeyboardAwareViewLayout = useCallback(
    (layout: LayoutRectangle) => {
      dimensions.current = layout
      contentOffset.current = { x: 0, y: 0 }
      updateKeyboardAwareViewContentSize()
    },
    [updateKeyboardAwareViewContentSize]
  )

  const onKeyboardAwareViewScroll = useCallback(
    (nextContentOffset: NativeScrollPoint) => {
      contentOffset.current = nextContentOffset
      updateKeyboardAwareViewContentSize()
    },
    [updateKeyboardAwareViewContentSize]
  )

  // const scrollBottomOnNextSizeChange = useCallback(() => {
  //   scrollBottomOnNextSizeChangeRef.current = true;
  // }, [])

  // const scrollTo = useCallback((options) => {
  //   if (keyboardAwareView.current) {
  //     keyboardAwareView.current.scrollTo(options);
  //   }
  // }, [])

  const wrapRender = useMemo(
    () => (x: ReactElement): ReactElement => wrapContext(wrapPageY(x)),
    [wrapContext, wrapPageY]
  )

  return {
    keyboardHeight,
    keyboardAwareView,
    onKeyboardAwareViewLayout,
    onKeyboardAwareViewScroll,
    updateKeyboardAwareViewContentSize,
    dimensions: dimensions.current,
    contentOffset: contentOffset.current,
    contentSize: contentSize.current,
    wrapRender
  }
}

export default useKeyboardAwareBase
