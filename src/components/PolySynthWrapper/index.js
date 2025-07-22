import React from 'react';
import PolySynth from '../PolySynth';
import { ThemeProvider as CustomThemeProvider, useTheme } from '../../contexts/ThemeContext';
import { ThemeProvider } from 'styled-components';

const PolySynthWithTheme = () => {
    const { theme, setTheme, themes } = useTheme();
    return (
        <ThemeProvider theme={themes[theme]}>
            <PolySynth 
                currentTheme={theme}
                setTheme={setTheme}
            />
        </ThemeProvider>
    );
};

const PolySynthWrapper = () => {
    return (
        <CustomThemeProvider>
            <PolySynthWithTheme />
        </CustomThemeProvider>
    );
};

export default PolySynthWrapper;
