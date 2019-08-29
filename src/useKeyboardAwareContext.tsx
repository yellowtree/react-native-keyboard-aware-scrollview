import React, { useRef, useContext, useEffect, useCallback, ReactElement } from 'react'
import { TextInput } from 'react-native';

const noopContext = {
  registerInput: () => () => { },
  onFocus: () => { }
}

export const KeyboardAwareContext = React.createContext<{
  registerInput: (TextInput) => () => void,
  onFocus: (TextInput) => void
}>(noopContext)

export const useProvideKeyboardAwareContext: (onFocus: (TextInput) => void) => {
  textInputRefs: TextInput[],
  wrap: (children: ReactElement) => ReactElement
} = (onFocus) => {
  const textInputRefs = useRef<TextInput[]>([])

  const registerInput = useCallback((input: TextInput) => {
    textInputRefs.current = textInputRefs.current.filter(x => x !== input).concat([input])
    return () => {
      textInputRefs.current = textInputRefs.current.filter(x => x !== input)
    }
  }, [])

  const wrap = children =>
    <KeyboardAwareContext.Provider value={{ registerInput, onFocus }}>{children}</KeyboardAwareContext.Provider>

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
const useKeyboardAwareContext: () => ({
  inputRef: React.MutableRefObject<TextInput>,
  onFocus: () => void
}) = () => {
  const inputRef = useRef<TextInput>()
  const {
    onFocus,
    registerInput
  } = useContext(KeyboardAwareContext)

  useEffect(() => registerInput(inputRef.current), [inputRef.current])
  const handleFocus = useCallback(() => onFocus(inputRef.current), [])

  return {
    inputRef,
    onFocus: handleFocus
  }
}

export default useKeyboardAwareContext
