import { tva } from '@gluestack-ui/nativewind-utils/tva';
import React from 'react';
import { StyleSheet, Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { bodyFontFor } from '@/constants/theme';

const textStyle = tva({
  base: '',
  variants: {
    size: {
      '2xs': 'text-[10px] leading-[14px]',
      xs:    'text-xs leading-4',
      sm:    'text-sm leading-5',
      md:    'text-base leading-6',
      lg:    'text-lg leading-7',
      xl:    'text-xl leading-8',
      '2xl': 'text-2xl leading-9',
    },
    bold: {
      true: 'font-bold',
    },
    italic: {
      true: 'italic',
    },
    tone: {
      ink: 'text-history-text',
      muted: 'text-history-muted',
    },
  },
});

type TextSize = '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

type TextProps = RNTextProps & {
  className?: string;
  size?: TextSize;
  bold?: true;
  italic?: true;
  muted?: true;
};

const Text = React.forwardRef<React.ElementRef<typeof RNText>, TextProps>(
  ({ className, size = 'md', bold, italic, muted, style, ...props }, ref) => {
    const flat = StyleSheet.flatten(style) ?? {};
    return (
      <RNText
        ref={ref}
        // Tren web class Tailwind de len style cua man hinh (cung do uu tien, nap sau), nen chi gan
        // co chu / mau mac dinh khi style khong tu dat — truoc day moi chu tren web deu 16px mau muc.
        className={textStyle({
          size: flat.fontSize == null ? size : undefined,
          bold,
          italic,
          tone: flat.color != null ? undefined : muted ? 'muted' : 'ink',
          class: className,
        })}
        // fontWeight cua man hinh quyet dinh file font Inter (Android khong tu ghep weight cho font tuy chinh).
        style={[{ fontFamily: bodyFontFor(flat.fontWeight ?? (bold ? 700 : 400)) }, style]}
        {...props}
      />
    );
  }
);
Text.displayName = 'Text';

/** Nhu RN Text (khong co class co chu mac dinh), chi gan font Inter dung do dam. Dung cho badge/nut/component goc. */
const RawText = React.forwardRef<React.ElementRef<typeof RNText>, RNTextProps>(({ style, ...props }, ref) => (
  <RNText ref={ref} style={[{ fontFamily: bodyFontFor(StyleSheet.flatten(style)?.fontWeight) }, style]} {...props} />
));
RawText.displayName = 'RawText';

export { RawText, Text };
