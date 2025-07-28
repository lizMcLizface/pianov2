import React, { useLayoutEffect, useEffect, useState, useRef, useImperativeHandle } from 'react';
import PropTypes from 'prop-types';
import * as Nodes from '../../nodes';
import MonoSynth from './../MonoSynth';
import Knob from './../Knob';
import KnobGrid from './../KnobGrid';
import Module from './../Module';
import PeakMeter from './../PeakMeter';
import Oscilloscope from './../Oscilloscope';
import Spectrogram from './../Spectrogram';
import SpectrumAnalyzer from './../SpectrumAnalyzer';
import Select from './../Select';
import presetData from '../../util/presetData';
import { getNoteInfo, WAVEFORM, FILTER, REVERB, ENVELOPE_SHAPE } from '../../util/util';
import { THEMES } from '../../styles/themes';

import {
    ModuleGridContainer,
    InfoModule,
    InfoContainer,
    InfoSelect,
    PrimaryText,
    PopText,
    Tag,
    Lines,
    MicrotonalModule,
} from './PolySynth.styled';

const BASE_CLASS_NAME = 'PolySynth';

const AC = new AudioContext();
const polyphony = 8;
const synthArr = Array(polyphony).fill(0).map(_ => new MonoSynth(AC));
let synthPos = 0;

let polyphonyGlobal = 8;
// let portamentoSpeedGlobal = 0;
const synthMix = new Nodes.Compressor(AC);

// Master Effects
const masterGain = new Nodes.Gain(AC);
const masterFilter = new Nodes.Filter(AC);
const masterDistortion = new Nodes.Distortion(AC);
const masterFlanger = new Nodes.Flanger(AC);
const masterDelay = new Nodes.Delay(AC);
const masterPingPong = new Nodes.PingPongDelay(AC);
const masterReverb = new Nodes.Reverb(AC);
const vibratoLFO = new Nodes.LFO(AC);
const masterBitCrush = new Nodes.BitCrusher(AC);
const masterLimiter = new Nodes.Compressor(AC);
const masterEQ2 = new Nodes.EQ2(AC);

let portamentoSpeedGlobal = 0;

let gains = {
    gainAttack: 0,
    gainDecay: 0,
    gainSustain: 0,
    gainRelease: 0,
    gainHold: 0,
    gainHoldLevel: 0,
    envelopeAttackExponent: 2,
    envelopeDecayExponent: 2,
    envelopeReleaseExponent: 2,
    envelopeAttackShape: 'exponential',
    envelopeDecayShape: 'exponential',
    envelopeReleaseShape: 'exponential'
}
let filterEnv = {
    attack: 0,
    decay: 0,
    sustain: 0,
    release: 0
};

let pitchEnv = {
    C: 1.0,
    CSharp: 1.0,
    D: 1.0,
    DSharp: 1.0,
    E: 1.0,
    F: 1.0,
    FSharp: 1.0,
    G: 1.0,
    GSharp: 1.0,
    A: 1.0,
    ASharp: 1.0,
    B: 1.0,
    Octave: 2.0,
    AllThemPitches: 1.0
};

