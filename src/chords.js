import { processChord } from "./intervals"
import {noteToMidi} from './midi';

let chordSuffixesCommon = ['Major', 'Minor', '7', '5', 'dim', 'dim7', 'aug', 'sus2', 'sus4', 'maj7', 'm7', '7sus4', '7b9']
let chordSuffixesTriads = ['M', 'm', '+', 'o', 'b5', 'sus2', 'sus4']
let chordSuffixesSevenths = ['7', 'M7','mM7', 'm7', '+M7','+7','ø', 'o7', '7b5', 'm6', '6']
let chordSuffixesNines = ['M9', '9', '7b9', 'm9', 'mM9', '+M9', '+9', 'ø9', 'o9', 'ob9']
let chordSuffixesElevens = ['11', 'm11', 'M11', 'mM11', '+M11', '+11', 'ø11', 'o11']
let chordSuffixesThirteens = ['13', 'm13', 'M13', 'mM13', '+M13', '+13', 'ø13']

let chords = {
    'common': chordSuffixesCommon,
    'triads': chordSuffixesTriads,
    'sevenths': chordSuffixesSevenths,
    'nines': chordSuffixesNines,
    'elevens': chordSuffixesElevens,
    'thirteens': chordSuffixesThirteens
}

let processedChords = {};

for (let key in chords) {
    processedChords[key] = chords[key].map(suffix => {
        return {
            suffix: suffix,
            process: processChord('C' + suffix)
        };
    });
}

console.log("Processed Chords:", processedChords);



const getElementByNote = (note) =>
  note && document.querySelector(`[note="${note}_chord"]`);
const getElementByMIDI = (note) =>
  note && document.querySelector(`[midi="${note}_chord"]`);

const keys_chords = {
    60 : { element: getElementByMIDI("60"), note: "C",  octave: 4 },
    61 : { element: getElementByMIDI("61"), note: "C#", octave: 4 },
    62 : { element: getElementByMIDI("62"), note: "D",  octave: 4 },
    63 : { element: getElementByMIDI("63"), note: "D#", octave: 4 },
    64 : { element: getElementByMIDI("64"), note: "E",  octave: 4 },
    65 : { element: getElementByMIDI("65"), note: "F",  octave: 4 },
    66 : { element: getElementByMIDI("66"), note: "F#", octave: 4 },
    67 : { element: getElementByMIDI("67"), note: "G",  octave: 4 },
    68 : { element: getElementByMIDI("68"), note: "G#", octave: 4 },
    69 : { element: getElementByMIDI("69"), note: "A",  octave: 4 },
    70 : { element: getElementByMIDI("70"), note: "A#", octave: 4 },
    71 : { element: getElementByMIDI("71"), note: "B",  octave: 4 },
    72 : { element: getElementByMIDI("72"), note: "C",  octave: 5 },
    73 : { element: getElementByMIDI("73"), note: "C#", octave: 5 },
    74 : { element: getElementByMIDI("74"), note: "D",  octave: 5 },
    75 : { element: getElementByMIDI("75"), note: "D#", octave: 5 },
    76 : { element: getElementByMIDI("76"), note: "E",  octave: 5 },
    77 : { element: getElementByMIDI("77"), note: "F",  octave: 5 },
    78 : { element: getElementByMIDI("78"), note: "F#", octave: 5 },
    79 : { element: getElementByMIDI("79"), note: "G",  octave: 5 },
    80 : { element: getElementByMIDI("80"), note: "G#", octave: 5 },
    81 : { element: getElementByMIDI("81"), note: "A",  octave: 5 },
    82 : { element: getElementByMIDI("82"), note: "A#", octave: 5 },
    83 : { element: getElementByMIDI("83"), note: "B",  octave: 5 },
    84 : { element: getElementByMIDI("84"), note: "C",  octave: 6 },
};

function highlightKeysForChords(notes){
    for(var key in keys_chords) {
        if (keys_chords[key].element) {
            keys_chords[key].element.classList.remove('highlightedKey');
        }
    }
    console.log("Highlighting keys for notes:", notes);
    if (notes && notes.length > 0) {
        notes.forEach(note => {
            var n = noteToMidi(note) + 12;
            let key = keys_chords[n];
            console.log("Key for note:", note, "is", key, "MIDI:", n);
            if (key && key.element) {
                console.log("Highlighting key:", key.note, "Octave:", key.octave);
                key.element.classList.add('highlightedKey');
            }
        });
    }
}



let chordPlaceholder = document.getElementById('chordPlaceholderContent');

// Global variable to store selected root note for chords
let selectedChordRootNote = 'C'; // Default to C

