import React, { useState, useRef, useCallback, useEffect, ReactElement } from 'react'
import { View } from 'react-native';

type PageYCallback = () => number

const usePageY: (style) => [(PageYCallback) => void, (children: ReactElement) => ReactElement] = (style) => {
  const wrapper = useRef<View>()

  const getPageY = useCallback((pageYCallback) => {
    if (wrapper.current) {
      wrapper.current.measure((x, y, width, height, pageX, pageY) => {
        pageYCallback(pageY)
      })
    } else {
      pageYCallback(0)
    }
  }, [])

  const wrap = useCallback((children) => (
    <View ref={wrapper} style={style}>{children}</View>
  ), [])
  return [getPageY, wrap]
}

export default usePageY
