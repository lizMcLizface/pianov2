function intervalToSemitones(interval) {
    switch (interval) {
        case 'P1':
        case 'd2':
            return 0;
        case 'm2':
        case 'A1':
            return 1;
        case 'M2':
        case 'd3':
            return 2;
        case 'm3':
        case 'A2':
            return 3;
        case 'M3':
        case 'd4':
            return 4;
        case 'P4':
        case 'A3':
            return 5;
        case 'd5':
        case 'A4':
            return 6;
        case 'P5':
        case 'd6':
            return 7;
        case 'm6':
        case 'A5':
            return 8;
        case 'M6':
        case 'd7':
            return 9;
        case 'm7':
        case 'A6':
            return 10;
        case 'M7':
        case 'd8':
            return 11;
        case 'P8':
        case 'A7':
        case 'd9':
            return 12;
        case 'm9':
        case 'A8':
            return 13;
        case 'M9':
        case 'd10':
            return 14;
        case 'm10':
        case 'A9':
            return 15;
        case 'M10':
        case 'd11':
            return 16;
        case 'P11':
        case 'A10':
            return 17;
        case 'd12':
        case 'A11':
            return 18;
        case 'P12':
        case 'd13':
            return 19;
        case 'm13':
        case 'A12':
            return 20;
        case 'M13':
        case 'd14':
            return 21;
        case 'm14':
        case 'A13':
            return 22;
        case 'M14':
        case 'd15':
            return 23;
        case 'P15':
        case 'A14':
            return 24;
        default:
            throw new Error(`Unknown interval: ${interval}`);
    }
}
function chordToIntervals(chordType) {
    const chordName = chordType.trim().toLowerCase();
    switch (chordName) {
        case 'major triad':
            return ['P1', 'M3', 'P5'];
        case 'minor triad':
            return ['P1', 'm3', 'P5'];
        case 'diminished triad':
            return ['P1', 'm3', 'd5'];
        case 'augmented triad':
            return ['P1', 'M3', 'A5'];
        case 'power chord':
            return ['P1', 'P5'];
        case 'dominant seventh':
            return ['P1', 'M3', 'P5', 'm7'];
        case 'minor seventh':
            return ['P1', 'm3', 'P5', 'm7'];
        case 'minor major seventh':
            return ['P1', 'm3', 'P5', 'M7'];
        case 'major seventh':
            return ['P1', 'M3', 'P5', 'M7'];
        case 'augmented major seventh':
            return ['P1', 'M3', 'A5', 'M7'];
        case 'augmented seventh':
            return ['P1', 'M3', 'A5', 'm7'];
        case 'half diminished seventh':
            return ['P1', 'm3', 'd5', 'm7'];
        case 'diminished seventh':
            return ['P1', 'm3', 'd5', 'd7'];
        case 'diminished seventh flat five':
            return ['P1', 'M3', 'd5', 'm7'];
        case 'major ninth':
            return ['P1', 'M3', 'P5', 'M7', 'M9'];
        case 'minor ninth':
            return ['P1', 'm3', 'P5', 'm7', 'M9'];
        case 'dominant ninth':
            return ['P1', 'M3', 'P5', 'm7', 'M9'];
        case 'dominant minor ninth':
            return ['P1', 'M3', 'P5', 'm7', 'm9'];
        case 'minor major ninth':
            return ['P1', 'm3', 'P5', 'M7', 'M9'];
        case 'augmented major ninth':
            return ['P1', 'M3', 'A5', 'M7', 'M9'];
        case 'augmented dominant ninth':
            return ['P1', 'M3', 'A5', 'm7', 'M9'];
        case 'half diminished ninth':
            return ['P1', 'm3', 'd5', 'm7', 'M9'];
        case 'half diminished minor ninth':
            return ['P1', 'm3', 'd5', 'm7', 'm9'];
        case 'diminished ninth':
            return ['P1', 'm3', 'd5', 'd7', 'M9'];
        case 'diminished minor ninth':
            return ['P1', 'm3', 'd5', 'd7', 'm9'];
        default:
            throw new Error(`Unknown chord type: ${chordName}`);
    }
}

function noteToMidi(note) { // Note is of format C -> default to C/4, or C/4
    note = note.trim()
        .replace('♯', '#')
        .replace('♭', 'b')
        .replace('𝄫', 'bb')
        .replace('𝄪', '##');
    let octave;
    if (note.includes('/')) {
        [note, octave] = note.split('/');
        octave = parseInt(octave, 10);
    } else {
        octave = 4; // Default octave if not specified
    }

    const noteToMidiMap = {
        'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11,
        'C#': 1, 'D#': 3, 'F#': 6, 'G#': 8, 'A#': 10,
        'Bb': 10, 'Cb': 11, 'B#': 0, 'E#': 5,
    };

    if (!(note in noteToMidiMap)) {
        throw new Error(`Unknown note: ${note}`);
    }

    const midiNote = noteToMidiMap[note] + (octave + 1) * 12;
    return midiNote;
}

