import { useState, useCallback, useRef, useEffect } from 'react'
import ReactNative, {
  DeviceEventEmitter,
  Keyboard,
  NativeModules,
  ScrollView,
  TextInput,
  LayoutRectangle,
  NativeScrollPoint
} from 'react-native'

const ScrollViewManager = NativeModules.ScrollViewManager

export interface KeyboardAwareBaseProps {
  getTextInputRefs?: () => TextInput[],
  scrollToInputAdditionalOffset?: number,
  scrollToBottomOnKBShow?: boolean,
  startScrolledToBottom?: boolean
}

const emptyArr = []
const getEmptyArr = () => emptyArr
const useKeyboardAwareBase: (KeyboardAwareBaseProps) => {
  keyboardHeight: number,
  keyboardAwareView: React.MutableRefObject<ScrollView>,
  onKeyboardAwareViewLayout: (layout: LayoutRectangle) => void,
  onKeyboardAwareViewScroll: (contentOffset: NativeScrollPoint) => void,
  updateKeyboardAwareViewContentSize: () => void
} = ({
  getTextInputRefs = getEmptyArr,
  scrollToInputAdditionalOffset = 75,
  scrollToBottomOnKBShow = false,
  startScrolledToBottom = false
}) => {
    const [keyboardHeight, setKeyboardHeight] = useState(0)
    const keyboardAwareView = useRef<ScrollView>()

    const scrollToFocusedTextInput = useCallback(() => {
      if (getTextInputRefs) {
        const textInputRefs = getTextInputRefs();
        textInputRefs.some((textInputRef, index, array) => {
          const isFocusedFunc = textInputRef.isFocused();
          const isFocused = isFocusedFunc && (typeof isFocusedFunc === "function") ? isFocusedFunc() : isFocusedFunc;
          if (isFocused) {
            setTimeout(() => {
              keyboardAwareView.current.getScrollResponder().scrollResponderScrollNativeHandleToKeyboard(
                ReactNative.findNodeHandle(textInputRef), scrollToInputAdditionalOffset, true);
            }, 0);
          }
          return isFocused;
        });
      }
    }, [])

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
    }, [keyboardHeight])

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
        setTimeout(() => keyboardAwareView.current.setNativeProps({ opacity: 1 }), 100);
      }
    }, [])

    const scrollBottomOnNextSizeChangeRef = useRef(false)
    const updateKeyboardAwareViewContentSize = useCallback(() => {
      if (ScrollViewManager && ScrollViewManager.getContentSize) {
        ScrollViewManager.getContentSize(ReactNative.findNodeHandle(keyboardAwareView.current), (res) => {
          if (keyboardAwareView.current) {
            keyboardAwareView.current.contentSize = res;
            if (scrollBottomOnNextSizeChangeRef.current) {
              scrollToBottom();
              scrollBottomOnNextSizeChangeRef.current = false;
            }
          }
        })
      }
    }, [])

    const onKeyboardAwareViewLayout = useCallback((layout) => {
      keyboardAwareView.current.layout = layout;
      keyboardAwareView.current.contentOffset = { x: 0, y: 0 };
      updateKeyboardAwareViewContentSize();
    }, [])

    const onKeyboardAwareViewScroll = useCallback((contentOffset) => {
      keyboardAwareView.current.contentOffset = contentOffset;
      updateKeyboardAwareViewContentSize();
    }, [])

    const scrollBottomOnNextSizeChange = useCallback(() => {
      scrollBottomOnNextSizeChangeRef.current = true;
    }, [])

    const scrollTo = useCallback((options) => {
      if (keyboardAwareView.current) {
        keyboardAwareView.current.scrollTo(options);
      }
    }, [])

    return {
      keyboardHeight,
      keyboardAwareView,
      onKeyboardAwareViewLayout,
      onKeyboardAwareViewScroll,
      updateKeyboardAwareViewContentSize
    }
  }

export default useKeyboardAwareBase