const PolySynth = React.forwardRef(({ className, setTheme, currentTheme }, ref) => {
    // Synth State
    const [synthActive, setSynthActive] = useState(false);
    const [octaveMod, setOctaveMod] = useState(4);
    const [currentPreset, setCurrentPreset] = useState('- INIT -');
    
    // Track if synth has been initialized to prevent multiple starts
    const synthInitialized = useRef(false);
    
    // Track active notes for programmatic control
    const activeNotes = useRef(new Map());
    const noteIdCounter = useRef(0);

    // Preset State
    const [polyphony, setPolyphony] = useState(synthArr.length);
    const [portamentoSpeed, setPortamentoSpeed] = useState(0);
    const [masterVolume, setMasterVolume] = useState(0.75);
    const [masterFilterType, setMasterFilterType] = useState('lowpass');
    const [masterFilterFreq, setMasterFilterFreq] = useState(11000);
    const [masterFilterQ, setMasterFilterQ] = useState(0);
    const [masterFilterGain, setMasterFilterGain] = useState(0);
    const [vcoType, setVcoType] = useState('sine');
    const [gainAttack, setGainAttack] = useState(0);
    const [gainDecay, setGainDecay] = useState(0);
    const [gainSustain, setGainSustain] = useState(0.7);
    const [gainRelease, setGainRelease] = useState(0);
    const [gainHold, setGainHold] = useState(0);
    const [gainHoldLevel, setGainHoldLevel] = useState(0);
    const [filterType, setFilterType] = useState('lowpass');
    const [filterFreq, setFilterFreq] = useState(11000);
    const [filterQ, setFilterQ] = useState(0);
    const [filterGain, setFilterGain] = useState(0);
    const [filterAttack, setFilterAttack] = useState(0);
    const [filterDecay, setFilterDecay] = useState(0);
    const [filterRelease, setFilterRelease] = useState(0);
    const [filterEnvAmount, setFilterEnvAmount] = useState(0);
    const [distortionAmount, setDistortionAmount] = useState(0);
    const [distortionDist, setDistortionDist] = useState(0);
    const [reverbType, setReverbType] = useState('reverb1');
    const [reverbAmount, setReverbAmount] = useState(0);
    const [flangerAmount, setFlangerAmount] = useState(0);
    const [flangerDepth, setFlangerDepth] = useState(0);
    const [flangerRate, setFlangerRate] = useState(0);
    const [flangerFeedback, setFlangerFeedback] = useState(0);
    const [flangerDelay, setFlangerDelay] = useState(0);
    const [delayTime, setDelayTime] = useState(0);
    const [delayFeedback, setDelayFeedback] = useState(0);
    const [delayTone, setDelayTone] = useState(4400);
    const [delayAmount, setDelayAmount] = useState(0);
    const [pingPongDelayTime, setPingPongDelayTime] = useState(0);
    const [pingPongFeedback, setPingPongFeedback] = useState(0);
    const [pingPongTone, setPingPongTone] = useState(4400);
    const [pingPongAmount, setPingPongAmount] = useState(0);
    const [vibratoDepth, setVibratoDepth] = useState(0);
    const [vibratoRate, setVibratoRate] = useState(0);
    const [bitCrushDepth, setBitCrushDepth] = useState(8);
    const [bitCrushAmount, setBitCrushAmount] = useState(0);
    const [eqLowGain, setEqLowGain] = useState(0);
    const [eqHighGain, setEqHighGain] = useState(0);
    const [eqLowFreq, setEqLowFreq] = useState(320);
    const [eqHighFreq, setEqHighFreq] = useState(3200);

    // Microtonal/Pitch Adjustment State (default 1.0 = no adjustment)
    const [pitchC, setPitchC] = useState(1.0);
    const [pitchCSharp, setPitchCSharp] = useState(1.0);
    const [pitchD, setPitchD] = useState(1.0);
    const [pitchDSharp, setPitchDSharp] = useState(1.0);
    const [pitchE, setPitchE] = useState(1.0);
    const [pitchF, setPitchF] = useState(1.0);
    const [pitchFSharp, setPitchFSharp] = useState(1.0);
    const [pitchG, setPitchG] = useState(1.0);
    const [pitchGSharp, setPitchGSharp] = useState(1.0);
    const [pitchA, setPitchA] = useState(1.0);
    const [pitchASharp, setPitchASharp] = useState(1.0);
    const [pitchB, setPitchB] = useState(1.0);
    const [octaveRatio, setOctaveRatio] = useState(2.0);
    const [allThemPitches, setAllThemPitches] = useState(1.0);

    // Envelope Shape State
    const [envelopeAttackShape, setEnvelopeAttackShape] = useState('exponential');
    const [envelopeDecayShape, setEnvelopeDecayShape] = useState('exponential');
    const [envelopeReleaseShape, setEnvelopeReleaseShape] = useState('exponential');
    const [envelopeAttackExponent, setEnvelopeAttackExponent] = useState(2);
    const [envelopeDecayExponent, setEnvelopeDecayExponent] = useState(2);
    const [envelopeReleaseExponent, setEnvelopeReleaseExponent] = useState(2);

    // Filter Envelope Shape State
    const [filterEnvelopeAttackShape, setFilterEnvelopeAttackShape] = useState('exponential');
    const [filterEnvelopeDecayShape, setFilterEnvelopeDecayShape] = useState('exponential');
    const [filterEnvelopeReleaseShape, setFilterEnvelopeReleaseShape] = useState('exponential');
    const [filterEnvelopeAttackExponent, setFilterEnvelopeAttackExponent] = useState(2);
    const [filterEnvelopeDecayExponent, setFilterEnvelopeDecayExponent] = useState(2);
    const [filterEnvelopeReleaseExponent, setFilterEnvelopeReleaseExponent] = useState(2);

    const octaveUp = () => {
        if (octaveMod < 7) {
            setOctaveMod(octaveMod + 1);
            synthArr.forEach(synth => synthNoteOff(synth));
            regularActiveNotes.current.clear(); // Clear regular note tracking
        }
    };
    const octaveDown = () => {
        if (octaveMod > 1) {
            setOctaveMod(octaveMod - 1);
            synthArr.forEach(synth => synthNoteOff(synth));
            regularActiveNotes.current.clear(); // Clear regular note tracking
        }
    };

    const resetMicrotonalPitches = () => {
        setPitchC(1.0);
        setPitchCSharp(1.0);
        setPitchD(1.0);
        setPitchDSharp(1.0);
        setPitchE(1.0);
        setPitchF(1.0);
        setPitchFSharp(1.0);
        setPitchG(1.0);
        setPitchGSharp(1.0);
        setPitchA(1.0);
        setPitchASharp(1.0);
        setPitchB(1.0);
        setOctaveRatio(2.0);
        setAllThemPitches(1.0);
    };

    const resetSynthPos = () => synthPos = 0;
    const incrementSynthPos = () => synthPos = (synthPos + 1) % polyphonyGlobal;

    const activateSynth = () => {
        setSynthActive(true);
        AC.resume();
    };

    const initSynth = () => {
        // Prevent multiple initializations
        if (synthInitialized.current) return;
        
        synthArr.forEach(synth => {
            synth.connect(synthMix.getNode());
            vibratoLFO.connect(synth.getNode().detune);
            synth.init();
        });

        vibratoLFO.start();

        // Compressing all synths together to avoid clipping/distortion
        synthMix.connect(masterDistortion.getNode());
        // Limiter-type settings
        synthMix.setThreshold(-6);
        synthMix.setKnee(0);
        synthMix.setRatio(20);

        masterDistortion.connect(masterFlanger.getNode());
        masterFlanger.connect(masterBitCrush.getNode());
        masterBitCrush.connect(masterDelay.getNode());
        masterDelay.connect(masterPingPong.getNode());
        masterPingPong.connect(masterReverb.getNode());
        masterReverb.connect(masterEQ2.getNode());
        masterEQ2.connect(masterFilter.getNode());
        masterFilter.connect(masterLimiter.getNode());

        masterLimiter.connect(masterGain.getNode());
        masterLimiter.setThreshold(-6);
        masterLimiter.setKnee(0);
        masterLimiter.setRatio(20);

        masterGain.connect(AC.destination);
        
        // Mark as initialized
        synthInitialized.current = true;
    };

    // console.log('Gain: ', gainAttack, gainDecay, gainSustain, gainRelease);

    gains = {
        gainAttack,
        gainDecay,
        gainSustain,
        gainRelease,
        gainHold,
        gainHoldLevel,
        envelopeAttackExponent,
        envelopeDecayExponent,
        envelopeReleaseExponent,
        envelopeAttackShape,
        envelopeDecayShape,
        envelopeReleaseShape
    }
    filterEnv = {
        attack: filterAttack,
        decay: filterDecay,
        release: filterRelease,
        amount: filterEnvAmount
    };

    pitchEnv = {
        C: pitchC,
        CSharp: pitchCSharp,
        D: pitchD,
        DSharp: pitchDSharp,
        E: pitchE,
        F: pitchF,
        FSharp: pitchFSharp,
        G: pitchG,
        GSharp: pitchGSharp,
        A: pitchA,
        ASharp: pitchASharp,
        B: pitchB,
        Octave: octaveRatio,
        AllThemPitches: allThemPitches
    };
    portamentoSpeedGlobal = portamentoSpeed;
    polyphonyGlobal = polyphony;

    const getGainEnv = (volume) => {
        const v = volume || 1;
        // Apply exponential scaling for more natural response
        // You can tweak the exponent (e.g., 2) for desired curve
        const exp = 1/2;
        return {
            a: gains.gainAttack * Math.pow(v, exp),
            d: gains.gainDecay * Math.pow(v, exp),
            s: gains.gainSustain * Math.pow(v, exp),
            r: gains.gainRelease * Math.pow(v, exp),
            hold: gains.gainHold * Math.pow(v, exp),
            holdLevel: gains.gainHoldLevel * Math.pow(v, exp),
            // Envelope shape parameters
            attackShape: gains.envelopeAttackShape,
            decayShape: gains.envelopeDecayShape,
            releaseShape: gains.envelopeReleaseShape,
            attackExponent: gains.envelopeAttackExponent,
            decayExponent: gains.envelopeDecayExponent,
            releaseExponent: gains.envelopeReleaseExponent
        };
    };
    const getFilterEnv = () => ({
        a: filterEnv.attack,
        d: filterEnv.decay,
        r: filterEnv.release,
        amount: filterEnv.amount,
        // Filter envelope shape parameters
        attackShape: filterEnvelopeAttackShape,
        decayShape: filterEnvelopeDecayShape,
        releaseShape: filterEnvelopeReleaseShape,
        attackExponent: filterEnvelopeAttackExponent,
        decayExponent: filterEnvelopeDecayExponent,
        releaseExponent: filterEnvelopeReleaseExponent
    });
    portamentoSpeedGlobal = portamentoSpeed;

    // Functions to pass envelope data to the synth
    const synthNoteOn = (synth, note, volume) => {
        const gainEnv = getGainEnv(volume);
        // console.log('Gain envelope:', gainEnv);
        const filterEnv = getFilterEnv();
        const voiceId = synth.noteOn(
            note,
            {
                gainEnv,
                filterEnv,
                portamentoSpeed: polyphonyGlobal === 1 ? portamentoSpeedGlobal : 0
            },
        );
        return voiceId; // Return voice ID for tracking
    }
    const synthNoteOff = (synth, note = null, voiceId = null) => {
        const gainEnv = getGainEnv(1); // Use default volume of 1 for note off
        const filterEnv = getFilterEnv();
        // console.log('Sending note off to synth', synth, 'note information', note, 'voiceId', voiceId);
        synth.noteOff({ gainEnv, filterEnv }, voiceId);
    }

    // Programmatic note control functions
    const playNotesProgrammatic = (notes, volume = 50, duration = null) => {
        if (!synthActive) activateSynth();
        // console.log('Playing programmatic notes:', notes, 'Volume:', volume, 'Duration:', duration);
        
        const gainValue = volume / 100; // Convert percentage to gain value
        
        notes.forEach(noteString => {
            // Parse note string (e.g., "C4", "D#5")
            const note = parseNoteString(noteString);
            if (!note) return;
            
            // Find available synth or reuse existing one
            let targetSynth = null;
            if (!synthArr[synthPos].currentNote) {
                targetSynth = synthArr[synthPos];
                // console.log('Reusing synth at position:', synthPos);
            } else {
                const initialPos = synthPos;
                // console.log('Finding available synth, starting at position:', synthPos);
                incrementSynthPos();

                while (synthPos !== initialPos) {
                    // console.log('Checking synth at position:', synthPos);
                    if (!synthArr[synthPos].currentNote) break;
                    incrementSynthPos();
                }
                // console.log('Found available synth at position:', synthPos);
                targetSynth = synthArr[synthPos];
            }

            // Create unique ID for this note instance
            const noteId = `${noteString}_${noteIdCounter.current++}`;
            
            // Start the note and get the voice ID
            const voiceId = synthNoteOn(targetSynth, note, gainValue);
            
            // Store note info for tracking
            const noteInfo = {
                synth: targetSynth,
                noteString: noteString,
                volume: gainValue,
                noteId: noteId,
                voiceId: voiceId // Store voice ID for proper cleanup
            };
            
            activeNotes.current.set(noteId, noteInfo);
            incrementSynthPos();
            
            // If duration is specified, schedule note off
            if (duration) {
                setTimeout(() => {
                    const noteInfo = activeNotes.current.get(noteId);
                    if (noteInfo) {
                        synthNoteOff(noteInfo.synth, note, noteInfo.voiceId);
                        activeNotes.current.delete(noteId);
                    }
                }, duration);
            }
        });
    };

    const stopNotesProgrammatic = (notes) => {
        notes.forEach(noteString => {
            // Find all active notes with this note name and stop them
            const notesToStop = [];
            activeNotes.current.forEach((noteInfo, noteId) => {
                if (noteInfo.noteString === noteString) {
                    notesToStop.push(noteId);
                }
            });
            // console.log('Notes to stop: ', notes);
            // console.log('Found notes playing: ', notesToStop);
            
            notesToStop.forEach(noteId => {
                const noteInfo = activeNotes.current.get(noteId);
                if (noteInfo) {
                    synthNoteOff(noteInfo.synth, null, noteInfo.voiceId);
                    activeNotes.current.delete(noteId);
                }
            });
        });
    };

    const stopAllNotesProgrammatic = () => {
        // console.log('Stopping all programmatic notes, count:', activeNotes.current.size);
        activeNotes.current.forEach((noteInfo, noteId) => {
            synthNoteOff(noteInfo.synth, null, noteInfo.voiceId);
        });
        activeNotes.current.clear();
        
        // Also force stop all synths as a backup
        synthArr.forEach(synth => {
            if (synth.currentNote) {
                synthNoteOff(synth);
            }
        });
    };

    // Helper function to parse note strings like "C4", "D#5", etc.
    const parseNoteString = (noteString) => {
        const match = noteString.match(/^([A-G]#?)(\d+)$/);
        if (!match) return null;
        
        const noteName = match[1];
        const octave = parseInt(match[2]);
        
        // Get base frequency and apply microtonal adjustments
        // const baseFreq = {
        //     'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
        //     'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
        //     'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
        // }[noteName];

        let noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        let baseFrequency = 261.63; // Default base frequency for C4
        let baseFrequencies = [baseFrequency]
        for(let i = 1; i < noteNames.length; i++) {
            baseFrequencies.push(baseFrequencies[i - 1] * Math.pow(pitchEnv.Octave, 1/12));
        }
        const baseFreq = {            'C': baseFrequencies[0], 'C#': baseFrequencies[1], 'D': baseFrequencies[2], 'D#': baseFrequencies[3],
            'E': baseFrequencies[4], 'F': baseFrequencies[5], 'F#': baseFrequencies[6], 'G': baseFrequencies[7],
            'G#': baseFrequencies[8], 'A': baseFrequencies[9], 'A#': baseFrequencies[10], 'B': baseFrequencies[11]
        }[noteName];



        if (!baseFreq) return null;
        
        // Apply microtonal pitch adjustments
        const pitchAdjustments = {
            'C': pitchEnv.C, 'C#': pitchEnv.CSharp, 'D': pitchEnv.D, 'D#': pitchEnv.DSharp,
            'E': pitchEnv.E, 'F': pitchEnv.F, 'F#': pitchEnv.FSharp, 'G': pitchEnv.G,
            'G#': pitchEnv.GSharp, 'A': pitchEnv.A, 'A#': pitchEnv.ASharp, 'B': pitchEnv.B
        };
        
        const adjustedBaseFreq = baseFreq* pitchAdjustments[noteName] * pitchEnv.AllThemPitches;
        
        // Calculate frequency using custom octave ratio instead of fixed 2.0
        const freq = adjustedBaseFreq * Math.pow(pitchEnv.Octave, octave - 4);
        // console.log(`Base frequency for ${noteName}: ${baseFreq}, Adjusted: ${adjustedBaseFreq}, Octave: ${octave}, Frequency: ${freq}`);


        // console.log(`Parsed note: ${noteString}, Frequency: ${freq}, Octave: ${octave},`, pitchAdjustments, pitchEnv);
        return {
            note: noteString,
            oct: octave,
            freq: freq
        };
    };

    // Expose the programmatic functions to parent components
    useImperativeHandle(ref, () => ({
        playNotes: playNotesProgrammatic,
        stopNotes: stopNotesProgrammatic,
        stopAllNotes: stopAllNotesProgrammatic,
        isActive: () => synthActive,
        // Expose pitch controls for IntervalPractice synchronization
        getPitchValues: () => {
            // console.log('Getting pitch values:', pitchEnv);
            return {
                pitchC: pitchEnv.C,
                pitchCSharp: pitchEnv.CSharp,
                pitchD: pitchEnv.D,
                pitchDSharp: pitchEnv.DSharp,
                pitchE: pitchEnv.E,
                pitchF: pitchEnv.F, 
                pitchFSharp: pitchEnv.FSharp,
                pitchG: pitchEnv.G,
                pitchGSharp: pitchEnv.GSharp,
                pitchA: pitchEnv.A,
                pitchASharp: pitchEnv.ASharp,
                pitchB: pitchEnv.B,
                octaveRatio: pitchEnv.Octave,
                allThemPitches: pitchEnv.AllThemPitches
            };

            // console.log('Getting pitch values:', {
            //     pitchC, pitchCSharp, pitchD, pitchDSharp, pitchE, pitchF,
            //     pitchFSharp, pitchG, pitchGSharp, pitchA, pitchASharp, pitchB,
            //     octaveRatio, allThemPitches
            // });
            return {
                pitchC, pitchCSharp, pitchD, pitchDSharp, pitchE, pitchF,
                pitchFSharp, pitchG, pitchGSharp, pitchA, pitchASharp, pitchB,
                octaveRatio, allThemPitches
            };
        },
        setPitchValues: (values) => {
            // console.log('Setting pitch values:', values, pitchEnv);
            if (values.pitchC !== undefined) setPitchC(values.pitchC);
            if (values.pitchCSharp !== undefined) setPitchCSharp(values.pitchCSharp);
            if (values.pitchD !== undefined) setPitchD(values.pitchD);
            if (values.pitchDSharp !== undefined) setPitchDSharp(values.pitchDSharp);
            if (values.pitchE !== undefined) setPitchE(values.pitchE);
            if (values.pitchF !== undefined) setPitchF(values.pitchF);
            if (values.pitchFSharp !== undefined) setPitchFSharp(values.pitchFSharp);
            if (values.pitchG !== undefined) setPitchG(values.pitchG);
            if (values.pitchGSharp !== undefined) setPitchGSharp(values.pitchGSharp);
            if (values.pitchA !== undefined) setPitchA(values.pitchA);
            if (values.pitchASharp !== undefined) setPitchASharp(values.pitchASharp);
            if (values.pitchB !== undefined) setPitchB(values.pitchB);
            if (values.octaveRatio !== undefined) setOctaveRatio(values.octaveRatio);
            if (values.allThemPitches !== undefined) setAllThemPitches(values.allThemPitches);
            return pitchEnv;
        },
        resetMicrotonalPitches: () => {
            setPitchC(1.0);
            setPitchCSharp(1.0);
            setPitchD(1.0);
            setPitchDSharp(1.0);
            setPitchE(1.0);
            setPitchF(1.0);
            setPitchFSharp(1.0);
            setPitchG(1.0);
            setPitchGSharp(1.0);
            setPitchA(1.0);
            setPitchASharp(1.0);
            setPitchB(1.0);
            setOctaveRatio(2.0);
            setAllThemPitches(1.0);
        }
    }), [synthActive, pitchC, pitchCSharp, pitchD, pitchDSharp, pitchE, pitchF,
        pitchFSharp, pitchG, pitchGSharp, pitchA, pitchASharp, pitchB,
        octaveRatio, allThemPitches]);

    pitchEnv = {
        C: pitchC,
        CSharp: pitchCSharp,
        D: pitchD,      
        DSharp: pitchDSharp,
        E: pitchE,
        F: pitchF,
        FSharp: pitchFSharp,
        G: pitchG,
        GSharp: pitchGSharp,
        A: pitchA,
        ASharp: pitchASharp,
        B: pitchB,
        Octave: octaveRatio,
        AllThemPitches: allThemPitches
    };

    // Track active notes for regular (non-programmatic) note playing
    const regularActiveNotes = useRef(new Map()); // Maps note.note -> {synth, voiceId}

    // Function to delegate played notes to each of the synths
    const noteOn = (note) => {
        let targetSynth = null;
        
        if (!synthArr[synthPos].currentNote) {
            targetSynth = synthArr[synthPos];
        } else {
            const initialPos = synthPos;
            incrementSynthPos();

            while (synthPos !== initialPos) {
                if (!synthArr[synthPos].currentNote) break;
                incrementSynthPos();
            }
            targetSynth = synthArr[synthPos];
        }

        const voiceId = synthNoteOn(targetSynth, note);
        
        // Track this note for proper cleanup
        regularActiveNotes.current.set(note.note, {
            synth: targetSynth,
            voiceId: voiceId
        });

        incrementSynthPos();
    };
    
    const noteOff = (note) => {
        const noteInfo = regularActiveNotes.current.get(note.note);
        if (noteInfo) {
            synthNoteOff(noteInfo.synth, note, noteInfo.voiceId);
            regularActiveNotes.current.delete(note.note);
        } else {
            // Fallback to old method if note not found in tracking
            const targetSynths = synthArr.filter(synth => synth.currentNote === note.note);
            targetSynths.forEach(synth => synthNoteOff(synth));
        }
    };

    // Keyboard listeners
    // const keydownFunction = e => {
    //     if (e.repeat) return;
    //     if (!synthActive) activateSynth();

    //     // Additional commands
    //     switch (e.key) {
    //         case 'z': return octaveDown();
    //         case 'x': return octaveUp();
    //     };

    // const engageKeyboard = () => {
    //     window.addEventListener('keydown', keydownFunction);
    //     window.addEventListener('keyup', keyupFunction);
    // }
    // const disengageKeyboard = () => {
    //     window.removeEventListener('keydown', keydownFunction);
    //     window.removeEventListener('keyup', keyupFunction);
    // }

    // Init
    useLayoutEffect(() => {
        initSynth();
        
        // Cleanup function to prevent memory leaks
        return () => {
            // Stop all programmatic notes
            stopAllNotesProgrammatic();
            
            // Clear all synth timeouts and stop notes
            synthArr.forEach(synth => {
                synth.clearTimeouts();
                synth.noteStop();
            });
        };
    }, []);

    // Load Preset
    useLayoutEffect(() => {
        const preset = presetData[currentPreset];
        synthArr.forEach(synth => synth.noteStop());

        setPolyphony(preset.polyphony);
        setMasterVolume(preset.masterVolume);
        setPortamentoSpeed(preset.portamentoSpeed);
        setMasterFilterType(preset.masterFilterType);
        setMasterFilterFreq(preset.masterFilterFreq);
        setMasterFilterQ(preset.masterFilterQ);
        setMasterFilterGain(preset.masterFilterGain);
        setGainAttack(preset.gainAttack);
        setGainDecay(preset.gainDecay);
        // setGainHoldLevel(preset.setGainHoldLevel || 0);
        // setGainHold(preset.gainHold || 0);
        setGainSustain(preset.gainSustain);
        setGainRelease(preset.gainRelease);
        setVcoType(preset.vcoType);
        setFilterType(preset.filterType);
        setFilterFreq(preset.filterFreq);
        setFilterQ(preset.filterQ);
        setFilterGain(preset.filterGain);
        setFilterAttack(preset.filterAttack);
        setFilterDecay(preset.filterDecay);
        setFilterRelease(preset.filterRelease);
        setFilterEnvAmount(preset.filterEnvAmount);
        setDistortionAmount(preset.distortionAmount);
        setDistortionDist(preset.distortionDist);
        setFlangerAmount(preset.flangerAmount);
        setFlangerDepth(preset.flangerDepth);
        setFlangerRate(preset.flangerRate);
        setFlangerDelay(preset.flangerDelay);
        setFlangerFeedback(preset.flangerFeedback);
        setDelayAmount(preset.delayAmount);
        setDelayFeedback(preset.delayFeedback);
        setDelayTime(preset.delayTime);
        setDelayTone(preset.delayTone);
        setPingPongAmount(preset.pingPongAmount);
        setPingPongDelayTime(preset.pingPongDelayTime);
        setPingPongTone(preset.pingPongTone);
        setPingPongFeedback(preset.pingPongFeedback);
        setReverbType(preset.reverbType);
        setReverbAmount(preset.reverbAmount);
        setVibratoDepth(preset.vibratoDepth);
        setVibratoRate(preset.vibratoRate);
        setBitCrushAmount(preset.bitCrushAmount);
        setBitCrushDepth(preset.bitCrushDepth);
        setEqLowGain(preset.eqLowGain);
        setEqHighGain(preset.eqHighGain);
        setEqLowFreq(preset.eqLowFreq);
        setEqHighFreq(preset.eqHighFreq);

        // Load envelope shape settings with defaults
        setEnvelopeAttackShape(preset.envelopeAttackShape || 'exponential');
        setEnvelopeDecayShape(preset.envelopeDecayShape || 'exponential');
        setEnvelopeReleaseShape(preset.envelopeReleaseShape || 'exponential');
        setEnvelopeAttackExponent(preset.envelopeAttackExponent || 2);
        setEnvelopeDecayExponent(preset.envelopeDecayExponent || 2);
        setEnvelopeReleaseExponent(preset.envelopeReleaseExponent || 2);

        // Load filter envelope shape settings with defaults
        setFilterEnvelopeAttackShape(preset.filterEnvelopeAttackShape || 'exponential');
        setFilterEnvelopeDecayShape(preset.filterEnvelopeDecayShape || 'exponential');
        setFilterEnvelopeReleaseShape(preset.filterEnvelopeReleaseShape || 'exponential');
        setFilterEnvelopeAttackExponent(preset.filterEnvelopeAttackExponent || 2);
        setFilterEnvelopeDecayExponent(preset.filterEnvelopeDecayExponent || 2);
        setFilterEnvelopeReleaseExponent(preset.filterEnvelopeReleaseExponent || 2);

        // Load microtonal settings with defaults
        setPitchC(preset.pitchC || 1.0);
        setPitchCSharp(preset.pitchCSharp || 1.0);
        setPitchD(preset.pitchD || 1.0);
        setPitchDSharp(preset.pitchDSharp || 1.0);
        setPitchE(preset.pitchE || 1.0);
        setPitchF(preset.pitchF || 1.0);
        setPitchFSharp(preset.pitchFSharp || 1.0);
        setPitchG(preset.pitchG || 1.0);
        setPitchGSharp(preset.pitchGSharp || 1.0);
        setPitchA(preset.pitchA || 1.0);
        setPitchASharp(preset.pitchASharp || 1.0);
        setPitchB(preset.pitchB || 1.0);
        setOctaveRatio(preset.octaveRatio || 2.0);

        resetSynthPos();
    }, [currentPreset]);

    // Sync node values to the current state on change
    useLayoutEffect(() => {
        if (masterGain.getGain() !== masterVolume) masterGain.setGain(masterVolume);

        if (masterFilter.getType() !== masterFilterType) masterFilter.setType(masterFilterType);
        if (masterFilter.getFreq() !== masterFilterFreq) masterFilter.setFreq(masterFilterFreq);
        if (masterFilter.getQ() !== masterFilterQ) masterFilter.setQ(masterFilterQ);
        if (masterFilter.getGain() !== masterFilterGain) masterFilter.setGain(masterFilterGain);



        const synth1 = synthArr[0];
        if (synth1.getWaveform() !== vcoType) synthArr.forEach((synth) => synth.setWaveform(vcoType));
        if (synth1.getFilterType() !== filterType) synthArr.forEach((synth) => synth.setFilterType(filterType));
        if (synth1.getFilterFreq() !== filterFreq) synthArr.forEach((synth) => synth.setFilterFreq(filterFreq));
        if (synth1.getFilterQ() !== filterQ) synthArr.forEach((synth) => synth.setFilterQ(filterQ));
        if (synth1.getFilterGain() !== filterGain) synthArr.forEach((synth) => synth.setFilterGain(filterGain));

        if (masterDistortion.getAmount() !== distortionAmount) masterDistortion.setAmount(distortionAmount);
        if (masterDistortion.getDistortion() !== distortionDist) masterDistortion.setDistortion(distortionDist);

        if (masterFlanger.getAmount() !== flangerAmount) masterFlanger.setAmount(flangerAmount);
        if (masterFlanger.getDepth() !== flangerDepth) masterFlanger.setDepth(flangerDepth);
        if (masterFlanger.getRate() !== flangerRate) masterFlanger.setRate(flangerRate);
        if (masterFlanger.getFeedback() !== flangerFeedback) masterFlanger.setFeedback(flangerFeedback);
        if (masterFlanger.getDelay() !== flangerDelay) masterFlanger.setDelay(flangerDelay);

        if (masterDelay.getTone() !== delayTone) masterDelay.setTone(delayTone);
        if (masterDelay.getAmount() !== delayAmount) masterDelay.setAmount(delayAmount);
        if (masterDelay.getDelayTime() !== delayTime) masterDelay.setDelayTime(delayTime);
        if (masterDelay.getFeedback() !== delayFeedback) masterDelay.setFeedback(delayFeedback);

        if (masterPingPong.getDelayTime() !== pingPongDelayTime) masterPingPong.setDelayTime(pingPongDelayTime);
        if (masterPingPong.getFeedback() !== pingPongFeedback) masterPingPong.setFeedback(pingPongFeedback);
        if (masterPingPong.getTone() !== pingPongTone) masterPingPong.setTone(pingPongTone);
        if (masterPingPong.getAmount() !== pingPongAmount) masterPingPong.setAmount(pingPongAmount);

        if (masterReverb.getAmount() !== reverbAmount) masterReverb.setAmount(reverbAmount);
        if (masterReverb.getType() !== reverbType) masterReverb.setType(reverbType);

        if (masterBitCrush.getBitDepth() !== bitCrushDepth) masterBitCrush.setBitDepth(bitCrushDepth);
        if (masterBitCrush.getAmount() !== bitCrushAmount) masterBitCrush.setAmount(bitCrushAmount);

        if (vibratoLFO.getRate() !== vibratoRate) vibratoLFO.setRate(vibratoRate);
        if (vibratoLFO.getDepth() !== vibratoDepth) vibratoLFO.setDepth(vibratoDepth);

        if (masterEQ2.getLowGain() !== eqLowGain) masterEQ2.setLowGain(eqLowGain);
        if (masterEQ2.getHighGain() !== eqHighGain) masterEQ2.setHighGain(eqHighGain);
        if (masterEQ2.getLowFreq() !== eqLowFreq) masterEQ2.setLowFreq(eqLowFreq);
        if (masterEQ2.getHighFreq() !== eqHighFreq) masterEQ2.setHighFreq(eqHighFreq);
    }, [
        masterVolume, masterFilterType, masterFilterFreq, masterFilterQ, masterFilterGain, vcoType,
        filterType, filterFreq, filterQ, filterGain, distortionAmount, distortionDist, reverbType,
        reverbAmount, delayTime, delayFeedback, delayTone, delayAmount, vibratoDepth, vibratoRate,
        bitCrushDepth, bitCrushAmount, eqLowGain, eqHighGain, eqLowFreq, eqHighFreq,
        pingPongAmount, pingPongFeedback, pingPongDelayTime, pingPongTone,
        flangerAmount, flangerDelay, flangerDepth, flangerFeedback, flangerRate,
    ]);

    // Update frequencies of all playing notes when microtonal parameters change
    useLayoutEffect(() => {
        synthArr.forEach(synth => {
            if (synth.getCurrentNoteInfo()) {
                synth.updateNoteFrequency(pitchEnv);
            }
        });
    }, [
        pitchC, pitchCSharp, pitchD, pitchDSharp, pitchE, pitchF, pitchFSharp,
        pitchG, pitchGSharp, pitchA, pitchASharp, pitchB, octaveRatio, allThemPitches
    ]);

    // Needed to avoid stale hook state
    useEffect(() => {
        // engageKeyboard();
        // return disengageKeyboard;
    });

    return (
        <div className={`${BASE_CLASS_NAME} ${className}`.trim()}>
            <ModuleGridContainer>

                <Module label="VCO">
                    <KnobGrid columns={1} rows={1}>
                        <Select
                            label="Waveform"
                            options={WAVEFORM}
                            value={vcoType}
                            onUpdate={(val) => setVcoType(val)}
                        />
                    </KnobGrid>
                </Module>

                <Module label="Gain Envelope">
                    <KnobGrid columns={4} rows={2}>
                        <Knob
                            label="Attack"
                            value={gainAttack}
                            modifier={3}
                            onUpdate={(val) => setGainAttack(val)}
                        />
                        <Knob
                            label="Decay"
                            value={gainDecay}
                            modifier={3}
                            onUpdate={(val) => setGainDecay(val)}
                        />
                        <Knob
                            label="Sustain"
                            modifier={0.7}
                            value={gainSustain}
                            onUpdate={(val) => setGainSustain(val)}
                        />
                        <Knob
                            label="Release"
                            value={gainRelease}
                            modifier={3}
                            onUpdate={(val) => setGainRelease(val)}
                        />
                        <Knob
                            label="Hold"
                            value={gainHold}
                            modifier={3}
                            onUpdate={(val) => setGainHold(val)}
                        />
                        <Knob
                            label="Hold Level"
                            value={gainHoldLevel}
                            modifier={3}
                            onUpdate={(val) => setGainHoldLevel(val)}
                        />
                    </KnobGrid>
                </Module>

                <Module label="Envelope Shape">
                    <KnobGrid columns={3} rows={2}>
                        <Select
                            label="Attack"
                            options={ENVELOPE_SHAPE}
                            value={envelopeAttackShape}
                            onUpdate={(val) => setEnvelopeAttackShape(val)}
                        />
                        <Select
                            label="Decay"
                            options={ENVELOPE_SHAPE}
                            value={envelopeDecayShape}
                            onUpdate={(val) => setEnvelopeDecayShape(val)}
                        />
                        <Select
                            label="Release"
                            options={ENVELOPE_SHAPE}
                            value={envelopeReleaseShape}
                            onUpdate={(val) => setEnvelopeReleaseShape(val)}
                        />
                        <Knob
                            label="Attack Exp"
                            value={envelopeAttackExponent}
                            modifier={4}
                            offset={0.1}
                            resetValue={2}
                            decimalPlaces={1}
                            onUpdate={(val) => setEnvelopeAttackExponent(val)}
                        />
                        <Knob
                            label="Decay Exp"
                            value={envelopeDecayExponent}
                            modifier={4}
                            offset={0.1}
                            resetValue={2}
                            decimalPlaces={1}
                            onUpdate={(val) => setEnvelopeDecayExponent(val)}
                        />
                        <Knob
                            label="Release Exp"
                            value={envelopeReleaseExponent}
                            modifier={4}
                            offset={0.1}
                            resetValue={2}
                            decimalPlaces={1}
                            onUpdate={(val) => setEnvelopeReleaseExponent(val)}
                        />
                    </KnobGrid>
                </Module>

                
                <Module label="Delay">
                    <KnobGrid columns={2} rows={2}>
                        <Knob
                            label="Time"
                            value={delayTime}
                            onUpdate={(val) => setDelayTime(val)}
                        />
                        <Knob
                            label="Feedback"
                            value={delayFeedback}
                            onUpdate={(val) => setDelayFeedback(val)}
                        />
                        <Knob
                            label="Tone"
                            value={delayTone}
                            modifier={11000}
                            resetValue={4400}
                            isRounded
                            onUpdate={(val) => setDelayTone(val)}
                        />
                        <Knob
                            label="Dry/Wet"
                            value={delayAmount}
                            onUpdate={(val) => setDelayAmount(val)}
                        />
                    </KnobGrid>
                </Module>


                <Module label="Master Filter">
                    <KnobGrid columns={2} rows={2}>
                        <Select
                            label="Type"
                            options={FILTER}
                            value={masterFilterType}
                            onUpdate={(val) => setMasterFilterType(val)}
                        />
                        <Knob
                            label="Cutoff"
                            value={masterFilterFreq}
                            scalingType="logarithmic"
                            minValue={20}
                            maxValue={11020}
                            resetValue={11000}
                            isRounded
                            onUpdate={(val) => setMasterFilterFreq(val)}
                        />
                        <Knob
                            label="Q"
                            value={masterFilterQ}
                            modifier={20}
                            onUpdate={(val) => setMasterFilterQ(val)}
                        />
                        <Knob
                            label="Gain"
                            type="B"
                            value={masterFilterGain}
                            modifier={40}
                            onUpdate={(val) => setMasterFilterGain(val)}
                        />
                    </KnobGrid>
                </Module>


                <Module label="Vibrato">
                    <KnobGrid columns={1} rows={2}>
                        <Knob
                            label="Depth"
                            value={vibratoDepth}
                            modifier={200}
                            onUpdate={(val) => setVibratoDepth(val)}
                        />
                        <Knob
                            label="Rate"
                            value={vibratoRate}
                            modifier={50}
                            onUpdate={(val) => setVibratoRate(val)}
                        />
                    </KnobGrid>
                </Module>

                <Module label="Drive">
                    <KnobGrid columns={1} rows={2}>
                        <Knob
                            label="Distortion"
                            value={distortionDist}
                            modifier={30}
                            onUpdate={(val) => setDistortionDist(val)}
                        />
                        <Knob
                            label="Dry/Wet"
                            value={distortionAmount}
                            onUpdate={(val) => setDistortionAmount(val)}
                        />
                    </KnobGrid>
                </Module>

                <Module label="Master">
                    <KnobGrid columns={1} rows={1}>
                        <Knob
                            label="Volume"
                            value={masterVolume}
                            onUpdate={(val) => setMasterVolume(val)}
                        />
                    </KnobGrid>
                </Module>
                <Module label="Oscilloscope">
                    <Oscilloscope audioCtx={AC} sourceNode={masterGain} />
                </Module>



                <Module label="Voicing">
                    <KnobGrid columns={1} rows={2}>
                        <Knob
                            label="Polyphony"
                            value={polyphony}
                            modifier={7}
                            offset={1}
                            resetValue={8}
                            isRounded
                            onUpdate={(val) => {
                                setPolyphony(val);
                                resetSynthPos();
                            }}
                        />
                        <Knob
                            label="Portamento"
                            value={portamentoSpeed}
                            modifier={0.5}
                            onUpdate={(val) => setPortamentoSpeed(val)}
                            disabled={polyphony !== 1}
                        />
                    </KnobGrid>
                </Module>
                
                <Module label="Filter">
                    <KnobGrid columns={4} rows={2}>
                        <Select
                            label="Type"
                            options={FILTER}
                            value={filterType}
                            onUpdate={(val) => setFilterType(val)}
                        />
                        <Knob
                            label="Cutoff"
                            value={filterFreq}
                            scalingType="logarithmic"
                            minValue={20}
                            maxValue={11020}
                            resetValue={11000}
                            isRounded
                            onUpdate={(val) => setFilterFreq(val)}
                        />
                        <Knob
                            label="Q"
                            value={filterQ}
                            modifier={20}
                            onUpdate={(val) => setFilterQ(val)}
                        />
                        <Knob
                            label="Gain"
                            type="B"
                            value={filterGain}
                            modifier={40}
                            onUpdate={(val) => setFilterGain(val)}
                        />
                        <Knob
                            label="Attack"
                            value={filterAttack}
                            modifier={3}
                            onUpdate={(val) => setFilterAttack(val)}
                        />
                        <Knob
                            label="Decay"
                            value={filterDecay}
                            modifier={3}
                            onUpdate={(val) => setFilterDecay(val)}
                        />
                        <Knob
                            label="Release"
                            value={filterRelease}
                            modifier={3}
                            onUpdate={(val) => setFilterRelease(val)}
                        />
                        <Knob
                            label="Amount"
                            type="A"
                            modifier={11000}
                            scalingType="symmetric-log"
                            isRounded
                            value={filterEnvAmount}
                            onUpdate={(val) => setFilterEnvAmount(val)}
                        />
                    </KnobGrid>
                </Module>
                <Module label="Flanger">
                    <KnobGrid columns={4} rows={2}>
                        <Knob
                            label="Delay"
                            value={flangerDelay}
                            decimalPlaces={5}
                            modifier={0.015}
                            offset={0.005}
                            resetValue={0.01}
                            onUpdate={(val) => setFlangerDelay(val)}
                        />
                        <Knob
                            label="Depth"
                            value={flangerDepth}
                            decimalPlaces={5}
                            modifier={0.005}
                            onUpdate={(val) => setFlangerDepth(val)}
                        />
                        <Knob
                            label="Rate"
                            value={flangerRate}
                            modifier={2}
                            onUpdate={(val) => setFlangerRate(val)}
                        />
                        <Knob
                            label="Feedback"
                            value={flangerFeedback}
                            onUpdate={(val) => setFlangerFeedback(val)}
                        />
                        <Knob
                            label="Dry/Wet"
                            value={flangerAmount}
                            onUpdate={(val) => setFlangerAmount(val)}
                        />
                    </KnobGrid>
                </Module>

                <Module label="Ping Pong Delay">
                    <KnobGrid columns={2} rows={2}>
                        <Knob
                            label="Time"
                            value={pingPongDelayTime}
                            onUpdate={(val) => setPingPongDelayTime(val)}
                        />
                        <Knob
                            label="Feedback"
                            value={pingPongFeedback}
                            onUpdate={(val) => setPingPongFeedback(val)}
                        />
                        <Knob
                            label="Tone"
                            value={pingPongTone}
                            modifier={11000}
                            resetValue={4400}
                            isRounded
                            onUpdate={(val) => setPingPongTone(val)}
                        />
                        <Knob
                            label="Dry/Wet"
                            value={pingPongAmount}
                            onUpdate={(val) => setPingPongAmount(val)}
                        />
                    </KnobGrid>
                </Module>
                

                <Module label="EQ2">
                    <KnobGrid columns={2} rows={2}>
                        <Knob
                            label="Low Gain"
                            type="B"
                            modifier={24}
                            value={eqLowGain}
                            onUpdate={(val) => setEqLowGain(val)}
                        />
                        <Knob
                            label="High Gain"
                            type="B"
                            modifier={24}
                            value={eqHighGain}
                            onUpdate={(val) => setEqHighGain(val)}
                        />
                        <Knob
                            label="Low Freq"
                            modifier={640}
                            resetValue={320}
                            isRounded
                            value={eqLowFreq}
                            onUpdate={(val) => setEqLowFreq(val)}
                        />
                        <Knob
                            label="High Freq"
                            modifier={8600}
                            resetValue={3200}
                            offset={2400}
                            isRounded
                            value={eqHighFreq}
                            onUpdate={(val) => setEqHighFreq(val)}
                        />
                    </KnobGrid>
                </Module>

                <Module label="Reverb">
                    <KnobGrid columns={1} rows={2}>
                        <Select
                            label="Type"
                            options={REVERB}
                            value={reverbType}
                            onUpdate={(val) => setReverbType(val)}
                        />
                        <Knob
                            label="Dry/Wet"
                            value={reverbAmount}
                            onUpdate={(val) => setReverbAmount(val)}
                        />
                    </KnobGrid>
                </Module>
                <Module label="Crush">
                    <KnobGrid columns={1} rows={2}>
                        <Knob
                            label="Bit Depth"
                            value={bitCrushDepth}
                            modifier={14}
                            resetValue={8}
                            offset={2}
                            isRounded
                            onUpdate={(val) => setBitCrushDepth(val)}
                        />
                        <Knob
                            label="Dry/Wet"
                            value={bitCrushAmount}
                            onUpdate={(val) => setBitCrushAmount(val)}
                        />
                    </KnobGrid>
                </Module>

                <InfoModule>
                    <InfoContainer>
                        <PopText>Preset</PopText>
                        <InfoSelect
                            value={currentPreset}
                            onChange={(e) => {
                                setCurrentPreset(e.target.value);
                                e.target.blur();
                            }}
                        >
                            {Object.keys(presetData).map((preset) => (
                                <option key={`Preset_${preset}`} value={preset}>{preset}</option>
                            ))}
                        </InfoSelect>
                    </InfoContainer>
                    {/* <PeakMeter audioCtx={AC} sourceNode={masterGain} /> */}
                    <InfoContainer>
                        <PopText>- Theme -</PopText>
                        <InfoSelect
                            value={currentTheme}
                            onChange={(e) => {
                                setTheme(e.target.value);
                                localStorage.setItem('PolySynth-Theme', e.target.value);
                                e.target.blur();
                            }}
                        >
                            {Object.keys(THEMES).map(theme => (
                                <option key={`themes_${theme}`} value={theme}>{theme}</option>
                            ))}
                        </InfoSelect>
                    </InfoContainer>
                </InfoModule>

                <Module label="Spectrum">
                    <SpectrumAnalyzer audioCtx={AC} sourceNode={masterGain} />
                </Module>

                {/* <Lines /> */}

                <MicrotonalModule label="Microtonal">
                    <KnobGrid columns={15} rows={1}>
                        <Knob
                            label="C"
                            value={pitchC}
                            modifier={1.5}
                            offset={0.5}
                            resetValue={1.0}
                            decimalPlaces={3}
                            onUpdate={(val) => setPitchC(val)}
                        />
                        <Knob
                            label="C#"
                            value={pitchCSharp}
                            modifier={1.5}
                            offset={0.5}
                            resetValue={1.0}
                            decimalPlaces={3}
                            onUpdate={(val) => setPitchCSharp(val)}
                        />
                        <Knob
                            label="D"
                            value={pitchD}
                            modifier={1.5}
                            offset={0.5}
                            resetValue={1.0}
                            decimalPlaces={3}
                            onUpdate={(val) => setPitchD(val)}
                        />
                        <Knob
                            label="D#"
                            value={pitchDSharp}
                            modifier={1.5}
                            offset={0.5}
                            resetValue={1.0}
                            decimalPlaces={3}
                            onUpdate={(val) => setPitchDSharp(val)}
                        />
                        <Knob
                            label="E"
                            value={pitchE}
                            modifier={1.5}
                            offset={0.5}
                            resetValue={1.0}
                            decimalPlaces={3}
                            onUpdate={(val) => setPitchE(val)}
                        />
                        <Knob
                            label="F"
                            value={pitchF}
                            modifier={1.5}
                            offset={0.5}
                            resetValue={1.0}
                            decimalPlaces={3}
                            onUpdate={(val) => setPitchF(val)}
                        />
                        <Knob
                            label="F#"
                            value={pitchFSharp}
                            modifier={1.5}
                            offset={0.5}
                            resetValue={1.0}
                            decimalPlaces={3}
                            onUpdate={(val) => setPitchFSharp(val)}
                        />
                        <Knob
                            label="G"
                            value={pitchG}
                            modifier={1.5}
                            offset={0.5}
                            resetValue={1.0}
                            decimalPlaces={3}
                            onUpdate={(val) => setPitchG(val)}
                        />
                        <Knob
                            label="G#"
                            value={pitchGSharp}
                            modifier={1.5}
                            offset={0.5}
                            resetValue={1.0}
                            decimalPlaces={3}
                            onUpdate={(val) => setPitchGSharp(val)}
                        />
                        <Knob
                            label="A"
                            value={pitchA}
                            modifier={1.5}
                            offset={0.5}
                            resetValue={1.0}
                            decimalPlaces={3}
                            onUpdate={(val) => setPitchA(val)}
                        />
                        <Knob
                            label="A#"
                            value={pitchASharp}
                            modifier={1.5}
                            offset={0.5}
                            resetValue={1.0}
                            decimalPlaces={3}
                            onUpdate={(val) => setPitchASharp(val)}
                        />
                        <Knob
                            label="B"
                            value={pitchB}
                            modifier={1.5}
                            offset={0.5}
                            resetValue={1.0}
                            decimalPlaces={3}
                            onUpdate={(val) => setPitchB(val)}
                        />
                        <Knob
                            label="Octave Ratio"
                            value={octaveRatio}
                            modifier={2.0}
                            offset={1.0}
                            resetValue={2.0}
                            decimalPlaces={3}
                            onUpdate={(val) => setOctaveRatio(val)}
                        />
                        <Knob
                            label="All Them Pitches"
                            value={pitchEnv.AllThemPitches}
                            modifier={1.5}
                            offset={0.5}
                            resetValue={2.0}
                            decimalPlaces={3}
                            onUpdate={(val) => setAllThemPitches(val)}
                        />
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            <button 
                                onClick={resetMicrotonalPitches}
                                style={{
                                    padding: '8px 12px',
                                    fontSize: '11px',
                                    border: '1px solid #666',
                                    borderRadius: '4px',
                                    background: '#333',
                                    color: '#fff',
                                    cursor: 'pointer',
                                    fontFamily: 'inherit'
                                }}
                                onMouseOver={(e) => e.target.style.background = '#555'}
                                onMouseOut={(e) => e.target.style.background = '#333'}
                            >
                                Reset All
                            </button>
                        </div>
                    </KnobGrid>
                </MicrotonalModule>
                <Module label="Spectrogram">
                    <Spectrogram audioCtx={AC} sourceNode={masterGain} />
                </Module>



            </ModuleGridContainer>
        </div>
    );
});

PolySynth.propTypes = {
    className: PropTypes.string,
    currentTheme: PropTypes.string.isRequired,
    setTheme: PropTypes.func.isRequired,
};

PolySynth.defaultProps = {
    className: '',
};

export default PolySynth;
