import TextInput from './src/TextInput'
import useKeyboardAwareContext from './src/useKeyboardAwareContext'
import makeKeyboardAware from './src/makeKeyboardAware'
import { ScrollView, FlatList } from 'react-native'

const KeyboardAwareScrollView = makeKeyboardAware(ScrollView)
const KeyboardAwareFlatList = makeKeyboardAware(FlatList)

export {
  makeKeyboardAware,
  KeyboardAwareScrollView,
  KeyboardAwareFlatList,
  TextInput,
  useKeyboardAwareContext
}
