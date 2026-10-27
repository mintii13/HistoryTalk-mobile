import React from 'react';
import { StyleSheet, TextInput as RNTextInput, type TextInputProps } from 'react-native';

import { bodyFontFor } from '@/constants/theme';

/** TextInput cua RN + font Inter theo do dam (o nhap mac dinh khong ke thua font cua app). */
export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(({ style, ...props }, ref) => (
  <RNTextInput ref={ref} style={[{ fontFamily: bodyFontFor(StyleSheet.flatten(style)?.fontWeight) }, style]} {...props} />
));
TextInput.displayName = 'TextInput';

// Kieu ref, dung `useRef<TextInputRef>(null)`.
export type TextInputRef = RNTextInput;
