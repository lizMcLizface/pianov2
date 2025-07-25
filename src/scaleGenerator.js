import $ from 'jquery';
import {HeptatonicScales, scales, highlightKeysForScales, getScaleNotes} from './scales';
import {identifySyntheticChords} from './intervals';

// Global array to store selected scales
let selectedScales = ['Major-1']; // Default to first scale
let exclusiveMode = true; // Toggle between exclusive and multiple selection modes

// Global variable to store selected root notes (can be array or single string)
let selectedRootNote = 'C'; // Default to C

// Utility functions to manage selected scales
function getSelectedScales() {
    return selectedScales.slice(); // Return a copy of the array
}

function clearSelectedScales() {
    selectedScales = [];
    // Refresh the table to update visual state
    createHeptatonicScaleTable();
}

function addSelectedScale(scaleId) {
    if (!selectedScales.includes(scaleId)) {
        selectedScales.push(scaleId);
        // Refresh the table to update visual state
        createHeptatonicScaleTable();
    }
}

function removeSelectedScale(scaleId) {
    const index = selectedScales.indexOf(scaleId);
    if (index > -1) {
        selectedScales.splice(index, 1);
        // Refresh the table to update visual state
        createHeptatonicScaleTable();
    }
}

function toggleSelectionMode() {
    exclusiveMode = !exclusiveMode;
    
    // If switching to exclusive mode and multiple items are selected, keep only the first one
    if (exclusiveMode && selectedScales.length > 1) {
        selectedScales = [selectedScales[0]];
    }
    
    // Handle root note selection mode change
    if (exclusiveMode && Array.isArray(selectedRootNote)) {
        // Switch to exclusive mode - keep only the first selected root note
        selectedRootNote = selectedRootNote[0];
    }
    
    // console.log(`Selection mode: ${exclusiveMode ? 'Exclusive' : 'Multiple'}`);
    // Don't call createHeptatonicScaleTable here - let the event listener handle it
}

let placeholder = document.getElementById('placeholderContent');
while (placeholder.firstChild) {
    placeholder.removeChild(placeholder.firstChild);
}

function intToRoman(num){
    const romanNumerals = ["", "I", "II", "III", "IV", "V", "VI", "VII"];
    return romanNumerals[num] || "";
}

