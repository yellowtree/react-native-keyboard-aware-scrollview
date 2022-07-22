import React, { useCallback } from 'react'
import { NativeSyntheticEvent, TextInput as TextInputBase, TextInputFocusEventData, TextInputProps } from 'react-native'
import useKeyboardAwareContext from './useKeyboardAwareContext'
import useMergedRef from './useMergedRef'

/**
 * Use this TextInput instead of the default TextInput to make KeyboardAware*View
 * automatically aware of this <TextInput>
 *
 * Usage same as: https://facebook.github.io/react-native/docs/textinput
 */
const TextInput = React.forwardRef<TextInputBase, TextInputProps>(
  (props, ref) => {
    const { inputRef, onFocus } = useKeyboardAwareContext()
    const mergedRef = useMergedRef(ref, inputRef)

    const propsOnFocus = props.onFocus
    const handleFocus = useCallback(
      (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
        propsOnFocus && propsOnFocus(e)
        onFocus()
      },
      [onFocus, propsOnFocus]
    )

    return <TextInputBase {...props} ref={mergedRef} onFocus={handleFocus} />
  }
)

export default TextInput