// Create a table for selecting root notes for chords
function createChordRootNoteTable() {
    const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    let rootTableContainer = document.createElement('div');
    rootTableContainer.style.marginBottom = '20px';
    rootTableContainer.id = 'chordRootNoteTableContainer';
    
    let rootTableLabel = document.createElement('h3');
    rootTableLabel.textContent = 'Chord Root Note Selection';
    rootTableLabel.style.margin = '0 0 10px 0';
    rootTableLabel.style.fontSize = '16px';
    rootTableLabel.style.fontWeight = 'bold';
    
    let rootTable = document.createElement('table');
    rootTable.style.borderCollapse = 'collapse';
    rootTable.style.margin = '0';
    
    let row = document.createElement('tr');
    
    for (let note of chromaticNotes) {
        let cell = document.createElement('td');
        cell.style.border = '1px solid #ccc';
        cell.style.padding = '8px 12px';
        cell.style.textAlign = 'center';
        cell.style.cursor = 'pointer';
        cell.style.userSelect = 'none';
        cell.style.fontWeight = 'bold';
        cell.style.minWidth = '40px';
        
        cell.textContent = note;
        
        // Check if this note is currently selected
        let isSelected = (note === selectedChordRootNote);
        
        if (isSelected) {
            cell.style.backgroundColor = '#2196F3';
            cell.style.color = 'white';
        } else {
            cell.style.backgroundColor = '';
            cell.style.color = '';
        }
        
        // Add click event to select root note
        cell.onclick = function() {
            // Remove any existing tooltips
            const existingTooltips = document.querySelectorAll('.chord-root-tooltip');
            existingTooltips.forEach(tooltip => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            });
            
            // Select the clicked note (single selection only)
            selectedChordRootNote = note;
            
            console.log('Selected chord root note:', selectedChordRootNote);
            console.log('Current chord combinations:', selectedChordSuffixes.map(suffix => selectedChordRootNote + suffix));
            // Refresh both tables to update visual state
            createChordRootNoteTable();
            createChordSuffixTable();
        };
        
        // Add hover effects and tooltips
        cell.onmouseover = function() {
            if (!isSelected) {
                cell.style.backgroundColor = '#606d76ff';
            }
            
            // Add tooltip
            let tooltip = document.createElement('div');
            tooltip.className = 'chord-root-tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.background = '#000';
            tooltip.style.color = 'white';
            tooltip.style.border = '1px solid #ccc';
            tooltip.style.padding = '6px 12px';
            tooltip.style.zIndex = 1000;
            tooltip.style.fontSize = '12px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            
            let tooltipText = `<strong>Chord Root:</strong> ${note}<br>`;
            tooltipText += `<em>Click to ${isSelected ? 'keep selected' : 'select'}</em>`;
            tooltip.innerHTML = tooltipText;
            
            document.body.appendChild(tooltip);

            
            highlightKeysForChords(processChord(note + selectedChordSuffixes[0])['notes']);

            cell.onmousemove = function(e) {
                tooltip.style.left = (e.pageX + 10) + 'px';
                tooltip.style.top = (e.pageY + 10) + 'px';
            };
        };
        
        cell.onmouseleave = function() {
            if (!isSelected) {
                cell.style.backgroundColor = '';
            }
            
            // Remove tooltip
            const existingTooltips = document.querySelectorAll('.chord-root-tooltip');
            existingTooltips.forEach(tooltip => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            });
            
            highlightKeysForChords(processChord(selectedChordRootNote + selectedChordSuffixes[0])['notes']);
            cell.onmousemove = null;
        };
        
        row.appendChild(cell);
    }
    
    rootTable.appendChild(row);
    rootTableContainer.appendChild(rootTableLabel);
    rootTableContainer.appendChild(rootTable);
    
    // Replace existing root note table or add new one
    const existingContainer = document.getElementById('chordRootNoteTableContainer');
    if (existingContainer) {
        chordPlaceholder.replaceChild(rootTableContainer, existingContainer);
    } else {
        chordPlaceholder.appendChild(rootTableContainer);
    }
    
    // Update cross-reference display when chord root note changes
    if (typeof window.updateCrossReferenceDisplay === 'function') {
        window.updateCrossReferenceDisplay();
    }
}


// Global variable to store selected chord suffixes (multiple selection)
let selectedChordSuffixes = ['Major', 'Minor', '7', '5', 'dim', 'dim7', 'aug', 'sus2', 'sus4', 'maj7', 'm7', '7sus4', '7b9']; // Array to store multiple selections, default to Major

