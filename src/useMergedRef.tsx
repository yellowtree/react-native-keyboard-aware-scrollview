import { useCallback } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function useMergedRef<T>(...refs: any[]): (current: T) => void {
  const setRef = useCallback((current: T) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(current)
      } else if (ref) {
        ref.current = current
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs)

  return setRef
}

export default useMergedRef
