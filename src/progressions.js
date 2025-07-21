import $ from 'jquery';
import { selectedRootNote, selectedScales } from './scaleGenerator';
import { identifySyntheticChords } from './intervals';
import { HeptatonicScales } from './scales';
import {outputNoteArray, drawNotes, outputDiv} from './index'

// Import VexFlow components for staff display
const { Vex, Formatter, Renderer, Stave, Accidental, StaveNote, BarNote, Beam, Dot, StaveConnector, Voice, GhostNote } = require("vexflow");
const { Factory } = Vex.Flow;

let chord_csv = `Name , Style, Length, Chord Progression
50s progression, Major, 4, I vi IV V
IV V I vi, Major, 4, IV V I vi
I V vi IV, Major, 4, I V vi IV
I IV bVII IV, Mixed, 4, I IV bVII IV
ii V I, Major, 3, ii V I
ii bII7 I, Major, 3, ii bII7 I
ii bIII+ I, Mixed, 3, ii bIII+ I
Pachelbels Progression, Major, 5, I V vi iii IV
Effective, Unknown, 4, vi V IV V
I IV vi V, Major, 4, I IV vi V
I V IV V, Major, 4, I V IV V
The Cadential, Unknown, 5, IV ii I6_4 V I
Stepwise Down, Unknown, 4, I V6 vi V
Stepwise Up, Unknown, 4, I ii7 I6 IV
Newcomer, Major, 4, I iii6_4 vi IV
I6 Precadence, Major, 3, IV I6 V
Simple, Major, 3, IV I6 ii
Applied Vii0, Unknown, 3, V viio/vi vi
Mixolydian Cadence, Mix, 4, I bVII IV I
Cadencing via bVII, Mix, 5, I V IV bVII I
vii07/V V I, Major, 3, vii07/V V I
Andalusian, PD, 4, iv III bII I
Backdoor, Major, 3, ii bVII7 I
Bird Changes, Major, 20, I viiø–III7 vi–II7 v–I7, IV7 iv–♭VII7 iii–VI7 ♭iii–♭VI7, ii V7 I–VI7 ii–V
Chromatic 5-6, Mix, 4, I V bVII IV
Circle, Major, 4, vi ii V I
Coltrane Changes, Major, 6, I-V/bVI bVI-V/III III-V I
Eight Bar Blues, Major, 8, I V IV IV I V I V
Folia, Minor, 17, i V i bVII bIII bVII i V i V i bVII bIII bVII i V i
Irregular, Major, 2, V7 III7
Montgomery-Ward, Major, 4, I IV ii V
Pachelbels Canon, Major, 8, I V vi iii IV I IV V
Passamezzo antico, Minor, 8, i VII i V  III VII i V i
I V vi IV, Major, 4, i V vi IV
Ragtime, Major, 4, III7 VI7 ii7 V7
Rhythm changes, Major, 12, I iv ii V/I I7 iv I V I/III7 VI7 II7 V7
Romanesca, Major, 9, III VII i V III VII i V i
Sixteen Bar Blues, Major, 16, I I I I I I I I IV IV I I V IV I I
Stomp, Major, 15, IV7 #ivdim7 I7 I7 IV7 #ivdim7 I7 I7 IV7 #ivdim7 I7 V7/V/V V7/V V7 I7
Twelve Bar Blues, Major, 12, I I I I IV IV I I V IV I V
I vi ii V, Major, 4, I vi ii V
bVII V7 cadence, Mix, 3, bVII V7 I
V IV I turnaround, Major, 3, V IV I
I bVII bVI bVII, Minor, 4, I bVII bVI bVII
IVD7 V7 iii7 vi, Major, 4, IVD7 V7 iii7 vi
bVI bVII I, Major, 3, bVI bVII I
`

let chord_progressions = {};
chord_csv.split('\n').forEach(line => {
    if (line.trim() === '' || line.startsWith('Name')) return; // Skip empty lines and header
    const [name, style, length, progression] = line.split(',').map(item => item.trim());
    chord_progressions[name] = {
        style: style,
        length: parseInt(length, 10),
        progression: progression
    };
});

console.log(chord_progressions);

let placeholder = document.getElementById('ProgressionTabPlaceholder');

// Global variable to store selected chord progressions (multiple selection)
let selectedProgressions = ['50s progression']; // Default to first progression