function midiToNote(midiNote) {
    if (typeof midiNote !== 'number' || midiNote < 0) {
        throw new Error("MIDI note must be a non-negative integer");
    }

    const octave = Math.floor(midiNote / 12) - 1;
    const noteIndex = midiNote % 12;

    const indexToNoteMap = {
        0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E',
        5: 'F', 6: 'F#', 7: 'G', 8: 'G#', 9: 'A',
        10: 'A#', 11: 'B'
    };

    if (!(noteIndex in indexToNoteMap)) {
        throw new Error(`Unknown MIDI note index: ${noteIndex}`);
    }

    return `${indexToNoteMap[noteIndex]}/${octave}`;
}




function resolveChord(chordName) {
    chordName = chordName.replace(/\s+/g, '')
        .replace(/Major/gi, 'maj')
        .replace(/Minor/gi, 'min');

    // Regex for root note and chord type
    const noteRegex = /^([A-G](?:b|#|♮|♭|♯|𝄫|𝄪|)?)(.*)$/;
    const noteRegex2 = /^(.*)\/([A-G](?:b|#|♮|♭|♯|𝄫|𝄪|)?)$/;

    let result = chordName.match(noteRegex);
    if (!result) {
        throw new Error("Invalid chord name: No root note found");
    }
    const rootNote = result[1];
    let subString = result[2];

    result = subString.match(noteRegex2);
    let chordType, bassNote;
    if (result) {
        chordType = result[1];
        bassNote = result[2];
    } else {
        chordType = subString;
        bassNote = null;
    }

    let suspended = null;
    if (chordType.includes('sus')) {
        if (chordType.includes('sus2')) {
            suspended = 'sus2';
            chordType = chordType.replace('sus2', '');
        } else if (chordType.includes('sus4')) {
            suspended = 'sus4';
            chordType = chordType.replace('sus4', '');
        } else if (chordType.includes('sus')) {
            suspended = 'sus4';
            chordType = chordType.replace('sus', '');
        }
    }

    let addedTone = null;
    if (chordType.includes('add')) {
        const addMatch = chordType.match(/add(\d+)/);
        if (addMatch) {
            addedTone = addMatch[1];
            chordType = chordType.replace(`add${addedTone}`, '');
        }
    }

    let noTone = null;
    if (chordType.includes('no')) {
        const noMatch = chordType.match(/no(\d+)/);
        if (noMatch) {
            noTone = noMatch[1];
            chordType = chordType.replace(`no${noTone}`, '');
        }
    }

    chordType = chordType.replace(/♯/g, '#')
        .replace(/♭/g, 'b')
        .replace(/𝄫/g, 'bb')
        .replace(/𝄪/g, '##')
        .replace(/♮/g, '')
        .replace(/°/g, 'o')
        .replace(/Δ/g, 'D');

    let chord = null;
    if (['', 'maj', 'M', 'Δ', 'D'].includes(chordType)) {
        chord = 'Major Triad';
    } else if (['min', 'm', '−'].includes(chordType)) {
        chord = 'Minor Triad';
    } else if (['dim', '°', 'o', 'm♭5', 'mo5', 'm°5'].includes(chordType)) {
        chord = 'Diminished Triad';
    } else if (['aug', '+', 'M♯5', 'M+5'].includes(chordType)) {
        chord = 'Augmented Triad';
    } else if (['5'].includes(chordType)) {
        chord = 'Power Chord';
    } else if (['7', 'Mm7', 'maj♭7', 'majm7', 'majb7'].includes(chordType)) {
        chord = 'Dominant Seventh';
    } else if (['m7', 'min7', '−7', '−7'].includes(chordType)) {
        chord = 'Minor Seventh';
    } else if (['mM7', 'm#7', '-M7', '-Δ7', 'minmaj7', 'm♯7', '-D7'].includes(chordType)) {
        chord = 'Minor Major Seventh';
    } else if (['M7', 'Ma7', 'maj7', 'Δ7', 'D7'].includes(chordType)) {
        chord = 'Major Seventh';
    } else if (['+M7', '+D', 'augmaj7', 'M7#5', 'M7+5', 'D#5, D+5'].includes(chordType)) {
        chord = 'Augmented Major Seventh';
    } else if (['+7', 'aug7', '7#5', '7+5'].includes(chordType)) {
        chord = 'Augmented Seventh';
    } else if (['ø', 'ø7', 'min7dim5', 'm7b5', 'm7o5', '-7b5', '-7o5'].includes(chordType)) {
        chord = 'Half Diminished Seventh';
    } else if (['o7', 'dim7'].includes(chordType)) {
        chord = 'Diminished Seventh';
    } else if (['7b5', '7dim5'].includes(chordType)) {
        chord = 'Diminished Seventh Flat Five';
    } else if (['M9', 'D9', 'maj9'].includes(chordType)) {
        chord = 'Major Ninth';
    } else if (['m9', 'min9', '−9'].includes(chordType)) {
        chord = 'Minor Ninth';
    } else if (['9'].includes(chordType)) {
        chord = 'Dominant Ninth';
    } else if (['7b9'].includes(chordType)) {
        chord = 'Dominant minor Ninth';
    } else if (['mM9', '-M9', 'minmaj9'].includes(chordType)) {
        chord = 'Minor Major Ninth';
    } else if (['+M9', 'augmaj9'].includes(chordType)) {
        chord = 'Augmented Major Ninth';
    } else if (['+9', '9#5', 'aug9'].includes(chordType)) {
        chord = 'Augmented dominant ninth';
    } else if (['ø9'].includes(chordType)) {
        chord = 'Half Diminished Ninth';
    } else if (['øb9'].includes(chordType)) {
        chord = 'Half Diminished minor Ninth';
    } else if (['o9', 'dim9'].includes(chordType)) {
        chord = 'Diminished Ninth';
    } else if (['ob9', 'dimb9'].includes(chordType)) {
        chord = 'Diminished minor Ninth';
    } else if (['11'].includes(chordType)) {
        chord = 'Eleventh';
    } else if (['m11', 'min11', '−11'].includes(chordType)) {
        chord = 'Minor Eleventh';
    } else if (['M11', 'maj11', 'D11'].includes(chordType)) {
        chord = 'Major Eleventh';
    } else if (['mM11', '-M11', 'minmaj11'].includes(chordType)) {
        chord = 'Minor Major Eleventh';
    } else if (['+M11', 'augmaj11'].includes(chordType)) {
        chord = 'Augmented Major Eleventh';
    } else if (['+11', '11#5', 'aug11'].includes(chordType)) {
        chord = 'Augmented Eleventh';
    } else if (['ø11'].includes(chordType)) {
        chord = 'Half Diminished Eleventh';
    } else if (['o11', 'dim11'].includes(chordType)) {
        chord = 'Diminished Eleventh';
    } else if (['M13', 'maj13', 'D13'].includes(chordType)) {
        chord = 'Major Thirteenth';
    } else if (['m13', 'min13', '−13'].includes(chordType)) {
        chord = 'Minor Thirteenth';
    } else if (['13'].includes(chordType)) {
        chord = 'Dominant Thirteenth';
    } else if (['mM13', '-M13', 'minmaj13'].includes(chordType)) {
        chord = 'Minor Major Thirteenth';
    } else if (['+M13', 'augmaj13'].includes(chordType)) {
        chord = 'Augmented Major Thirteenth';
    } else if (['+13', '13#5', 'aug13'].includes(chordType)) {
        chord = 'Augmented Thirteenth';
    } else if (['ø13'].includes(chordType)) {
        chord = 'Half Diminished Thirteenth';
    } else {
        throw new Error(`Unknown chord type: ${chordType}`);
    }

    return {
        rootNote,
        chordType: chord,
        suspended,
        addedTone,
        bassNote,
        noTone
    };
}
function processChord(chordName) {
    const chord = resolveChord(chordName);
    const rootNote = chord.rootNote;
    const chordType = chord.chordType;
    const suspended = chord.suspended;
    const addedTone = chord.addedTone;
    const bassNote = chord.bassNote;
    const noTone = chord.noTone;

    let intervals = chordToIntervals(chordType);

    const rootMidi = noteToMidi(rootNote);

    // Handle suspended chords
    if (suspended) {
        if (suspended === 'sus2') {
            intervals[1] = 'M2';
        } else if (suspended === 'sus4') {
            intervals[1] = 'P4';
        }
    }

    // Handle added tones
    if (addedTone) {
        intervals.push(`M${addedTone}`);
    }

    // Handle omitted tones
    if (noTone) {
        intervals = intervals.filter(i => !i.includes(noTone));
    }

    const notes = [];
    for (const interval of intervals) {
        const semitones = intervalToSemitones(interval);
        const noteMidi = rootMidi + semitones;
        if (noteMidi >= 128) {
            throw new Error("MIDI note out of range");
        }
        notes.push(midiToNote(noteMidi));
    }

    // Handle bass note
    if (bassNote) {
        const bassMidi = noteToMidi(bassNote);
        let bassInterval = bassMidi - rootMidi;
        if (bassInterval < 0) {
            bassInterval += 12;
        }
        notes.push(midiToNote(bassMidi));
    }

    return {
        root: rootMidi,
        rootNote,
        chordType,
        suspended,
        addedTone,
        noTone,
        intervals,
        rootMidi,
        notes
    };
}

export { intervalToSemitones, chordToIntervals, noteToMidi, midiToNote, resolveChord, processChord };