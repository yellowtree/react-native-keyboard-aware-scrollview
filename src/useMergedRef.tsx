import { useCallback } from 'react';

function useMergedRef<T> (...refs: any[]): (current: T) => void {
  const setRef = useCallback((current: T) => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(current)
      } else if (ref) {
        ref.current = current
      }
    })
  }, refs)

  return setRef
}

export default useMergedRef
