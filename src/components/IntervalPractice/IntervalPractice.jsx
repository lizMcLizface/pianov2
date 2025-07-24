import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Knob from '../Knob';
import KnobGrid from '../KnobGrid';
import Module from '../Module';
import Select from '../Select';

import {
    IntervalGridContainer,
    IntervalCell,
    IntervalHeaderCell,
    IntervalGuessButton,
    IntervalControlsContainer,
    IntervalMainContent,
    IntervalContainer,
    IntervalTitle,
    IntervalInstructions,
    GuessSection,
    GuessButtonsContainer,
    GuessActionsContainer,
    SelectedDisplay,
    GuessDisplay,
    ActionButton
} from './IntervalPractice.styled';

const BASE_CLASS_NAME = 'IntervalPractice';

// Practice state
let currentPracticeInterval = null;
let practiceTriesRemaining = 0;
let practiceRelistensRemaining = 0;
let practiceStats = { correct: 0, total: 0 };

const IntervalPractice = ({ className }) => {
    // Define chromatic scale notes and intervals for the 12x12 grid
    const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const intervals = ['P1', 'm2', 'M2', 'm3', 'M3', 'P4', 'A4/d5', 'P5', 'm6', 'M6', 'm7', 'M7'];

    // State for practice configuration
    const [practiceSettings, setPracticeSettings] = useState({
        tries: 3,
        relistens: 2,
        infiniteRelistens: false
    });

    // State for selected intervals
    const [selectedIntervals, setSelectedIntervals] = useState(new Set());
    
    // State for guess buttons
    const [guessStates, setGuessStates] = useState(
        chromaticNotes.reduce((acc, note) => ({ ...acc, [note]: 0 }), {})
    );

    // State for practice status
    const [practiceStatus, setPracticeStatus] = useState({
        current: null,
        tries: 0,
        relistens: 0,
        stats: { correct: 0, total: 0 }
    });

    // Toggle interval cell selection
    const toggleIntervalCell = (note, interval) => {
        const key = `${note}-${interval}`;
        const newSelected = new Set(selectedIntervals);
        
        if (newSelected.has(key)) {
            newSelected.delete(key);
        } else {
            newSelected.add(key);
        }
        
        setSelectedIntervals(newSelected);
    };

    // Toggle entire row
    const toggleRow = (rowIndex) => {
        const note = chromaticNotes[rowIndex];
        const rowCells = intervals.map(interval => `${note}-${interval}`);
        const allSelected = rowCells.every(key => selectedIntervals.has(key));
        
        const newSelected = new Set(selectedIntervals);
        
        if (allSelected) {
            // Deselect all in row
            rowCells.forEach(key => newSelected.delete(key));
        } else {
            // Select all unselected in row
            rowCells.forEach(key => {
                if (!selectedIntervals.has(key)) {
                    newSelected.add(key);
                }
            });
        }
        
        setSelectedIntervals(newSelected);
    };

    // Toggle entire column
    const toggleColumn = (colIndex) => {
        const interval = intervals[colIndex];
        const columnCells = chromaticNotes.map(note => `${note}-${interval}`);
        const allSelected = columnCells.every(key => selectedIntervals.has(key));
        
        const newSelected = new Set(selectedIntervals);
        
        if (allSelected) {
            // Deselect all in column
            columnCells.forEach(key => newSelected.delete(key));
        } else {
            // Select all unselected in column
            columnCells.forEach(key => {
                if (!selectedIntervals.has(key)) {
                    newSelected.add(key);
                }
            });
        }
        
        setSelectedIntervals(newSelected);
    };

    // Cycle guess button state
    const cycleGuessButtonState = (note) => {
        setGuessStates(prev => ({
            ...prev,
            [note]: (prev[note] + 1) % 3
        }));
    };

    // Clear all guess selections
    const clearGuess = () => {
        setGuessStates(chromaticNotes.reduce((acc, note) => ({ ...acc, [note]: 0 }), {}));
    };

    // Select/Clear all intervals
    const selectAllIntervals = () => {
        const allKeys = chromaticNotes.flatMap(note => 
            intervals.map(interval => `${note}-${interval}`)
        );
        setSelectedIntervals(new Set(allKeys));
    };

    const clearAllIntervals = () => {
        setSelectedIntervals(new Set());
    };

    // Play random interval
    const playRandomInterval = () => {
        if (selectedIntervals.size === 0) {
            alert('Please select some intervals first!');
            return;
        }

        const selectedArray = Array.from(selectedIntervals);
        const randomKey = selectedArray[Math.floor(Math.random() * selectedArray.length)];
        const [rootNote, interval] = randomKey.split('-');

        // Initialize practice session
        currentPracticeInterval = { rootNote, interval };
        practiceTriesRemaining = practiceSettings.tries;
        practiceRelistensRemaining = practiceSettings.infiniteRelistens ? Infinity : practiceSettings.relistens;

        setPracticeStatus({
            current: currentPracticeInterval,
            tries: practiceTriesRemaining,
            relistens: practiceRelistensRemaining,
            stats: practiceStats
        });

        console.log(`Playing interval: ${rootNote} + ${interval}`);
        alert(`Playing: ${rootNote} + ${interval}`);
    };

    // Replay current interval
    const replayCurrentInterval = () => {
        if (!currentPracticeInterval) {
            alert('No interval is currently being practiced. Click "Play Random Interval" first!');
            return;
        }

        if (practiceRelistensRemaining <= 0) {
            alert('No relistens remaining for this interval!');
            return;
        }

        if (practiceRelistensRemaining !== Infinity) {
            practiceRelistensRemaining--;
            setPracticeStatus(prev => ({
                ...prev,
                relistens: practiceRelistensRemaining
            }));
        }

        const { rootNote, interval } = currentPracticeInterval;
        console.log(`Replaying interval: ${rootNote} + ${interval}`);
        alert(`Replaying: ${rootNote} + ${interval}`);
    };

    // Skip to next interval
    const skipToNextInterval = () => {
        if (!currentPracticeInterval) {
            alert('No interval is currently being practiced. Click "Play Random Interval" first!');
            return;
        }

        practiceStats.total++;
        playRandomInterval();
    };

    // Submit guess
    const submitGuess = () => {
        if (!currentPracticeInterval) {
            alert('No interval is currently being practiced!');
            return;
        }

        if (practiceTriesRemaining <= 0) {
            alert('No tries remaining for this interval!');
            return;
        }

        // Get the current guess
        const guessedNotes = [];
        Object.entries(guessStates).forEach(([note, state]) => {
            for (let i = 0; i < state; i++) {
                guessedNotes.push(note);
            }
        });

        if (guessedNotes.length === 0) {
            alert('Please select at least one note for your guess!');
            return;
        }

        // Calculate correct answer (simplified)
        const { rootNote, interval } = currentPracticeInterval;
        const correctAnswer = calculateIntervalNotes(rootNote, interval);
        const isCorrect = arraysEqual(guessedNotes.sort(), correctAnswer.sort());

        practiceTriesRemaining--;

        if (isCorrect) {
            practiceStats.correct++;
            practiceStats.total++;
            alert(`Correct! The interval was ${rootNote} + ${interval}`);
            clearGuess();
            setTimeout(() => playRandomInterval(), 1000);
        } else {
            if (practiceTriesRemaining > 0) {
                alert(`Incorrect. Tries remaining: ${practiceTriesRemaining}`);
                clearGuess();
            } else {
                practiceStats.total++;
                alert(`Game over! The correct answer was: ${correctAnswer.join(', ')}`);
                clearGuess();
                setTimeout(() => playRandomInterval(), 1000);
            }
        }

        setPracticeStatus({
            current: currentPracticeInterval,
            tries: practiceTriesRemaining,
            relistens: practiceRelistensRemaining,
            stats: practiceStats
        });
    };

    // Helper functions
    const calculateIntervalNotes = (rootNote, interval) => {
        const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const rootIndex = chromaticNotes.indexOf(rootNote);
        
        const intervalSemitones = {
            'P1': 0, 'm2': 1, 'M2': 2, 'm3': 3, 'M3': 4, 'P4': 5,
            'A4/d5': 6, 'P5': 7, 'm6': 8, 'M6': 9, 'm7': 10, 'M7': 11
        };
        
        const semitones = intervalSemitones[interval];
        if (semitones === undefined) return [rootNote];
        
        const targetIndex = (rootIndex + semitones) % 12;
        const targetNote = chromaticNotes[targetIndex];
        
        if (interval === 'P1') {
            return [rootNote, rootNote];
        }
        
        return [rootNote, targetNote];
    };

    const arraysEqual = (arr1, arr2) => {
        if (arr1.length !== arr2.length) return false;
        return arr1.every((val, index) => val === arr2[index]);
    };

    // Get current guess display
    const getCurrentGuess = () => {
        const selectedNotes = [];
        Object.entries(guessStates).forEach(([note, state]) => {
            if (state === 1) {
                selectedNotes.push(note);
            } else if (state === 2) {
                selectedNotes.push(note + ' (×2)');
            }
        });
        
        return selectedNotes.length === 0 ? 'No notes selected' : selectedNotes.join(', ');
    };

    return (
        <IntervalContainer className={`${BASE_CLASS_NAME} ${className}`.trim()}>
            <IntervalTitle>Interval Listening Practice</IntervalTitle>
            <IntervalInstructions>
                Select root notes (rows) and intervals (columns) to practice. Click a cell to toggle it on/off.
            </IntervalInstructions>

            <IntervalMainContent>
                {/* Interval Selection Grid */}
                <Module label="Interval Selection">
                    <IntervalGridContainer>
                        {/* Corner cell */}
                        <IntervalHeaderCell />
                        
                        {/* Column headers */}
                        {intervals.map((interval, colIndex) => (
                            <IntervalHeaderCell 
                                key={interval} 
                                clickable
                                onClick={() => toggleColumn(colIndex)}
                            >
                                {interval}
                            </IntervalHeaderCell>
                        ))}
                        
                        {/* Rows */}
                        {chromaticNotes.map((note, rowIndex) => (
                            <React.Fragment key={note}>
                                {/* Row header */}
                                <IntervalHeaderCell 
                                    clickable
                                    onClick={() => toggleRow(rowIndex)}
                                >
                                    {note}
                                </IntervalHeaderCell>
                                
                                {/* Interval cells */}
                                {intervals.map((interval, colIndex) => {
                                    const key = `${note}-${interval}`;
                                    const isSelected = selectedIntervals.has(key);
                                    
                                    return (
                                        <IntervalCell
                                            key={key}
                                            selected={isSelected}
                                            onClick={() => toggleIntervalCell(note, interval)}
                                        >
                                        </IntervalCell>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </IntervalGridContainer>
                </Module>

                {/* Practice Configuration */}
                <Module label="Practice Settings">
                    <KnobGrid columns={1} rows={3}>
                        <Knob
                            label="Tries"
                            value={practiceSettings.tries}
                            modifier={11}
                            offset={1}
                            resetValue={3}
                            isRounded
                            onUpdate={(val) => setPracticeSettings(prev => ({ ...prev, tries: val }))}
                        />
                        <Knob
                            label="Relistens"
                            value={practiceSettings.relistens}
                            modifier={6}
                            offset={0}
                            resetValue={2}
                            isRounded
                            disabled={practiceSettings.infiniteRelistens}
                            onUpdate={(val) => setPracticeSettings(prev => ({ ...prev, relistens: val }))}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Infinite</label>
                            <input
                                type="checkbox"
                                checked={practiceSettings.infiniteRelistens}
                                onChange={(e) => setPracticeSettings(prev => ({ 
                                    ...prev, 
                                    infiniteRelistens: e.target.checked 
                                }))}
                                style={{ width: '16px', height: '16px' }}
                            />
                        </div>
                    </KnobGrid>
                </Module>
            </IntervalMainContent>

            {/* Control Buttons */}
            <IntervalControlsContainer>
                <ActionButton onClick={selectAllIntervals}>Select All</ActionButton>
                <ActionButton onClick={clearAllIntervals}>Clear All</ActionButton>
                <ActionButton primary onClick={playRandomInterval}>Play Random Interval</ActionButton>
                <ActionButton onClick={replayCurrentInterval}>🔊 Replay</ActionButton>
                <ActionButton onClick={skipToNextInterval}>⏭️ Skip</ActionButton>
            </IntervalControlsContainer>

            {/* Guess Section */}
            <GuessSection>
                <Module label="Make Your Guess">
                    <div style={{ textAlign: 'center', marginBottom: '15px', fontSize: '12px', color: '#666' }}>
                        Click notes you hear. Colors cycle: Gray (off) → Green (1x) → Blue (2x) → Gray (off)
                    </div>
                    
                    <GuessButtonsContainer>
                        {chromaticNotes.map(note => (
                            <IntervalGuessButton
                                key={note}
                                state={guessStates[note]}
                                onClick={() => cycleGuessButtonState(note)}
                            >
                                {note}
                            </IntervalGuessButton>
                        ))}
                    </GuessButtonsContainer>
                    
                    <GuessActionsContainer>
                        <ActionButton primary onClick={submitGuess}>✓ Submit Guess</ActionButton>
                        <ActionButton onClick={clearGuess}>✗ Clear Guess</ActionButton>
                    </GuessActionsContainer>
                    
                    <GuessDisplay>
                        <strong>Your guess:</strong> {getCurrentGuess()}
                    </GuessDisplay>
                </Module>
            </GuessSection>

            {/* Status Displays */}
            <SelectedDisplay>
                <strong>Selected Intervals ({selectedIntervals.size}):</strong><br />
                {selectedIntervals.size === 0 
                    ? 'No intervals selected' 
                    : Array.from(selectedIntervals).map(key => key.replace('-', ' + ')).join(', ')
                }
            </SelectedDisplay>

            {practiceStatus.current && (
                <div style={{ 
                    marginTop: '15px', 
                    padding: '10px', 
                    backgroundColor: '#e3f2fd', 
                    borderRadius: '4px',
                    textAlign: 'center'
                }}>
                    <strong>Current:</strong> {practiceStatus.current.rootNote} + {practiceStatus.current.interval}<br />
                    <strong>Tries left:</strong> {practiceStatus.tries} | 
                    <strong>Relistens:</strong> {practiceStatus.relistens === Infinity ? '∞' : practiceStatus.relistens}<br />
                    <strong>Score:</strong> {practiceStatus.stats.correct}/{practiceStatus.stats.total}
                </div>
            )}
        </IntervalContainer>
    );
};

IntervalPractice.propTypes = {
    className: PropTypes.string,
        currentTheme: PropTypes.string.isRequired,
        setTheme: PropTypes.func.isRequired,
};

IntervalPractice.defaultProps = {
    className: '',
};

export default IntervalPractice;
