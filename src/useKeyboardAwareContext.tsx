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
  registerInput: (input?: TextInput | null) => () => void
  onFocus: (input?: TextInput | null) => void
}>(noopContext)

export const useProvideKeyboardAwareContext: (
  onFocus: (input: TextInput) => void
) => {
  textInputRefs: TextInput[]
  wrap: (children: ReactElement) => ReactElement
} = (onFocus) => {
  const textInputRefs = useRef<TextInput[]>([])

  const registerInput = useCallback((input?: TextInput | null) => {
    if (!input) {
      return () => undefined
    }
    textInputRefs.current = textInputRefs.current
      .filter((x) => x !== input)
      .concat([input])
    return (): void => {
      textInputRefs.current = textInputRefs.current.filter((x) => x !== input)
    }
  }, [])

  const handleFocus = useCallback(
    (input?: TextInput | null) => {
      if (input) {
        onFocus(input)
      }
    },
    [onFocus]
  )

  const wrap = (children: ReactElement): React.ReactElement => (
    <KeyboardAwareContext.Provider
      value={{ registerInput, onFocus: handleFocus }}>
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
  inputRef: React.Ref<TextInput>
  onFocus: () => void
} = () => {
  const inputRef = useRef<TextInput>(null)
  const { onFocus, registerInput } = useContext(KeyboardAwareContext)

  useEffect(() => registerInput(inputRef.current), [registerInput])
  const handleFocus = useCallback(() => onFocus(inputRef.current), [onFocus])

  return {
    inputRef,
    onFocus: handleFocus
  }
}

export default useKeyboardAwareContext
