# Website-Wide Theming System

This document explains how the extended theming system works and how to use it throughout your website.

## Overview

The theming system has been extended from being PolySynth-specific to applying themes across your entire website. The same themes that were available in your PolySynth component are now available site-wide.

## What's Been Changed

### 1. Main App Integration
- **App.js**: Now wrapped with ThemeProvider and includes GlobalStyles
- **index.js**: The main App is now properly rendered with theming support
- **ThemeSelector**: A reusable component that can be placed anywhere on the site

### 2. Global Styling
- **GlobalStyles**: Extended to theme existing HTML elements like tabs, forms, and buttons
- **Theme Variables**: CSS custom properties are now available for use in regular CSS
- **Theme Synchronization**: Themes stay in sync between different parts of the app

### 3. New Components

#### ThemeSelector Component
```jsx
import ThemeSelector from './components/ThemeSelector';

// Basic usage
<ThemeSelector />

// Without label
<ThemeSelector showLabel={false} />

// With custom class
<ThemeSelector className="my-custom-class" />
```

#### ThemeInjector Component
Automatically applies themes to non-React elements on the page. It's already included in App.js.

## Using Themes in Your Code

### 1. In React Components (Styled Components)
```jsx
import styled from 'styled-components';

const MyComponent = styled.div`
  background-color: ${({ theme }) => theme.background};
  color: ${({ theme }) => theme.strong};
  border: 1px solid ${({ theme }) => theme.mid};
  
  &:hover {
    background-color: ${({ theme }) => theme.lite};
    border-color: ${({ theme }) => theme.pop};
  }
`;
```

### 2. In React Components (useTheme Hook)
```jsx
import { useTheme } from './contexts/ThemeContext';

function MyComponent() {
  const { theme, setTheme, themes } = useTheme();
  const currentTheme = themes[theme];
  
  return (
    <div style={{
      backgroundColor: currentTheme.background,
      color: currentTheme.strong,
      border: `1px solid ${currentTheme.mid}`
    }}>
      Content here
    </div>
  );
}
```

### 3. In Regular CSS
```css
/* Use CSS custom properties */
.my-element {
  background-color: var(--theme-background);
  color: var(--theme-strong);
  border: 1px solid var(--theme-mid);
}

.my-button {
  background-color: var(--theme-pop);
  color: var(--theme-background);
}

/* Or use utility classes */
.my-card {
  @apply theme-bg theme-text theme-border;
}
```

### 4. Utility Classes (Available globally)
- `.theme-bg` - Sets background to theme background color
- `.theme-bg-lite` - Sets background to theme lite color
- `.theme-text` - Sets text color to theme strong color
- `.theme-accent` - Sets color to theme pop color
- `.theme-border` - Sets border color to theme mid color
- `.theme-card` - Pre-styled card with theme colors
- `.theme-button` - Pre-styled button with theme colors
- `.theme-input` - Pre-styled input with theme colors

## Available Theme Properties

Each theme has these properties:
- `background` - Main background color
- `lite` - Light accent color (for subtle backgrounds)
- `mid` - Medium color (for borders, muted text)
- `strong` - Strong text color (main text)
- `pop` - Pop color (accent, highlights, buttons)

## Available Themes

All the themes from your PolySynth are available:
- Light, Braun, Gin, Demichrome, Metallic, Minty, USA, Desert
- Gameboy, Rusty, Raspberry, Cozy, Ronin, Alien, Laser, Blue
- Dark, Darker, ElecHead, M8, Terminal
- Mono variations: MonoLight, MonoBraun, MonoTiny, MonoJari, MonoGreen, MonoBlue, MonoDark, MonoDarker, MonoTinyInv

## Programmatic Theme Control

```javascript
// Get current theme
import { themeSync } from './util/themeSync';
console.log(themeSync.getCurrentTheme());

// Listen for theme changes
const unsubscribe = themeSync.addListener((newTheme) => {
  console.log('Theme changed to:', newTheme);
  // Update non-React elements here
});

// Clean up listener
unsubscribe();
```

## Theme Persistence

Themes are automatically saved to localStorage with the key `'PolySynth-Theme'` and will persist across browser sessions.

## Cross-Tab Synchronization

Theme changes are synchronized across browser tabs automatically using localStorage events.

## Adding Theme Support to Existing Elements

The ThemeInjector component automatically themes common elements, but you can also manually theme elements:

```javascript
// Apply theme to an element
function applyThemeToElement(element, theme) {
  element.style.backgroundColor = theme.background;
  element.style.color = theme.strong;
  element.style.borderColor = theme.mid;
}
```

## Best Practices

1. **Use the useTheme hook** in React components for dynamic theming
2. **Use CSS custom properties** for styling that needs to work outside React
3. **Use utility classes** for quick theming of elements
4. **Test with multiple themes** to ensure your UI works with light and dark themes
5. **Use theme.pop sparingly** for accents and highlights only

## Troubleshooting

If themes aren't applying:
1. Ensure your component is wrapped in a ThemeProvider
2. Check that GlobalStyles is included in your app
3. Verify CSS custom properties are being set (check browser dev tools)
4. Make sure you're not overriding theme styles with more specific CSS

The theme system now works across your entire website, giving you consistent theming from the PolySynth component to the main application and any other components you add!
