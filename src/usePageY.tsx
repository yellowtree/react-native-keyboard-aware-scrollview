import React, { ReactNode, useState, useRef, useCallback, useEffect } from 'react'
import { View } from 'react-native';

const usePageY: (dependencies: any[], style) => [number, (ReactNode) => ReactNode] = (dependencies, style) => {
  const [pageY, setPageY] = useState(0)

  const wrapper = useRef<View>()
  const lastPageY = useRef(NaN)
  const measureBottom = useCallback(() => {
    wrapper.current && wrapper.current.measure((x, y, width, height, pageX, pageY) => {
      setPageY(pageY)
      if (lastPageY.current !== pageY) {
        lastPageY.current = pageY
        setTimeout(measureBottom, 200)
      }
    })
    if (!wrapper.current) {
      setTimeout(measureBottom, 200)
    }
  }, [])
  useEffect(measureBottom, [wrapper.current, ...dependencies])

  const wrap = useCallback((children) => (
    <View ref={wrapper} style={style}>{children}</View>
  ), [])
  return [pageY, wrap]
}

export default usePageY
