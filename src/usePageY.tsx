import React, { useRef, useCallback, ReactElement } from 'react'
import { View, StyleProp, ViewStyle } from 'react-native'

type PageYCallback = (pageY: number) => void

const flex1 = { flex: 1 }

const usePageY: (
  style: StyleProp<ViewStyle>
) => [(cb: PageYCallback) => void, (children: ReactElement) => ReactElement] = (
  style
) => {
  const wrapper = useRef<View>(undefined)

  const getPageY = useCallback((pageYCallback: PageYCallback) => {
    if (wrapper.current) {
      wrapper.current.measure(
        (_x, _y, _width, _height, _pageX, pageY: number | undefined) => {
          /* When pageY is 0 this function will be called with pageY: undefined on android */
          pageYCallback(pageY || 0)
        }
      )
    } else {
      pageYCallback(0)
    }
  }, [])

  const wrap = useCallback(
    (children: React.ReactNode) => (
      <View
        ref={wrapper as React.MutableRefObject<View>}
        style={[flex1, style]}>
        {children}
      </View>
    ),
    [style]
  )
  return [getPageY, wrap]
}

export default usePageY
