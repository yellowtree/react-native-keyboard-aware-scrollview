import { useState, useCallback, useRef, useEffect, ReactNode } from 'react'
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

const ScrollViewManager = NativeModules.ScrollViewManager

export interface KeyboardAwareBaseProps {
  getTextInputRefs?: () => TextInput[],
  scrollToInputAdditionalOffset?: number,
  scrollToBottomOnKBShow?: boolean,
  startScrolledToBottom?: boolean
}

type KeyboardAwareViewRef = React.MutableRefObject<ScrollView & {
  layout: LayoutRectangle,
  contentOffset: { x: number, y: number },
  contentSize: LayoutRectangle
}>

const emptyArr = []
const getEmptyArr = () => emptyArr
const useKeyboardAwareBase: (KeyboardAwareBaseProps) => {
  keyboardHeight: number,
  keyboardAwareView: KeyboardAwareViewRef,
  onKeyboardAwareViewLayout: (layout: LayoutRectangle) => void,
  onKeyboardAwareViewScroll: (contentOffset: NativeScrollPoint) => void,
  updateKeyboardAwareViewContentSize: () => void,
  dimensions: LayoutRectangle,
  contentOffset: { x: number, y: number },
  contentSize: LayoutRectangle,
  wrapRender: (ReactNode) => ReactNode
} = ({
  style = false,
  getTextInputRefs = getEmptyArr,
  scrollToInputAdditionalOffset = 75,
  scrollToBottomOnKBShow = false,
  startScrolledToBottom = false
}) => {
    const [keyboardHeight, setKeyboardHeight] = useState(0)
    const keyboardAwareView: KeyboardAwareViewRef = useRef()
    const [dimensions, setDimensions] = useState<LayoutRectangle>({ x: 0, y: 0, width: 0, height: 0 })
    const [contentOffset, setContentOffset] = useState({ x: 0, y: 0 })
    const [contentSize, setContentSize] = useState<LayoutRectangle>({ x: 0, y: 0, width: 0, height: 0 })

    const [pageY, wrapRender] = usePageY([dimensions, keyboardHeight], style)

    const scrollToFocusedTextInput = useCallback(() => {
      if (getTextInputRefs) {
        const textInputRefs = getTextInputRefs();
        textInputRefs.some((textInputRef, index, array) => {
          if (!textInputRef) {
            console.warn('getTextInputRefs returned falsy value at position ' + index)
            return false
          }
          if (!textInputRef.isFocused || (typeof textInputRef.isFocused !== "function")) {
            console.warn('getTextInputRefs returned something that isn\'t a TextInput at position ' + index)
            return false
          }
          if (textInputRef.isFocused()) {
            setTimeout(() => {
              keyboardAwareView.current
                .getScrollResponder()
                // @ts-ignore This function is missing from react-native's types
                .scrollResponderScrollNativeHandleToKeyboard(
                  ReactNative.findNodeHandle(textInputRef),
                  scrollToInputAdditionalOffset + pageY,
                  true
                )
            }, 0);
          }
          return textInputRef.isFocused();
        });
      }
    }, [pageY])

    const scrollToBottom = useCallback((scrollAnimated = true) => {
      if (keyboardAwareView.current) {

        if (!keyboardAwareView.current.contentSize) {
          setTimeout(() => scrollToBottom(scrollAnimated), 50);
          return;
        }

        const bottomYOffset = keyboardAwareView.current.contentSize.height - keyboardAwareView.current.layout.height + keyboardAwareView.current.props.contentInset.bottom;
        keyboardAwareView.current.scrollTo({ x: 0, y: bottomYOffset, animated: scrollAnimated });
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

      const hasYOffset = keyboardAwareView.current && keyboardAwareView.current.contentOffset && keyboardAwareView.current.contentOffset.y !== undefined;
      const yOffset = hasYOffset ? Math.max(keyboardAwareView.current.contentOffset.y - _keyboardHeight, 0) : 0;
      keyboardAwareView.current.scrollTo({ x: 0, y: yOffset, animated: true });
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
      if (ScrollViewManager && ScrollViewManager.getContentSize) {
        ScrollViewManager.getContentSize(ReactNative.findNodeHandle(keyboardAwareView.current), (res) => {
          if (keyboardAwareView.current) {
            keyboardAwareView.current.contentSize = res;
            setContentSize(res)
            // if (scrollBottomOnNextSizeChangeRef.current) {
            //   scrollToBottom();
            //   scrollBottomOnNextSizeChangeRef.current = false;
            // }
          }
        })
      }
    }, [])

    const onKeyboardAwareViewLayout = useCallback((layout) => {
      keyboardAwareView.current.layout = layout;
      setDimensions(layout)
      keyboardAwareView.current.contentOffset = { x: 0, y: 0 };
      setContentOffset({ x: 0, y: 0 })
      updateKeyboardAwareViewContentSize();
    }, [])

    const onKeyboardAwareViewScroll = useCallback((contentOffset) => {
      keyboardAwareView.current.contentOffset = contentOffset;
      setContentOffset(contentOffset)
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

    return {
      keyboardHeight,
      keyboardAwareView,
      onKeyboardAwareViewLayout,
      onKeyboardAwareViewScroll,
      updateKeyboardAwareViewContentSize,
      dimensions,
      contentOffset,
      contentSize,
      wrapRender
    }
  }

export default useKeyboardAwareBase