// Create a table for selecting root notes
function createRootNoteTable() {
    const chromaticNotes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    let rootTableContainer = document.createElement('div');
    rootTableContainer.style.marginBottom = '15px';
    
    let rootTableLabel = document.createElement('h3');
    rootTableLabel.textContent = 'Root Note Selection';
    rootTableLabel.style.margin = '0 0 8px 0';
    rootTableLabel.style.fontSize = '17px';
    rootTableLabel.style.fontWeight = 'bold';
    
    let rootTable = document.createElement('table');
    rootTable.style.borderCollapse = 'collapse';
    rootTable.style.margin = '0';
    
    let row = document.createElement('tr');
    
    // Add "All" cell at the beginning
    let allCell = document.createElement('td');
    allCell.style.border = '1px solid #ccc';
    allCell.style.padding = '6px 8px';
    allCell.style.textAlign = 'center';
    allCell.style.cursor = 'pointer';
    allCell.style.userSelect = 'none';
    allCell.style.fontWeight = 'bold';
    allCell.style.fontSize = '18px';
    allCell.style.minWidth = '32px';
    allCell.style.backgroundColor = '#353535ff';
    allCell.style.fontStyle = 'italic';
    
    allCell.textContent = 'All';
    
    // Check if all notes are selected
    let allNotesSelected = false;
    if (Array.isArray(selectedRootNote)) {
        allNotesSelected = (selectedRootNote.length === chromaticNotes.length);
    }
    
    if (allNotesSelected) {
        allCell.style.backgroundColor = '#2196F3';
        allCell.style.color = 'white';
    }
    
    // Add click event for "All" cell
    allCell.onclick = function() {
        // Remove any existing tooltips
        const existingTooltips = document.querySelectorAll('.scale-tooltip');
        existingTooltips.forEach(tooltip => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        });
        
        if (exclusiveMode) {
            // In exclusive mode, "All" doesn't make sense, so do nothing
            // Could alternatively select 'C' or show a message
            return;
        } else {
            // In multiple mode, toggle between all selected and just 'C'
            if (Array.isArray(selectedRootNote) && selectedRootNote.length === chromaticNotes.length) {
                // All are selected, reset to just 'C'
                selectedRootNote = 'C';
            } else {
                // Not all selected, select all
                selectedRootNote = [...chromaticNotes];
            }
        }
        
        // console.log('Selected root note(s):', selectedRootNote);
        // Refresh both tables to update visual state
        createHeptatonicScaleTable();
    };
    
    // Add hover effects and tooltips for "All" cell
    allCell.onmouseover = function() {
        if (!allNotesSelected) {
            allCell.style.backgroundColor = '#3a3a3aff';
        }
        
        // Add tooltip
        let tooltip = document.createElement('div');
        tooltip.className = 'scale-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.background = '#000';
        tooltip.style.color = 'white';
        tooltip.style.border = '1px solid #ccc';
        tooltip.style.padding = '4px 8px';
        tooltip.style.zIndex = 1000;
        tooltip.style.fontSize = '11px';
        
        let tooltipText = `<strong>All Root Notes</strong><br>`;
        if (exclusiveMode) {
            tooltipText += `<em>Not available in exclusive mode</em>`;
        } else {
            tooltipText += `<em>Click to ${allNotesSelected ? 'reset to C only' : 'select all notes'}</em>`;
        }
        tooltip.innerHTML = tooltipText;
        
        document.body.appendChild(tooltip);

        allCell.onmousemove = function(e) {
            tooltip.style.left = (e.pageX + 10) + 'px';
            tooltip.style.top = (e.pageY + 10) + 'px';
        };
    };
    
    allCell.onmouseleave = function() {
        if (!allNotesSelected) {
            allCell.style.backgroundColor = '#393939ff';
        }
        
        // Remove tooltip
        const existingTooltips = document.querySelectorAll('.scale-tooltip');
        existingTooltips.forEach(tooltip => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        });
        allCell.onmousemove = null;
    };
    
    row.appendChild(allCell);
    
    for (let note of chromaticNotes) {
        let cell = document.createElement('td');
        cell.style.border = '1px solid #ccc';
        cell.style.padding = '6px 8px';
        cell.style.textAlign = 'center';
        cell.style.cursor = 'pointer';
        cell.style.userSelect = 'none';
        cell.style.fontWeight = 'bold';
        cell.style.fontSize = '12px';
        cell.style.minWidth = '32px';
        
        cell.textContent = note;
        
        // Check if this note is currently selected
        let isSelected = false;
        if (exclusiveMode) {
            isSelected = (note === selectedRootNote);
        } else {
            // In multiple mode, selectedRootNote can be an array
            if (Array.isArray(selectedRootNote)) {
                isSelected = selectedRootNote.includes(note);
            } else {
                isSelected = (note === selectedRootNote);
            }
        }
        
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
            const existingTooltips = document.querySelectorAll('.scale-tooltip');
            existingTooltips.forEach(tooltip => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            });
            
            if (exclusiveMode) {
                // In exclusive mode, always select the clicked note
                selectedRootNote = note;
            } else {
                // In multiple mode, toggle selection
                if (Array.isArray(selectedRootNote)) {
                    // Already in array mode
                    const index = selectedRootNote.indexOf(note);
                    if (index > -1) {
                        // Note is selected, remove it
                        selectedRootNote.splice(index, 1);
                        // If array becomes empty, default to 'C'
                        if (selectedRootNote.length === 0) {
                            selectedRootNote = 'C';
                        }
                    } else {
                        // Note is not selected, add it
                        selectedRootNote.push(note);
                    }
                } else {
                    // Convert to array mode
                    if (selectedRootNote === note) {
                        // Clicking the same note - convert to array with just 'C'
                        selectedRootNote = 'C';
                    } else {
                        // Clicking a different note - convert to array with both
                        selectedRootNote = [selectedRootNote, note];
                    }
                }
            }
            
            // console.log('Selected root note(s):', selectedRootNote);
            // Refresh both tables to update visual state
            createHeptatonicScaleTable();
        };
        
        // Add hover effects and tooltips
        cell.onmouseover = function() {
            if (!isSelected) {
                cell.style.backgroundColor = '#6a8090ff';
            }
            
            // Add tooltip
            let tooltip = document.createElement('div');
            tooltip.className = 'scale-tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.background = '#000';
            tooltip.style.color = 'white';
            tooltip.style.border = '1px solid #ccc';
            tooltip.style.padding = '4px 8px';
            tooltip.style.zIndex = 1000;
            tooltip.style.fontSize = '11px';
            
            let tooltipText = `<strong>Root Note:</strong> ${note}<br>`;
            if (exclusiveMode) {
                tooltipText += `<em>Click to ${isSelected ? 'keep selected' : 'select'}</em>`;
            } else {
                tooltipText += `<em>Click to ${isSelected ? 'deselect' : 'select'}</em>`;
            }
            tooltip.innerHTML = tooltipText;

            let firstScaleId = selectedScales[0];
            let [family, mode] = firstScaleId.split('-');
    let scales = HeptatonicScales;
            // console.log('note: ', note, 'family: ', family, 'mode: ', mode);
            let intervals = scales[family][parseInt(mode, 10) - 1].intervals;
            let scaleNotes = getScaleNotes(note, intervals);

            // console.log("Scale Notes for", scaleName, ":", scaleNotes);
            highlightKeysForScales(scaleNotes);
            
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
            const existingTooltips = document.querySelectorAll('.scale-tooltip');
            existingTooltips.forEach(tooltip => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            });
    let scales = HeptatonicScales;
            let firstScaleId = selectedScales[0];
            let [family, mode] = firstScaleId.split('-');
            let intervals = scales[family][parseInt(mode, 10) - 1].intervals;
            let scaleNotes = getScaleNotes(selectedRootNote[0], intervals);
            // console.log("Scale Notes for", scaleName, ":", scaleNotes);
            highlightKeysForScales(scaleNotes);
            cell.onmousemove = null;
        };
        
        row.appendChild(cell);
    }
    
    rootTable.appendChild(row);
    rootTableContainer.appendChild(rootTableLabel);
    rootTableContainer.appendChild(rootTable);
    
    return rootTableContainer;
}

