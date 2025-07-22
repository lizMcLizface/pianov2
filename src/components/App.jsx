import React, { useState } from 'react';
import { ThemeProvider } from 'styled-components';
import PolySynth from './PolySynth';
import { GlobalStyles } from '../styles/globalStyles';
import { THEMES } from '../styles/themes';

const getTheme = () => {
    const storedTheme = localStorage.getItem('PolySynth-Theme');
    if (!THEMES[storedTheme]) {
        localStorage.removeItem('PolySynth-Theme');
        return 'Dark';
    }
    return storedTheme;
};

const App = () => {
    const [theme, setTheme] = useState(getTheme());

    return (
        <ThemeProvider theme={THEMES[theme]}>
            <GlobalStyles />
            <PolySynth
                theme={THEMES[theme]}
                currentTheme={theme}
                setTheme={setTheme}
            />
        </ThemeProvider>
    );
};

export default App;
