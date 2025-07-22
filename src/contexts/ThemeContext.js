import React, { createContext, useContext, useState } from 'react';
import { THEMES } from '../styles/themes';

const ThemeContext = createContext();

const getTheme = () => {
    const storedTheme = localStorage.getItem('PolySynth-Theme');
    return 'Dark';
    
    if (!THEMES[storedTheme]) {
        localStorage.removeItem('PolySynth-Theme');
        return 'Dark';
    }
    return storedTheme;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(getTheme());

    const updateTheme = (newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('PolySynth-Theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme: updateTheme, themes: THEMES }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export default ThemeContext;
