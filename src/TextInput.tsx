import React, { useCallback } from 'react'
import { TextInput as TextInputBase, TextInputProps } from 'react-native';
import useKeyboardAwareContext from './useKeyboardAwareContext';
import useMergedRef from './useMergedRef';

/**
 * Use this TextInput instead of the default TextInput to make KeyboardAware*View
 * automatically aware of this <TextInput>
 *
 * Usage same as: https://facebook.github.io/react-native/docs/textinput
 */
const TextInput = React.forwardRef<TextInputBase, TextInputProps>((props, ref) => {
  const {
    inputRef,
    onFocus
  } = useKeyboardAwareContext()
  const mergedRef = useMergedRef(ref, inputRef)

  const handleFocus = useCallback((e) => {
    props.onFocus && props.onFocus(e)
    onFocus()
  }, [props.onFocus])

  return (
    <TextInputBase {...props} ref={mergedRef} onFocus={handleFocus} />
  )
})

export default TextInput
