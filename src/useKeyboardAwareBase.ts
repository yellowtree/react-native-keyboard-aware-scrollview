import { useState, useCallback, useRef, useEffect, ReactElement, useMemo } from 'react'
import ReactNative, {
  DeviceEventEmitter,
  Keyboard,
  NativeModules,
  ScrollView,
  TextInput,
  LayoutRectangle,
  NativeScrollPoint
} from 'react-native'
import usePageY from './usePageY';
import { useProvideKeyboardAwareContext } from './useKeyboardAwareContext';

const ScrollViewManager = NativeModules.ScrollViewManager

export interface KeyboardAwareBaseProps {
  scrollToInputAdditionalOffset?: number,
  scrollToBottomOnKBShow?: boolean,
  startScrolledToBottom?: boolean
}

type KeyboardAwareViewRef = React.MutableRefObject<ScrollView>

const useKeyboardAwareBase: (KeyboardAwareBaseProps) => {
  keyboardHeight: number,
  keyboardAwareView: KeyboardAwareViewRef,
  onKeyboardAwareViewLayout: (layout: LayoutRectangle) => void,
  onKeyboardAwareViewScroll: (contentOffset: NativeScrollPoint) => void,
  updateKeyboardAwareViewContentSize: () => void,
  dimensions: LayoutRectangle,
  contentOffset: { x: number, y: number },
  contentSize: LayoutRectangle,
  wrapRender: (children: ReactElement) => ReactElement
} = ({
  style = false,
  scrollToInputAdditionalOffset = 75,
  scrollToBottomOnKBShow = false,
  startScrolledToBottom = false
}) => {
    const [keyboardHeight, setKeyboardHeight] = useState(0)
    const keyboardAwareView: KeyboardAwareViewRef = useRef()
    const dimensions = useRef<LayoutRectangle>()
    const contentOffset = useRef<{ x: number, y: number }>()
    const contentSize = useRef<LayoutRectangle>()

    const [getPageY, wrapPageY] = usePageY(style)

    const scrollToTextInput = useCallback((input: TextInput) => {
      if (!input) {
        return;
      }
      setImmediate(() => {
        getPageY(pageY => {
          keyboardAwareView.current
            .getScrollResponder()
            // @ts-ignore This function is missing from react-native's types
            .scrollResponderScrollNativeHandleToKeyboard(
              ReactNative.findNodeHandle(input),
              scrollToInputAdditionalOffset + pageY,
              true
            )
        })
      });
    }, [getPageY])
    const { textInputRefs, wrap: wrapContext } = useProvideKeyboardAwareContext(scrollToTextInput)

    const scrollToFocusedTextInput = useCallback(() => {
      textInputRefs.some((textInputRef, index) => {
        if (!textInputRef) {
          // console.warn('getTextInputRefs returned falsy value at position ' + index)
          return false
        }
        if (!textInputRef.isFocused || (typeof textInputRef.isFocused !== "function")) {
          // console.warn('getTextInputRefs returned something that isn\'t a TextInput at position ' + index)
          return false
        }
        if (textInputRef.isFocused()) {
          scrollToTextInput(textInputRef)
        }
        return textInputRef.isFocused();
      });
    }, [scrollToTextInput])

    const scrollToBottom = useCallback((scrollAnimated = true) => {
      if (keyboardAwareView.current) {

        if (!contentSize.current) {
          setTimeout(() => scrollToBottom(scrollAnimated), 50);
          return;
        }

        const bottomYOffset = contentSize.current.height - dimensions.current.height + keyboardAwareView.current.props.contentInset.bottom;
        keyboardAwareView.current && keyboardAwareView.current.scrollTo({ x: 0, y: bottomYOffset, animated: scrollAnimated });
      }
    }, [])

    const onKeyboardWillShow = useCallback((event) => {
      scrollToFocusedTextInput();

      const newKeyboardHeight = event.endCoordinates.height;
      if (keyboardHeight === newKeyboardHeight) {
        return;
      }

      setKeyboardHeight(newKeyboardHeight);

      if (scrollToBottomOnKBShow) {
        scrollToBottom();
      }
    }, [keyboardHeight, scrollToFocusedTextInput])

    const onKeyboardWillHide = useCallback((event) => {
      const _keyboardHeight = keyboardHeight
      setKeyboardHeight(0)

      const hasYOffset = contentOffset.current && contentOffset.current.y;
      const yOffset = hasYOffset ? Math.max(contentOffset.current.y - _keyboardHeight, 0) : 0;
      keyboardAwareView.current && keyboardAwareView.current.scrollTo({ x: 0, y: yOffset, animated: true });
    }, [keyboardHeight])

    useEffect(() => {
      const KeyboardEventsObj = Keyboard || DeviceEventEmitter;
      const keyboardEventListeners = [
        KeyboardEventsObj.addListener('keyboardWillShow', onKeyboardWillShow),
        KeyboardEventsObj.addListener('keyboardWillHide', onKeyboardWillHide)
      ];
      return () => keyboardEventListeners.forEach((eventListener) => eventListener.remove())
    }, [onKeyboardWillShow, onKeyboardWillHide])

    useEffect(() => {
      if (keyboardAwareView.current && startScrolledToBottom) {
        scrollToBottom(false);
        // @ts-ignore
        setTimeout(() => keyboardAwareView.current.setNativeProps({ opacity: 1 }), 100);
      }
    }, [])

    //const scrollBottomOnNextSizeChangeRef = useRef(false)
    const updateKeyboardAwareViewContentSize = useCallback(() => {
      if (keyboardAwareView.current && ScrollViewManager && ScrollViewManager.getContentSize) {
        ScrollViewManager.getContentSize(ReactNative.findNodeHandle(keyboardAwareView.current), (res) => {
          contentSize.current = res
        })
      }
    }, [keyboardAwareView.current])

    const onKeyboardAwareViewLayout = useCallback((layout) => {
      dimensions.current = layout;
      contentOffset.current = { x: 0, y: 0 };
      updateKeyboardAwareViewContentSize();
    }, [])

    const onKeyboardAwareViewScroll = useCallback((contentOffset) => {
      contentOffset.current = contentOffset;
      updateKeyboardAwareViewContentSize();
    }, [])

    // const scrollBottomOnNextSizeChange = useCallback(() => {
    //   scrollBottomOnNextSizeChangeRef.current = true;
    // }, [])

    // const scrollTo = useCallback((options) => {
    //   if (keyboardAwareView.current) {
    //     keyboardAwareView.current.scrollTo(options);
    //   }
    // }, [])

    const wrapRender = useMemo(() => x => wrapContext(wrapPageY(x)), [wrapContext, wrapPageY])

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
