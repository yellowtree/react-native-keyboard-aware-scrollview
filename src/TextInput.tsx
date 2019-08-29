import React, { useCallback } from 'react'
import { TextInput as TextInputBase, TextInputProps } from 'react-native';
import useKeyboardAwareContext from './useKeyboardAwareContext';

/**
 * Use this TextInput instead of the default TextInput to make KeyboardAware*View
 * automatically aware of this <TextInput>
 *
 * Usage same as: https://facebook.github.io/react-native/docs/textinput
 */
const TextInput: React.FunctionComponent<TextInputProps> = (props) => {
  const {
    inputRef,
    onFocus
  } = useKeyboardAwareContext()

  const handleFocus = useCallback((e) => {
    props.onFocus && props.onFocus(e)
    onFocus()
  }, [props.onFocus])

  return (
    <TextInputBase {...props} ref={inputRef} onFocus={handleFocus} />
  )
}

export default TextInput
