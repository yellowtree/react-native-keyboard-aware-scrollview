import React, {
  useRef,
  useContext,
  useEffect,
  useCallback,
  ReactElement
} from 'react'
import { TextInput } from 'react-native'

const noopContext = {
  registerInput: () => (): void => undefined,
  onFocus: (): void => undefined
}

export const KeyboardAwareContext = React.createContext<{
  registerInput: (TextInput) => () => void
  onFocus: (TextInput) => void
}>(noopContext)

export const useProvideKeyboardAwareContext: (
  onFocus: (TextInput) => void
) => {
  textInputRefs: TextInput[]
  wrap: (children: ReactElement) => ReactElement
} = (onFocus) => {
  const textInputRefs = useRef<TextInput[]>([])

  const registerInput = useCallback((input: TextInput) => {
    textInputRefs.current = textInputRefs.current
      .filter((x) => x !== input)
      .concat([input])
    return (): void => {
      textInputRefs.current = textInputRefs.current.filter((x) => x !== input)
    }
  }, [])

  const wrap = (children: ReactElement): React.ReactElement => (
    <KeyboardAwareContext.Provider value={{ registerInput, onFocus }}>
      {children}
    </KeyboardAwareContext.Provider>
  )

  return {
    textInputRefs: textInputRefs.current,
    wrap
  }
}

/**
 * Use this to make KeyboardAware*View aware of a specific input
 *
 * Usage: pass inputRef as ref and onFocus to the <TextInput> in question.
 */
const useKeyboardAwareContext: () => {
  inputRef: React.MutableRefObject<TextInput>
  onFocus: () => void
} = () => {
  const inputRef = useRef<TextInput>()
  const { onFocus, registerInput } = useContext(KeyboardAwareContext)

  useEffect(() => registerInput(inputRef.current), [registerInput])
  const handleFocus = useCallback(() => onFocus(inputRef.current), [onFocus])

  return {
    inputRef,
    onFocus: handleFocus
  }
}

export default useKeyboardAwareContext
