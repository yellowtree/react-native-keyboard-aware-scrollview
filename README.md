# react-native-keyboard-aware-scrollview
A helper component meant to be used as a drop-in replacement for RN ScrollView which handles the ScrollView insets properly when the keyboard is shown or hides so all the content is scrollable and available to the user.

## This is a fork, but not a drop-in-replacement
The fork converts the library to Typescript and removes all classes in favour of hooks. As a side-effect you can't use ref for this component anymore. This may be temporarily.

## Installation

Install using `npm`:
```
yarn add ssh://git@github.com:yellowtree/react-native-keyboard-aware-scrollview.git
```

## How To Use
Simply import the new component:

```ts
import {KeyboardAwareScrollView, TextInput} from 'react-native-keyboard-aware-scrollview'
```

Now use it as you would normally do with a `ScrollView` to wrap arround `TextInput` components:

```tsx
<KeyboardAwareScrollView>
    <TextInput />
</KeyboardAwareScrollView>
```

#### Auto-Scrolling for TextInput components

Normally this component will just take care of handling the content inset. If you wish for `KeyboardAwareScrollView` to automatically scroll to a TextInput that gets focus (so it's ensured to be visible), use the `TextInput` provided by
this package. (see above example)

## Example Project

**The example project has not yet been updated and probably won't work**

Check out the full example project [here](https://github.com/wix/react-native-keyboard-aware-scrollview/tree/master/example).

In the example folder, perform `npm install` and then run it from the Xcode project.
