import React from 'react';
import PolySynth from '../PolySynth';
import { ThemeProvider as CustomThemeProvider, useTheme } from '../../contexts/ThemeContext';
import { ThemeProvider } from 'styled-components';

const PolySynthWithTheme = React.forwardRef((props, ref) => {
    const { theme, setTheme, themes } = useTheme();
    return (
        <ThemeProvider theme={themes[theme]}>
            <PolySynth 
                currentTheme={theme}
                setTheme={setTheme}
                ref={ref}
            />
        </ThemeProvider>
    );
});

const PolySynthWrapper = React.forwardRef((props, ref) => {
    return (
        <CustomThemeProvider>
            <PolySynthWithTheme ref={ref} />
        </CustomThemeProvider>
    );
});

export default PolySynthWrapper;