// Global variables for progression realization options
let progressionOptions = {
    voicing: 'natural',           // 'natural', 'first_inversion', 'leading'
    splitChord: true,            // true/false
    lowerOctave: 4,              // 1-7
    upperOctave: 5,              // 1-7
    root: 'both',                // 'lower', 'upper', 'both'
    third: 'both',               // 'lower', 'upper', 'both'
    fifth: 'both',               // 'lower', 'upper', 'both'
    seventh: 'both',             // 'lower', 'upper', 'both'
    playStyle: 'block',          // 'block', 'arpeggiated', 'broken'
    timing: 'even',              // 'even', 'swing', 'rubato'
    velocity: 'medium',          // 'soft', 'medium', 'loud', 'dynamic'
    sustain: true,               // true/false - use sustain pedal
    bassLine: 'root',            // 'root', 'walking', 'pedal', 'none'
    rhythm: 'whole',             // 'whole', 'half', 'quarter', 'eighth'
};

// Create a table for selecting chord progressions
function createProgressionTable() {
    // Only clear and recreate the table container, not the entire placeholder
    const existingTable = document.getElementById('progressionTableContainer');
    if (existingTable) {
        placeholder.removeChild(existingTable);
    }
    
    let progressionTableContainer = document.createElement('div');
    progressionTableContainer.style.marginBottom = '20px';
    progressionTableContainer.id = 'progressionTableContainer';
    
    let progressionTableLabel = document.createElement('h3');
    progressionTableLabel.textContent = 'Chord Progression Selection (Multiple Selection Enabled)';
    progressionTableLabel.style.margin = '0 0 10px 0';
    progressionTableLabel.style.fontSize = '16px';
    progressionTableLabel.style.fontWeight = 'bold';
    
    let progressionTable = document.createElement('table');
    progressionTable.style.borderCollapse = 'collapse';
    progressionTable.style.margin = '0';
    progressionTable.style.width = '100%';
    
    // Get all progression names
    const progressionNames = Object.keys(chord_progressions);
    
    // Create rows with at most 8 entries per row
    const maxPerRow = 8;
    let currentRow = null;
    let cellsInCurrentRow = 0;
    
    for (let i = 0; i < progressionNames.length; i++) {
        const progressionName = progressionNames[i];
        const progressionData = chord_progressions[progressionName];
        
        // Create a new row if needed
        if (cellsInCurrentRow === 0 || cellsInCurrentRow >= maxPerRow) {
            currentRow = document.createElement('tr');
            progressionTable.appendChild(currentRow);
            cellsInCurrentRow = 0;
        }
        
        let cell = document.createElement('td');
        cell.style.border = '1px solid #ccc';
        cell.style.padding = '8px 12px';
        cell.style.textAlign = 'center';
        cell.style.cursor = 'pointer';
        cell.style.userSelect = 'none';
        cell.style.fontWeight = 'bold';
        cell.style.minWidth = '120px';
        cell.style.fontSize = '12px';
        cell.style.verticalAlign = 'middle';
        
        cell.textContent = progressionName;
        
        // Check if this progression is currently selected
        let isSelected = selectedProgressions.includes(progressionName);
        
        if (isSelected) {
            cell.style.backgroundColor = '#4CAF50';
            cell.style.color = 'white';
        } else {
            cell.style.backgroundColor = '';
            cell.style.color = '';
        }
        
        // Add click event to select progression
        cell.onclick = function(e) {
            // Remove any existing tooltips
            const existingTooltips = document.querySelectorAll('.progression-tooltip');
            existingTooltips.forEach(tooltip => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            });
            
            // Check if Ctrl key is pressed
            if (e.ctrlKey || e.metaKey) { // metaKey for Mac Cmd key
                // Ctrl+Click: Clear all selections and select only this one
                selectedProgressions = [progressionName];
            } else {
                // Normal click: Toggle selection
                if (isSelected) {
                    // Only deselect if this wouldn't leave us with no selections
                    if (selectedProgressions.length > 1) {
                        const index = selectedProgressions.indexOf(progressionName);
                        selectedProgressions.splice(index, 1);
                    }
                    // If this would leave us with no selections, do nothing
                } else {
                    // Add to selection
                    selectedProgressions.push(progressionName);
                }
            }
            
            console.log('Selected chord progressions:', selectedProgressions);
            console.log('Progression details:', selectedProgressions.map(name => chord_progressions[name]));
            
            // Refresh the table to update visual state
            createProgressionTable();
            
            // Update staff display when progressions change
            drawProgressionStaff();
        };
        
        // Add hover effects and tooltips
        cell.onmouseover = function() {
            if (!isSelected) {
                cell.style.backgroundColor = '#e8f5e8';
            }
            
            // Add tooltip
            let tooltip = document.createElement('div');
            tooltip.className = 'progression-tooltip';
            tooltip.style.position = 'absolute';
            tooltip.style.background = '#000';
            tooltip.style.color = 'white';
            tooltip.style.border = '1px solid #ccc';
            tooltip.style.padding = '6px 12px';
            tooltip.style.zIndex = 1000;
            tooltip.style.fontSize = '12px';
            tooltip.style.borderRadius = '4px';
            tooltip.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            tooltip.style.maxWidth = '300px';
            
            let tooltipText = `<strong>Progression:</strong> ${progressionName}<br>`;
            tooltipText += `<strong>Style:</strong> ${progressionData.style}<br>`;
            tooltipText += `<strong>Length:</strong> ${progressionData.length} chords<br>`;
            tooltipText += `<strong>Chords:</strong> ${progressionData.progression}<br>`;
            if (isSelected) {
                tooltipText += `<em>Click to deselect</em><br>`;
                if (selectedProgressions.length === 1) {
                    tooltipText += `<small>(Last selection - cannot deselect)</small><br>`;
                }
                tooltipText += `<small>Ctrl+Click to select only this</small>`;
            } else {
                tooltipText += `<em>Click to select</em><br>`;
                tooltipText += `<small>Ctrl+Click to select only this</small>`;
            }
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
            const existingTooltips = document.querySelectorAll('.progression-tooltip');
            existingTooltips.forEach(tooltip => {
                if (tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                }
            });
            cell.onmousemove = null;
        };
        
        currentRow.appendChild(cell);
        cellsInCurrentRow++;
    }
    
    progressionTableContainer.appendChild(progressionTableLabel);
    progressionTableContainer.appendChild(progressionTable);
    
    // Insert the table at the beginning of the placeholder
    if (placeholder.firstChild) {
        placeholder.insertBefore(progressionTableContainer, placeholder.firstChild);
    } else {
        placeholder.appendChild(progressionTableContainer);
    }
}

