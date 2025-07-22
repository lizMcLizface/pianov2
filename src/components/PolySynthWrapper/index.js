import React from 'react';
import PolySynth from '../PolySynth';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

const PolySynthWithTheme = () => {
    const { theme, setTheme, themes } = useTheme();
    return (
        <PolySynth 
            theme={themes[theme]}
            currentTheme={theme}
            setTheme={setTheme}
        />
    );
};

const PolySynthWrapper = () => {
    return (
        <ThemeProvider>
            <PolySynthWithTheme />
        </ThemeProvider>
    );
};

export default PolySynthWrapper;
