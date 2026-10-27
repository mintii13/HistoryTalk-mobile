import { tva } from '@gluestack-ui/nativewind-utils/tva';
import React from 'react';
import { StyleSheet, Text, type TextProps } from 'react-native';

import { AppFonts } from '@/constants/theme';

const headingStyle = tva({
  base: 'font-bold tracking-tight',
  variants: {
    tone: {
      ink: 'text-history-text',
    },
    size: {
      xs:   'text-xs leading-4',
      sm:   'text-sm leading-5',
      md:   'text-base leading-6',
      lg:   'text-lg leading-7',
      xl:   'text-xl leading-8',
      '2xl': 'text-2xl leading-9',
      '3xl': 'text-3xl leading-10',
      '4xl': 'text-[32px] leading-10',
      '5xl': 'text-5xl',
    },
  },
  defaultVariants: { size: 'lg' },
});

type HeadingSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

type HeadingProps = TextProps & {
  className?: string;
  size?: HeadingSize;
};

const Heading = React.forwardRef<React.ElementRef<typeof Text>, HeadingProps>(
  ({ className, size = 'lg', style, ...props }, ref) => {
    const flat = StyleSheet.flatten(style) ?? {};
    return (
      <Text
        ref={ref}
        // Nhu <Text>: class mac dinh chi khi style khong tu dat co chu / mau (tren web class de len style).
        className={headingStyle({
          size: flat.fontSize == null ? size : undefined,
          tone: flat.color == null ? 'ink' : undefined,
          class: className,
        })}
        style={[{ fontFamily: AppFonts.titleExtraBold }, style]}
        {...props}
      />
    );
  }
);
Heading.displayName = 'Heading';

export { Heading };