// Create a table for the 7 heptatonic base scales and their scale degrees
function createHeptatonicScaleTable() {
    // Clear all existing content
    while (placeholder.firstChild) {
        placeholder.removeChild(placeholder.firstChild);
    }

    // Create toggle switch container
    let toggleContainer = document.createElement('div');
    toggleContainer.style.marginBottom = '15px';
    toggleContainer.style.display = 'flex';
    toggleContainer.style.alignItems = 'center';
    toggleContainer.style.gap = '8px';
    
    // Create toggle switch
    let toggleSwitch = document.createElement('label');
    toggleSwitch.style.position = 'relative';
    toggleSwitch.style.display = 'inline-block';
    toggleSwitch.style.width = '50px';
    toggleSwitch.style.height = '28px';
    
    let toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.checked = exclusiveMode;
    toggleInput.style.opacity = '0';
    toggleInput.style.width = '0';
    toggleInput.style.height = '0';
    
    let slider = document.createElement('span');
    slider.style.position = 'absolute';
    slider.style.cursor = 'pointer';
    slider.style.top = '0';
    slider.style.left = '0';
    slider.style.right = '0';
    slider.style.bottom = '0';
    slider.style.backgroundColor = exclusiveMode ? '#4CAF50' : '#ccc';
    slider.style.transition = '0.4s';
    slider.style.borderRadius = '28px';
    
    let sliderButton = document.createElement('span');
    sliderButton.style.position = 'absolute';
    sliderButton.style.content = '';
    sliderButton.style.height = '22px';
    sliderButton.style.width = '22px';
    sliderButton.style.left = exclusiveMode ? '25px' : '3px';
    sliderButton.style.bottom = '3px';
    sliderButton.style.backgroundColor = 'white';
    sliderButton.style.transition = '0.4s';
    sliderButton.style.borderRadius = '50%';
    
    slider.appendChild(sliderButton);
    toggleSwitch.appendChild(toggleInput);
    toggleSwitch.appendChild(slider);
    
    // Add label text
    let toggleLabel = document.createElement('span');
    toggleLabel.textContent = exclusiveMode ? 'Exclusive Selection' : 'Multiple Selection';
    toggleLabel.style.fontWeight = 'bold';
    toggleLabel.style.fontSize = '14px';
    
    // Add clear button
    let clearButton = document.createElement('button');
    clearButton.textContent = 'Clear All';
    clearButton.style.padding = '6px 12px';
    clearButton.style.backgroundColor = '#f44336';
    clearButton.style.color = 'white';
    clearButton.style.border = 'none';
    clearButton.style.borderRadius = '3px';
    clearButton.style.cursor = 'pointer';
    clearButton.style.fontSize = '14px';
    clearButton.style.marginLeft = '8px';
    
    clearButton.onclick = function() {
        selectedScales = ['Major-1']; // Reset to default first scale
        selectedRootNote = 'C'; // Reset root note to C
        createHeptatonicScaleTable();
    };
    
    // Add event listener to toggle
    toggleInput.addEventListener('change', function() {
        toggleSelectionMode();
        createHeptatonicScaleTable();
    });
    
    toggleContainer.appendChild(toggleSwitch);
    toggleContainer.appendChild(toggleLabel);
    toggleContainer.appendChild(clearButton);
    placeholder.appendChild(toggleContainer);

    // Add root note selection table
    let rootNoteTable = createRootNoteTable();
    placeholder.appendChild(rootNoteTable);

    let scales = HeptatonicScales;

    let scaleNames = Object.keys(scales);
    // console.log('scaleNames:', scaleNames);

    // Calculate the maximum number of modes in any scale family
    let maxModes = 0;
    for (let scaleName of scaleNames) {
        maxModes = Math.max(maxModes, scales[scaleName].length);
    }
    const numColumns = maxModes + 1; // +1 for the scale name column

    let table = document.createElement('table');
    table.style.borderCollapse = 'collapse';
    table.style.margin = '15px 0';
    table.style.fontSize = '18px';

    // Dynamic number of rows: 1 header row + number of scale families
    for (let i = 0; i < scaleNames.length + 1; i++) {
        let row = document.createElement('tr');
        // Dynamic number of columns: 1 for scale name + max number of modes
        for (let j = 0; j < numColumns; j++) {
            let cell = document.createElement('td');
            cell.style.border = '1px solid #ccc';
            cell.style.padding = '4px 8px';
            cell.style.fontSize = '16px';
            if (j==0){
                cell.style.fontWeight = 'bold';
                cell.style.backgroundColor = '#474747ff';
                cell.textContent = i === 0 ? 'Scale' : `${scaleNames[i-1]}`;
                
                // Add click functionality to select/deselect entire row
                if (i > 0 && !exclusiveMode) { // Skip the header row and disable in exclusive mode
                    cell.style.cursor = 'pointer';
                    cell.style.userSelect = 'none';
                    
                    cell.onclick = function() {
                        // Remove any existing tooltips
                        const existingTooltips = document.querySelectorAll('.scale-tooltip');
                        existingTooltips.forEach(tooltip => {
                            if (tooltip.parentNode) {
                                tooltip.parentNode.removeChild(tooltip);
                            }
                        });
                        
                        const scaleName = scaleNames[i-1];
                        const rowScaleIds = [];
                        
                        // Generate all scale IDs for this row (dynamically based on number of modes)
                        const numModes = scales[scaleName].length;
                        for (let col = 1; col <= numModes; col++) {
                            rowScaleIds.push(`${scaleName}-${col}`);
                        }
                        
                        // Check if all scales in this row are selected
                        const allSelected = rowScaleIds.every(id => selectedScales.includes(id));
                        
                        if (allSelected) {
                            if (exclusiveMode) {
                                // In exclusive mode, prevent deselection - do nothing
                                // Keep current selection
                            } else {
                                // In multiple mode, only deselect if we have other selections
                                const otherSelections = selectedScales.filter(id => !rowScaleIds.includes(id));
                                if (otherSelections.length > 0) {
                                    // We have other selections, safe to deselect this row
                                    rowScaleIds.forEach(id => {
                                        const index = selectedScales.indexOf(id);
                                        if (index > -1) {
                                            selectedScales.splice(index, 1);
                                        }
                                    });
                                }
                                // If no other selections, do nothing (keep this row selected)
                            }
                        } else {
                            if (exclusiveMode) {
                                // In exclusive mode, clear all selections first, then select this row
                                selectedScales = [];
                                selectedScales.push(...rowScaleIds);
                            } else {
                                // In multiple mode, add all unselected scales in this row
                                rowScaleIds.forEach(id => {
                                    if (!selectedScales.includes(id)) {
                                        selectedScales.push(id);
                                    }
                                });
                            }
                        }
                        
                        // console.log('Selected scales:', selectedScales);
                        
                        // Refresh the table to update visual state
                        createHeptatonicScaleTable();
                    };
                    
                    // Add tooltip for row selection
                    cell.onmouseover = function() {
                        const scaleName = scaleNames[i-1];
                        const rowScaleIds = [];
                        
                        // Generate all scale IDs for this row (dynamically based on number of modes)
                        const numModes = scales[scaleName].length;
                        for (let col = 1; col <= numModes; col++) {
                            rowScaleIds.push(`${scaleName}-${col}`);
                        }
                        
                        const allSelected = rowScaleIds.every(id => selectedScales.includes(id));
                        
                        let tooltip = document.createElement('div');
                        tooltip.className = 'scale-tooltip';
                        tooltip.style.position = 'absolute';
                        tooltip.style.background = '#000';
                        tooltip.style.color = 'white';
                        tooltip.style.border = '1px solid #ccc';
                        tooltip.style.padding = '4px 8px';
                        tooltip.style.zIndex = 1000;
                        tooltip.style.fontSize = '11px';
                        tooltip.innerHTML = `
                            <strong>Scale Family:</strong> ${scaleName}<br>
                            <em>Click to ${allSelected ? 'deselect' : 'select'} entire row</em>
                        `;
                        document.body.appendChild(tooltip);

                        cell.onmousemove = function(e) {
                            tooltip.style.left = (e.pageX + 10) + 'px';
                            tooltip.style.top = (e.pageY + 10) + 'px';
                        };
                        cell.onmouseleave = function() {
                            document.body.removeChild(tooltip);
                            cell.onmousemove = null;
                            cell.onmouseleave = null;
                        };
                    };
                }
            }
            else if (i === 0 && j > 0) {
                cell.style.fontWeight = 'bold';
                cell.style.backgroundColor = '#474747ff';
                cell.textContent = j === 0 ? 'Degree' : `${intToRoman(j)}`;
            }
            else{
                let currentScale = scales[scaleNames[i-1]];
                
                // Check if this column index exists for this scale family
                if (j-1 < currentScale.length) {
                    let scaleName = currentScale[j-1]['name'];
                    let scaleId = `${scaleNames[i-1]}-${j}`;

                    cell.textContent = scaleName;
                    cell.style.cursor = 'pointer';
                    cell.style.userSelect = 'none';
                    
                    // Check if this scale is already selected
                    if (selectedScales.includes(scaleId)) {
                        cell.style.backgroundColor = '#4CAF50';
                        cell.style.color = 'white';
                    } else {
                        cell.style.backgroundColor = '';
                        cell.style.color = '';
                    }
                    
                    // Add click event to toggle selection
                    cell.onclick = function() {
                        // Remove any existing tooltips
                        const existingTooltips = document.querySelectorAll('.scale-tooltip');
                        existingTooltips.forEach(tooltip => {
                            if (tooltip.parentNode) {
                                tooltip.parentNode.removeChild(tooltip);
                            }
                        });
                        
                        const index = selectedScales.indexOf(scaleId);
                        
                        if (exclusiveMode) {
                            if (index > -1) {
                                // In exclusive mode, prevent deselection of current element - do nothing
                                // Already selected element stays selected
                            } else {
                                // Scale is not selected, clear all and select only this one
                                selectedScales = [scaleId];
                                // In exclusive mode, always refresh the entire table
                                createHeptatonicScaleTable();
                            }
                        } else {
                            // Multiple selection mode (original behavior)
                            if (index > -1) {
                                // Prevent deselection of last element in multiple mode
                                if (selectedScales.length > 1) {
                                    // Scale is selected, remove it (only if not the last one)
                                    selectedScales.splice(index, 1);
                                    cell.style.backgroundColor = '';
                                    cell.style.color = '';
                                }
                                // If it's the last element, do nothing (keep it selected)
                            } else {
                                // Scale is not selected, add it
                                selectedScales.push(scaleId);
                                cell.style.backgroundColor = '#4CAF50';
                                cell.style.color = 'white';
                            }
                            
                            // Update cross-reference display when scales change in multiple mode
                            if (typeof window.updateCrossReferenceDisplay === 'function') {
                                window.updateCrossReferenceDisplay();
                            }
                        }
                        
                        // console.log('Selected scales:', selectedScales);
                    };
                    
                    cell.onmouseover = function() {
                        const interval = currentScale[j-1]?.intervals || '';
                        const altNames = currentScale[j-1]?.alternativeNames || [];
                        let tooltip = document.createElement('div');
                        tooltip.className = 'scale-tooltip';
                        tooltip.style.position = 'absolute';
                        tooltip.style.background = '#000';
                        tooltip.style.color = 'white';
                        tooltip.style.border = '1px solid #ccc';
                        tooltip.style.padding = '4px 8px';
                        tooltip.style.zIndex = 1000;
                        tooltip.style.fontSize = '11px';
                        tooltip.innerHTML = `
                            <strong>Scale:</strong> ${scaleName}<br>
                            <strong>Interval:</strong> ${interval}<br>
                            <strong>Alternative Names:</strong> ${altNames.join(', ')}<br>
                            <em>Click to ${selectedScales.includes(scaleId) ? 'deselect' : 'select'}</em>
                        `;
                        let scaleNotes = getScaleNotes(selectedRootNote[0], currentScale[j-1].intervals);
                        // console.log("Scale Notes for", scaleName, ":", scaleNotes);
                        highlightKeysForScales(scaleNotes);
                        if (scales[scaleNames[i-1]][j-1].intervals.length === 7) {
                            let identifiedChords_3 = identifySyntheticChords(scales[scaleNames[i-1]][j-1], 3);
                            let identifiedChords_4 = identifySyntheticChords(scales[scaleNames[i-1]][j-1], 4);

                            // console.log('Identified Chords:', identifiedChords);
                            tooltip.innerHTML += `<br><em>Identified Chords:</em><br>`;
                            for (let k = 0; k < identifiedChords_3.length; k++) {
                                tooltip.innerHTML += `${intToRoman(k+1)}: Triad - ${identifiedChords_3[k].matches}, Seventh - ${identifiedChords_4[k].matches}<br>`;
                            }


                            // identifiedChords.forEach(chord => {
                            //     tooltip.innerHTML += `${chord.chord} - ${selectedRootNote[0]}${chord.matches}<br>`;
                            // });
                        }
                        
                        document.body.appendChild(tooltip);

                        cell.onmousemove = function(e) {
                            tooltip.style.left = (e.pageX + 10) + 'px';
                            tooltip.style.top = (e.pageY + 10) + 'px';
                        };
                        cell.onmouseleave = function() {
                            document.body.removeChild(tooltip);
                            cell.onmousemove = null;
                            cell.onmouseleave = null;
                            let firstScaleId = selectedScales[0];
                            let [family, mode] = firstScaleId.split('-');
                            let intervals = scales[family][parseInt(mode, 10) - 1].intervals;
                            let scaleNotes = getScaleNotes(selectedRootNote[0], intervals);
                            // console.log("Scale Notes for", scaleName, ":", scaleNotes);
                            highlightKeysForScales(scaleNotes);
                        };
                    };
                } else {
                    // Empty cell for scale families with fewer modes
                    cell.textContent = '';
                    cell.style.backgroundColor = '#f9f9f9';
                    cell.style.cursor = 'default';
                }
                
            }
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
    placeholder.appendChild(table);

    // Update cross-reference display when scales change
    if (typeof window.updateCrossReferenceDisplay === 'function') {
        window.updateCrossReferenceDisplay();
    }

    return;

}


export {
    createHeptatonicScaleTable, selectedRootNote, selectedScales
}