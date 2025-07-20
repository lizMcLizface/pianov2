import { context,
    masterVolume,
    customWaveform,
    waveform,
    pianoNotes,
    attackTime,
    sustainLevel,
    releaseTime,
    noteLength,
    vibratoSpeed,
    vibratoAmount,
    delay,
    feedback,
    delayAmountGain,
    startButton,
    stopButton,
    tempoControl,
    tempo,
    isPlaying} from './synth';
import {processChord} from './intervals';
import {HeptatonicScales, scales, getScaleNotes, highlightKeysForScales} from './scales';
import {createHeptatonicScaleTable, selectedRootNote, selectedScales} from './scaleGenerator';
import {chords, processedChords, highlightKeysForChords, createChordRootNoteTable, createChordSuffixTable, selectedChordRootNote, selectedChordSuffixes} from './chords';
import {noteToMidi, noteToName, keys, getElementByNote, getElementByMIDI} from './midi';
import {createScaleChordCrossReference, updateCrossReferenceDisplay} from './cross';



function keyToNote(event){
    switch (event.code){
        case 'KeyA': return 'G/3';
        case 'KeyW': return 'G#/3';
        case 'KeyS': return 'A/3';
        case 'KeyE': return 'A#/3';
        case 'KeyD': return 'B/3';
        case 'KeyF': return 'C/4';
        case 'KeyT': return 'C#/4';
        case 'KeyG': return 'D/4';
        case 'KeyY': return 'D#/4';
        case 'KeyH': return 'E/4';
        case 'KeyJ': return 'F/4';
        case 'KeyI': return 'F#/4';
        case 'KeyK': return 'G/4';
        case 'KeyO': return 'G#/4';
        case 'KeyL': return 'A/4';
        case 'KeyP': return 'A#/4';
        case 'Semicolon': return 'B/4';
        case 'Quote': return 'C/5';
        case 'BracketRight': return 'C#/5';
    }
    return undefined;
}

var modifiers = {
    'LeftShift': false,
    'RightShift': false,
    'LeftControl': false,
    'RightControl': false,
    'LeftAlt': false,
    'RightAlt': false,
}

export {modifiers, keyToNote}