// Create options panel for progression realization
function createProgressionOptionsPanel() {
    let optionsContainer = document.createElement('div');
    optionsContainer.style.marginTop = '20px';
    optionsContainer.style.padding = '15px';
    optionsContainer.style.border = '1px solid #ccc';
    optionsContainer.style.borderRadius = '5px';
    optionsContainer.style.backgroundColor = '#353535ff';
    optionsContainer.id = 'progressionOptionsContainer';
    
    let optionsLabel = document.createElement('h3');
    optionsLabel.textContent = 'Progression Realization Options';
    optionsLabel.style.margin = '0 0 15px 0';
    optionsLabel.style.fontSize = '16px';
    optionsLabel.style.fontWeight = 'bold';
    
    optionsContainer.appendChild(optionsLabel);
    
    // Create a grid layout for options
    let optionsGrid = document.createElement('div');
    optionsGrid.style.display = 'grid';
    optionsGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(200px, 1fr))';
    optionsGrid.style.gap = '15px';
    
    // Helper function to create option groups
    function createOptionGroup(label, options, currentValue, onChange, isDisabled = false) {
        let group = document.createElement('div');
        
        let groupLabel = document.createElement('label');
        groupLabel.textContent = label + ':';
        groupLabel.style.fontWeight = 'bold';
        groupLabel.style.display = 'block';
        groupLabel.style.marginBottom = '5px';
        groupLabel.style.fontSize = '12px';
        
        let select = document.createElement('select');
        select.style.width = '100%';
        select.style.padding = '4px 8px';
        select.style.fontSize = '12px';
        select.disabled = isDisabled;
        
        if (isDisabled) {
            select.style.backgroundColor = '#e9ecef';
            select.style.color = '#6c757d';
        }
        
        // Add options
        Object.keys(options).forEach(key => {
            let option = document.createElement('option');
            option.value = key;
            option.textContent = options[key];
            if (key === currentValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
        
        select.onchange = onChange;
        
        group.appendChild(groupLabel);
        group.appendChild(select);
        
        return { group, select };
    }
    
    // Helper function to create number input
    function createNumberInput(label, min, max, currentValue, onChange, isDisabled = false) {
        let group = document.createElement('div');
        
        let groupLabel = document.createElement('label');
        groupLabel.textContent = label + ':';
        groupLabel.style.fontWeight = 'bold';
        groupLabel.style.display = 'block';
        groupLabel.style.marginBottom = '5px';
        groupLabel.style.fontSize = '12px';
        
        let input = document.createElement('input');
        input.type = 'number';
        input.min = min;
        input.max = max;
        input.value = currentValue;
        input.style.width = '100%';
        input.style.padding = '4px 8px';
        input.style.fontSize = '12px';
        input.disabled = isDisabled;
        
        if (isDisabled) {
            input.style.backgroundColor = '#e9ecef';
            input.style.color = '#6c757d';
        }
        
        input.onchange = onChange;
        
        group.appendChild(groupLabel);
        group.appendChild(input);
        
        return { group, input };
    }
    
    // Voicing options
    const voicingGroup = createOptionGroup('Voicing', {
        'natural': 'Always Natural',
        'first_inversion': 'Always First Inversion', 
        'leading': 'Leading Voice'
    }, progressionOptions.voicing, function(e) {
        progressionOptions.voicing = e.target.value;
        console.log('Voicing changed to:', progressionOptions.voicing);
    });
    
    // Split chord option
    const splitChordGroup = createOptionGroup('Split Chord', {
        'true': 'Yes',
        'false': 'No'
    }, progressionOptions.splitChord.toString(), function(e) {
        progressionOptions.splitChord = e.target.value === 'true';
        console.log('Split chord changed to:', progressionOptions.splitChord);
        // Refresh options to enable/disable lower octave
        createProgressionOptionsPanel();
    });
    
    // Lower octave (only enabled if split chord is yes)
    const lowerOctaveGroup = createNumberInput('Lower Octave', 1, 7, progressionOptions.lowerOctave, function(e) {
        progressionOptions.lowerOctave = parseInt(e.target.value);
        console.log('Lower octave changed to:', progressionOptions.lowerOctave);
    }, !progressionOptions.splitChord);
    
    // Upper octave (always enabled)
    const upperOctaveGroup = createNumberInput('Upper Octave', 1, 7, progressionOptions.upperOctave, function(e) {
        progressionOptions.upperOctave = parseInt(e.target.value);
        console.log('Upper octave changed to:', progressionOptions.upperOctave);
    });
    
    // Voice distribution options
    const rootGroup = createOptionGroup('Root Note', {
        'lower': 'Lower',
        'upper': 'Upper',
        'both': 'Both'
    }, progressionOptions.root, function(e) {
        progressionOptions.root = e.target.value;
        console.log('Root distribution changed to:', progressionOptions.root);
    });
    
    const thirdGroup = createOptionGroup('Third', {
        'lower': 'Lower',
        'upper': 'Upper', 
        'both': 'Both'
    }, progressionOptions.third, function(e) {
        progressionOptions.third = e.target.value;
        console.log('Third distribution changed to:', progressionOptions.third);
    });
    
    const fifthGroup = createOptionGroup('Fifth', {
        'lower': 'Lower',
        'upper': 'Upper',
        'both': 'Both'
    }, progressionOptions.fifth, function(e) {
        progressionOptions.fifth = e.target.value;
        console.log('Fifth distribution changed to:', progressionOptions.fifth);
    });
    
    const seventhGroup = createOptionGroup('Seventh', {
        'lower': 'Lower',
        'upper': 'Upper',
        'both': 'Both'
    }, progressionOptions.seventh, function(e) {
        progressionOptions.seventh = e.target.value;
        console.log('Seventh distribution changed to:', progressionOptions.seventh);
    });
    
    // Play style options
    const playStyleGroup = createOptionGroup('Play Style', {
        'block': 'Block Chords',
        'arpeggiated': 'Arpeggiated',
        'broken': 'Broken Chords'
    }, progressionOptions.playStyle, function(e) {
        progressionOptions.playStyle = e.target.value;
        console.log('Play style changed to:', progressionOptions.playStyle);
    });
    
    // Timing options
    const timingGroup = createOptionGroup('Timing', {
        'even': 'Even',
        'swing': 'Swing',
        'rubato': 'Rubato'
    }, progressionOptions.timing, function(e) {
        progressionOptions.timing = e.target.value;
        console.log('Timing changed to:', progressionOptions.timing);
    });
    
    // Velocity options
    const velocityGroup = createOptionGroup('Velocity', {
        'soft': 'Soft (pp)',
        'medium': 'Medium (mf)',
        'loud': 'Loud (ff)',
        'dynamic': 'Dynamic'
    }, progressionOptions.velocity, function(e) {
        progressionOptions.velocity = e.target.value;
        console.log('Velocity changed to:', progressionOptions.velocity);
    });
    
    // Sustain pedal
    const sustainGroup = createOptionGroup('Sustain Pedal', {
        'true': 'Yes',
        'false': 'No'
    }, progressionOptions.sustain.toString(), function(e) {
        progressionOptions.sustain = e.target.value === 'true';
        console.log('Sustain changed to:', progressionOptions.sustain);
    });
    
    // Bass line options
    const bassLineGroup = createOptionGroup('Bass Line', {
        'root': 'Root Notes Only',
        'walking': 'Walking Bass',
        'pedal': 'Pedal Tone',
        'none': 'No Bass'
    }, progressionOptions.bassLine, function(e) {
        progressionOptions.bassLine = e.target.value;
        console.log('Bass line changed to:', progressionOptions.bassLine);
    });
    
    // Rhythm options
    const rhythmGroup = createOptionGroup('Rhythm', {
        'whole': 'Whole Notes',
        'half': 'Half Notes',
        'quarter': 'Quarter Notes',
        'eighth': 'Eighth Notes'
    }, progressionOptions.rhythm, function(e) {
        progressionOptions.rhythm = e.target.value;
        console.log('Rhythm changed to:', progressionOptions.rhythm);
    });
    
    // Add all groups to the grid
    optionsGrid.appendChild(voicingGroup.group);
    optionsGrid.appendChild(splitChordGroup.group);
    optionsGrid.appendChild(lowerOctaveGroup.group);
    optionsGrid.appendChild(upperOctaveGroup.group);
    optionsGrid.appendChild(rootGroup.group);
    optionsGrid.appendChild(thirdGroup.group);
    optionsGrid.appendChild(fifthGroup.group);
    optionsGrid.appendChild(seventhGroup.group);
    optionsGrid.appendChild(playStyleGroup.group);
    optionsGrid.appendChild(timingGroup.group);
    optionsGrid.appendChild(velocityGroup.group);
    optionsGrid.appendChild(sustainGroup.group);
    optionsGrid.appendChild(bassLineGroup.group);
    optionsGrid.appendChild(rhythmGroup.group);
    
    optionsContainer.appendChild(optionsGrid);
    
    // Replace existing options panel or add new one
    const existingOptions = document.getElementById('progressionOptionsContainer');
    if (existingOptions) {
        placeholder.replaceChild(optionsContainer, existingOptions);
    } else {
        placeholder.appendChild(optionsContainer);
    }
}

// Create progression staff display
function createProgressionStaffDisplay() {
    let staffContainer = document.createElement('div');
    staffContainer.style.marginTop = '20px';
    staffContainer.style.padding = '10px'; // Reduced from 15px to 10px
    staffContainer.style.border = '1px solid #ccc';
    staffContainer.style.borderRadius = '5px';
    staffContainer.style.backgroundColor = '#fff';
    staffContainer.id = 'progressionStaffContainer';
    
    let staffLabel = document.createElement('h3');
    staffLabel.textContent = 'Chord Progression Preview';
    staffLabel.style.margin = '0 0 10px 0'; // Reduced bottom margin from 15px to 10px
    staffLabel.style.fontSize = '16px';
    staffLabel.style.fontWeight = 'bold';
    
    staffContainer.appendChild(staffLabel);
    
    // Create div for the staff display
    let staffDiv = document.createElement('div');
    staffDiv.id = 'progressionStaffDiv';
    staffDiv.style.width = '100%';
    staffDiv.style.minHeight = '120px';
    staffDiv.style.border = '1px solid #eee';
    staffDiv.style.borderRadius = '3px';
    staffDiv.style.backgroundColor = '#fafafa';
    
    staffContainer.appendChild(staffDiv);
    
    // Replace existing staff container or add new one
    const existingStaff = document.getElementById('progressionStaffContainer');
    if (existingStaff) {
        placeholder.replaceChild(staffContainer, existingStaff);
    } else {
        placeholder.appendChild(staffContainer);
    }
    
    // Draw the staff with current progressions
    drawProgressionStaff();
}

// Setup staves similar to index.js setupStaves function
function setupProgressionStaves(div, divisions = 1) {
    // Clear existing content
    while (div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }

    const renderer = new Renderer(div, Renderer.Backends.SVG);
    
    var displayWidth = div.offsetWidth || 800; // fallback width
    renderer.resize(displayWidth, 180); // Reduced height from 320 to 180
    const context = renderer.getContext();

    var maxWidth = displayWidth - 100;
    
    if (divisions <= 1) {
        // Single stave system
        const trebleStave = new Stave(30, 20, maxWidth); // Moved up from 80 to 20
        const bassStave = new Stave(30, 80, maxWidth);   // Moved up from 160 to 80
        
        trebleStave.addClef("treble");
        bassStave.addClef("bass");
        
        // Use C major for now (could be made configurable)
        trebleStave.addKeySignature('C');
        bassStave.addKeySignature('C');

        trebleStave.setContext(context).draw();
        bassStave.setContext(context).draw();

        new StaveConnector(bassStave, trebleStave)
            .setType('single')
            .setContext(context)
            .draw();

        new StaveConnector(trebleStave, bassStave)
            .setType('brace')
            .setContext(context)
            .draw();

        return { renderer, context, displayWidth: maxWidth, trebleStave, bassStave };
    } else {
        // Multiple stave system for showing multiple chords
        var divWidth = maxWidth / divisions;
        var trebleStaves = [];
        var bassStaves = [];
        
        // Create first staves with clefs and key signatures
        trebleStaves.push(new Stave(30, 20, divWidth)); // Moved up from 80 to 20
        bassStaves.push(new Stave(30, 80, divWidth));   // Moved up from 200 to 80

        trebleStaves[0].addClef("treble");
        bassStaves[0].addClef("bass");
        trebleStaves[0].addKeySignature('C');
        bassStaves[0].addKeySignature('C');

        // Create additional staves
        for (var i = 1; i < divisions; ++i) {
            trebleStaves.push(new Stave(trebleStaves[i-1].width + trebleStaves[i-1].x, 20, divWidth)); // Updated y position
            bassStaves.push(new Stave(bassStaves[i-1].width + bassStaves[i-1].x, 80, divWidth));       // Updated y position
        }
            
        // Draw all staves
        for (var stave of trebleStaves) {
            stave.setContext(context).draw();
        }
        for (var stave of bassStaves) {
            stave.setContext(context).draw();
        }

        // Add connectors
        new StaveConnector(bassStaves[0], trebleStaves[0])
            .setType('single')
            .setContext(context)
            .draw();

        new StaveConnector(trebleStaves[0], bassStaves[0])
            .setType('brace')
            .setContext(context)
            .draw();

        return { renderer, context, displayWidth: divWidth, trebleStaves, bassStaves };
    }
}

var noteArray = [];

// Draw progression on staff
function drawProgressionStaff() {
    const staffDiv = document.getElementById('progressionStaffDiv');
    if (!staffDiv) return;
    
    // Get the first selected progression for display
    if (selectedProgressions.length === 0) return;
    
    const firstProgression = chord_progressions[selectedProgressions[0]];
    if (!firstProgression) return;
    
    // Parse the chord symbols from the progression
    const chordSymbols = firstProgression.progression.split(' ').filter(chord => chord.trim() !== '');
    const numChords = Math.min(chordSymbols.length, 8); // Limit to 8 chords for display
    
    // Setup staves based on number of chords
    const { renderer, context, displayWidth, trebleStaves, bassStaves, trebleStave, bassStave } = 
        setupProgressionStaves(staffDiv, numChords);
    
    
    let chordNotes = getProgressionNotes(selectedProgressions[0], selectedScales[0].split('-')[0], selectedScales[0].split('-')[1], selectedRootNote[0]);
    console.log('Chord notes:', chordNotes);

    noteArray = []; // Reset note array for new progression

    var chordSampleNotes = []
    for (let i = 0; i < chordSymbols.length; i++) {
        const chordSymbol = chordSymbols[i];
        const notes = chordNotes[i];

        const currentNotes = notes.chord; // Contains an array like [C, E, G]

        // let trebleNotes = currentNotes.slice(0); // Copy all chord notes for treble
        let trebleNotes = currentNotes.slice(0).map(note => `${note}/${progressionOptions.upperOctave}`); // Convert to VexFlow format with upper octave
        console.log(`Chord ${i + 1} treble notes:`, trebleNotes);
        let bassNotes = [];
        if (progressionOptions.splitChord) {
            console.log(`Chord ${i + 1} split chord enabled ${progressionOptions.bassLine}`);
            if (progressionOptions.bassLine === 'root') {
                bassNotes = [`${currentNotes[0]}/${progressionOptions.lowerOctave}`]; // Root note as whole note in bass
                console.log(`Chord ${i + 1} bass notes:`, bassNotes);
            }
        } 

        let actualTrebleNotes = []
        let actualBassNotes = []
        let currentNoteArray = [];
        for (let note of trebleNotes) {
            if (note.includes('/')) {
                const [noteName, octave] = note.split('/');
                if (parseInt(octave) >= 4) {
                    actualTrebleNotes.push(note);
                }else {
                    actualBassNotes.push(note);
                }
            }
            currentNoteArray.push(note);
        }
        for (let note of bassNotes) {
            if (note.includes('/')) {   
                const [noteName, octave] = note.split('/');
                if (parseInt(octave) < 4) {
                    actualBassNotes.push(note);
                } else{
                    actualTrebleNotes.push(note);
                }
            }
            currentNoteArray.push(note);
        }
        noteArray.push(currentNoteArray);

        chordSampleNotes.push({
            treble: actualTrebleNotes,
            bass: actualBassNotes
        });
        console.log(`Chord ${i + 1} notes:`, chordSampleNotes[i]);
        console.log(`Chord ${i + 1} treble notes:`, chordSampleNotes[i].treble);
        console.log(`Chord ${i + 1} bass notes:`, chordSampleNotes[i].bass);
    }

    // Create sample notes for each chord (this is a simplified example)
    // In a full implementation, you would convert Roman numeral notation to actual chord notes
    for (let i = 0; i < numChords; i++) {
        const chordSymbol = chordSymbols[i];
        
        // Create simple placeholder notes (this would need proper chord conversion)
        // const sampleNotes = getSampleNotesForChord(chordSymbol, i);
        const sampleNotes = chordSampleNotes[i];
        let currentTrebleStave, currentBassStave;
        
        if (trebleStaves && bassStaves) {
            // Multiple staves
            currentTrebleStave = trebleStaves[i];
            currentBassStave = bassStaves[i];
        } else {
            // Single stave (only show first chord)
            if (i === 0) {
                currentTrebleStave = trebleStave;
                currentBassStave = bassStave;
            } else {
                break; // Skip additional chords for single stave
            }
        }
        
        // Draw treble notes if any
        if (sampleNotes.treble.length > 0) {
            const trebleNote = new StaveNote({
                keys: sampleNotes.treble,
                duration: 'w' // whole note
            });
            
            const trebleVoice = new Voice({ num_beats: 4, beat_value: 4 });
            trebleVoice.addTickables([trebleNote]);
            
            new Formatter().joinVoices([trebleVoice]).format([trebleVoice], displayWidth - 50);
            trebleVoice.draw(context, currentTrebleStave);
        }
        
        // Draw bass notes if any
        if (sampleNotes.bass.length > 0) {
            const bassNote = new StaveNote({
                clef: "bass",
                keys: sampleNotes.bass,
                duration: 'w' // whole note
            });
            
            const bassVoice = new Voice({ num_beats: 4, beat_value: 4 });
            bassVoice.addTickables([bassNote]);
            
            new Formatter().joinVoices([bassVoice]).format([bassVoice], displayWidth - 50);
            bassVoice.draw(context, currentBassStave);
        }
        
        // Add chord symbol as text
        if (currentTrebleStave) {
            const text = new Vex.Flow.TextNote({
                text: chordSymbol,
                font: {
                    family: "Arial",
                    size: 14,
                    weight: "bold"
                },
                duration: 'w',
                y_shift: -40
            })
            .setLine(0)
            .setStave(currentTrebleStave);
            
            const textVoice = new Voice({ num_beats: 4, beat_value: 4 });
            textVoice.addTickables([text]);
            
            new Formatter().joinVoices([textVoice]).format([textVoice], displayWidth - 50);
            text.setContext(context).draw();
        }
    }
    // outputNoteArray = noteArray; // Store the note array globally for further processing
    // drawNotes(outputDiv, outputNoteArray, false);
}

// Helper function to get sample notes for a chord symbol
// This is a simplified version - a full implementation would need proper Roman numeral parsing
function getSampleNotesForChord(chordSymbol, position) {
    // Simple mapping for common chord symbols to notes
    const chordMap = {
        'I': { treble: ['c/4', 'e/4', 'g/4'], bass: ['c/3'] },
        'ii': { treble: ['d/4', 'f/4', 'a/4'], bass: ['d/3'] },
        'iii': { treble: ['e/4', 'g/4', 'b/4'], bass: ['e/3'] },
        'IV': { treble: ['f/4', 'a/4', 'c/5'], bass: ['f/3'] },
        'V': { treble: ['g/4', 'b/4', 'd/5'], bass: ['g/3'] },
        'vi': { treble: ['a/4', 'c/5', 'e/5'], bass: ['a/3'] },
        'vii': { treble: ['b/4', 'd/5', 'f/5'], bass: ['b/3'] }
    };
    
    // Remove common modifiers and get base chord
    const baseChord = chordSymbol.replace(/[♭#b]+/g, '').replace(/[0-9o+]+/g, '').replace(/\//g, '');
    
    // Return sample notes or default
    return chordMap[baseChord] || { treble: ['c/4', 'e/4', 'g/4'], bass: ['c/3'] };
}

// Initialize the progression table, options panel, and staff display
createProgressionTable();
createProgressionOptionsPanel();
createProgressionStaffDisplay();

function numeralToChord(numeral, rootNote, scaleFamily, scaleIndex, scaleRoot, triads, seventhChords) {
    const numeral_ = numeral.trim();

    if(numeral == 'I' || numeral == 'i')
        return triads[0];
    else if(numeral == 'ii' || numeral == 'II')
        return triads[1];
    else if(numeral == 'iii' || numeral == 'III')
        return triads[2];
    else if(numeral == 'IV' || numeral == 'iv')
        return triads[3];
    else if(numeral == 'V' || numeral == 'v')
        return triads[4];
    else if(numeral == 'vi' || numeral == 'VI')
        return triads[5];
    else if(numeral == 'vii' || numeral == 'VII')
        return triads[6];
    else 
        throw new Error(`Unknown numeral: ${numeral}`);

}


function getProgressionNotes(progressionName, scaleFamily, scaleIndex, rootNote){
    console.log('getProgressionNotes called with:', progressionName, scaleFamily, scaleIndex, rootNote);

    progressionName = progressionName.trim();
    if (!chord_progressions[progressionName]) {
        console.error('Progression not found:', progressionName);
        return [];
    }
    let progression = chord_progressions[progressionName].progression;
    progression = progression.replace('-', ' ')
    console.log('Parsed progression:', progression);

    let progressionNotes = [];
    let chords = progression.split(' ').filter(chord => chord.trim() !== '');
    console.log('Chords in progression:', chords);

    console.log(HeptatonicScales)

    let scale = HeptatonicScales[scaleFamily][scaleIndex - 1];

    let identifiedChords_3 = identifySyntheticChords(scale, 3);
    let identifiedChords_4 = identifySyntheticChords(scale, 4);

    var notes = [];
    
    for (let c = 0; c < chords.length; c++) {
        let chord = chords[c];
        chord = chord.trim();
        console.log('Processing chord:', chord);
        
        // Raise an error if the chord contains a '/'
        if (chord.includes('/')) {
            throw new Error(`Chord "${chord}" contains a slash (/) which is not allowed.`);
        }
        notes.push(numeralToChord(chord, scale[c], scaleFamily, scaleIndex, rootNote, identifiedChords_3, identifiedChords_4));
    }
    return notes;
}

getProgressionNotes('50s progression', selectedScales[0].split('-')[0], selectedScales[0].split('-')[1], selectedRootNote[0]);


export {chord_progressions, selectedProgressions, progressionOptions, createProgressionTable, createProgressionOptionsPanel, createProgressionStaffDisplay, drawProgressionStaff}