// Create a table for selecting chord suffixes
function createChordSuffixTable() {
    let chordTableContainer = document.createElement('div');
    chordTableContainer.style.marginTop = '20px';
    chordTableContainer.style.marginBottom = '20px';
    chordTableContainer.id = 'chordSuffixTableContainer';
    
    let chordTableLabel = document.createElement('h3');
    chordTableLabel.textContent = 'Chord Type Selection (Multiple Selection Enabled)';
    chordTableLabel.style.margin = '0 0 10px 0';
    chordTableLabel.style.fontSize = '16px';
    chordTableLabel.style.fontWeight = 'bold';
    
    let chordTable = document.createElement('table');
    chordTable.style.borderCollapse = 'collapse';
    chordTable.style.margin = '0';
    chordTable.style.width = '100%';
    
    // Create rows for each chord category
    const chordCategories = Object.keys(chords);
    
    for (let category of chordCategories) {
        let row = document.createElement('tr');
        
        // Create category label cell (clickable for row selection)
        let categoryCell = document.createElement('td');
        categoryCell.style.border = '1px solid #ccc';
        categoryCell.style.padding = '8px 12px';
        categoryCell.style.fontWeight = 'bold';
        categoryCell.style.backgroundColor = '#2a2a2aff';
        categoryCell.style.minWidth = '100px';
        categoryCell.style.verticalAlign = 'top';
        categoryCell.style.cursor = 'pointer';
        categoryCell.style.userSelect = 'none';
        categoryCell.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        
        // Check if all chords in this category are selected
        const categoryChords = chords[category];
        const allCategorySelected = categoryChords.every(suffix => selectedChordSuffixes.includes(suffix));
        const someCategorySelected = categoryChords.some(suffix => selectedChordSuffixes.includes(suffix));
        
        if (allCategorySelected) {
            categoryCell.style.backgroundColor = '#4CAF50';
            categoryCell.style.color = 'white';
        } else if (someCategorySelected) {
            categoryCell.style.backgroundColor = '#FFC107';
            categoryCell.style.color = 'black';
        }
        
        // Add click event to category cell for row selection
        categoryCell.onclick = function() {
            // Remove any existing tooltips
            const existingTooltips = document.querySelectorAll('.chord-suffix-tooltip');
            existingTooltips.forEach(tooltip => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            });
            
            if (allCategorySelected) {
                // All are selected, deselect all in this category
                // But only if this wouldn't leave us with no selections
                const otherSelections = selectedChordSuffixes.filter(suffix => !categoryChords.includes(suffix));
                if (otherSelections.length > 0) {
                    selectedChordSuffixes = otherSelections;
                }
                // If this would leave us with no selections, do nothing
            } else {
                // Not all are selected, select all in this category
                categoryChords.forEach(suffix => {
                    if (!selectedChordSuffixes.includes(suffix)) {
                        selectedChordSuffixes.push(suffix);
                    }
                });
            }
            
            console.log('Selected chord suffixes:', selectedChordSuffixes);
            console.log('Full chords would be:', selectedChordSuffixes.map(suffix => selectedChordRootNote + suffix));
            
            // Refresh the table to update visual state
            createChordSuffixTable();
        };
        
        // Add hover effects for category cell
        categoryCell.onmouseover = function() {
            if (!allCategorySelected) {
                if (someCategorySelected) {
                    categoryCell.style.backgroundColor = '#FFD54F';
                } else {
                    categoryCell.style.backgroundColor = '#e0e0e0';
                }
            }
            
            // Add tooltip
            let tooltip = document.createElement('div');
            tooltip.className = 'chord-suffix-tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.background = '#000';
            tooltip.style.color = 'white';
            tooltip.style.border = '1px solid #ccc';
            tooltip.style.padding = '6px 12px';
            tooltip.style.zIndex = 1000;
            tooltip.style.fontSize = '12px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            tooltip.style.maxWidth = '250px';
            
            let tooltipText = `<strong>Category:</strong> ${category}<br>`;
            if (allCategorySelected) {
                tooltipText += `<em>Click to deselect all in this category</em><br>`;
                tooltipText += `<small>(Only if other selections exist)</small>`;
            } else {
                tooltipText += `<em>Click to select all in this category</em>`;
            }
            tooltip.innerHTML = tooltipText;
            
            document.body.appendChild(tooltip);

            categoryCell.onmousemove = function(e) {
                tooltip.style.left = (e.pageX + 10) + 'px';
                tooltip.style.top = (e.pageY + 10) + 'px';
            };
        };
        
        categoryCell.onmouseleave = function() {
            if (allCategorySelected) {
                categoryCell.style.backgroundColor = '#4CAF50';
            } else if (someCategorySelected) {
                categoryCell.style.backgroundColor = '#FFC107';
            } else {
                categoryCell.style.backgroundColor = '#f5f5f5';
            }
            
            // Remove tooltip
            const existingTooltips = document.querySelectorAll('.chord-suffix-tooltip');
            existingTooltips.forEach(tooltip => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            });
            categoryCell.onmousemove = null;
        };
        
        row.appendChild(categoryCell);
        
        // Create cells for each chord suffix in this category
        for (let suffix of chords[category]) {
            let cell = document.createElement('td');
            cell.style.border = '1px solid #ccc';
            cell.style.padding = '8px 12px';
            cell.style.textAlign = 'center';
            cell.style.cursor = 'pointer';
            cell.style.userSelect = 'none';
            cell.style.minWidth = '60px';
            cell.style.fontFamily = 'monospace';
            
            cell.textContent = suffix;
            
            // Check if this chord suffix is currently selected
            let isSelected = selectedChordSuffixes.includes(suffix);
            
            if (isSelected) {
                cell.style.backgroundColor = '#4CAF50';
                cell.style.color = 'white';
                cell.style.fontWeight = 'bold';
            } else {
                cell.style.backgroundColor = '';
                cell.style.color = '';
                cell.style.fontWeight = '';
            }
            
            // Add click event to select chord suffix
            cell.onclick = function() {
                // Remove any existing tooltips
                const existingTooltips = document.querySelectorAll('.chord-suffix-tooltip');
                existingTooltips.forEach(tooltip => {
                    if (tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
                });
                
                // Toggle selection - if already selected, try to deselect
                if (isSelected) {
                    // Only deselect if this wouldn't leave us with no selections
                    if (selectedChordSuffixes.length > 1) {
                        const index = selectedChordSuffixes.indexOf(suffix);
                        selectedChordSuffixes.splice(index, 1);
                    }
                    // If this would leave us with no selections, do nothing
                } else {
                    // Add to selection
                    selectedChordSuffixes.push(suffix);
                }
                
                console.log('Selected chord suffixes:', selectedChordSuffixes);
                console.log('Full chords would be:', selectedChordSuffixes.map(suffix => selectedChordRootNote + suffix));
                
                // Refresh the table to update visual state
                createChordSuffixTable();
            };
            
            // Add hover effects and tooltips
            cell.onmouseover = function() {
                if (!isSelected) {
                    cell.style.backgroundColor = '#e8f5e8';
                }
                
                // Add tooltip
                let tooltip = document.createElement('div');
                tooltip.className = 'chord-suffix-tooltip';
                tooltip.style.position = 'absolute';
                tooltip.style.background = '#000';
                tooltip.style.color = 'white';
                tooltip.style.border = '1px solid #ccc';
                tooltip.style.padding = '6px 12px';
                tooltip.style.zIndex = 1000;
                tooltip.style.fontSize = '12px';
                tooltip.style.borderRadius = '4px';
                tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                tooltip.style.maxWidth = '200px';
                
                let fullChord = selectedChordRootNote + suffix;

                let processedChord = processChord(fullChord);

                let tooltipText = `<strong>Chord:</strong> ${fullChord}<br>`;
                tooltipText += `<strong>Suffix:</strong> ${suffix}<br>`;
                tooltipText += `<strong>Category:</strong> ${category}<br>`;
                tooltipText += `<strong>Chord Notes:</strong> ${processedChord['notes'].join(', ')}<br>`;
                if (isSelected) {
                    tooltipText += `<em>Click to deselect</em><br>`;
                    if (selectedChordSuffixes.length === 1) {
                        tooltipText += `<small>(Last selection - cannot deselect)</small>`;
                    }
                } else {
                    tooltipText += `<em>Click to select</em>`;
                }
                highlightKeysForChords(processedChord['notes']);
                tooltip.innerHTML = tooltipText;
                
                document.body.appendChild(tooltip);

                cell.onmousemove = function(e) {
                    tooltip.style.left = (e.pageX + 10) + 'px';
                    tooltip.style.top = (e.pageY + 10) + 'px';
                };
            };
            
            cell.onmouseleave = function() {
                if (!isSelected) {
                    cell.style.backgroundColor = '';
                }
                
                // Remove tooltip
                const existingTooltips = document.querySelectorAll('.chord-suffix-tooltip');
                existingTooltips.forEach(tooltip => {
                    if (tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
                });
                
                highlightKeysForChords(processChord(selectedChordRootNote + selectedChordSuffixes[0])['notes']);
                cell.onmousemove = null;
            };
            
            row.appendChild(cell);
        }
        
        chordTable.appendChild(row);
    }
    
    chordTableContainer.appendChild(chordTableLabel);
    chordTableContainer.appendChild(chordTable);
    
    // Replace existing chord suffix table or add new one
    const existingContainer = document.getElementById('chordSuffixTableContainer');
    if (existingContainer) {
        chordPlaceholder.replaceChild(chordTableContainer, existingContainer);
    } else {
        chordPlaceholder.appendChild(chordTableContainer);
    }
    
    // Update cross-reference display when chords change
    if (typeof window.updateCrossReferenceDisplay === 'function') {
        window.updateCrossReferenceDisplay();
    }
}

export {chords, processedChords, highlightKeysForChords, 
    createChordRootNoteTable, createChordSuffixTable, selectedChordRootNote, selectedChordSuffixes,
    getElementByNote, getElementByMIDI, keys_chords
};