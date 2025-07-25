import { Oscillator, Gain, Filter } from '../../nodes';
import { clamp, minTime } from '../../util/util';

// Monophonic Synth Class
class MonoSynth {
    constructor(AC) {
        this.AC = AC;

        this.osc = new Oscillator(this.AC);
        this.gain = new Gain(this.AC); // AHDSR Gain
        this.volume = new Gain(this.AC); // Volume
        this.filter = new Filter(this.AC);

        this.currentNote = null;
        this.currentNoteInfo = null; // Store full note info for microtonal updates
        this.timeoutIds = [];
        this.isInHoldPhase = false;
        this.holdPhaseEndTime = null;
        this.currentHoldLevel = 1; // Store hold level for use in noteOff
        this.voiceId = null; // Unique identifier for the current voice session
        this.voiceIdCounter = 0; // Counter for generating unique voice IDs
    }

    init() {
        this.osc.connect(this.gain.getNode());
        this.gain.connect(this.filter.getNode());
        this.filter.connect(this.volume.getNode());

        this.volume.setGain(0.2);
        this.gain.setGain(0);
        this.osc.start();
    }

    connect = (destination) => {
        if (Array.isArray(destination)) {
            destination.forEach((dest) => this.volume.connect(dest));
        } else {
            this.volume.connect(destination);
        }
    }

    clearTimeouts() {
        this.timeoutIds.forEach((id) => clearTimeout(id));
        this.timeoutIds = [];
        this.isInHoldPhase = false;
        this.holdPhaseEndTime = null;
    }

    // Getters
    getNode = () => this.osc.getNode();
    getWaveform = () => this.osc.getType();
    getFilterType = () => this.filter.getType();
    getFilterFreq = () => this.filter.getFreq();
    getFilterQ = () => this.filter.getQ();
    getFilterGain = () => this.filter.getGain();
    getCurrentNoteInfo = () => this.currentNoteInfo;

    // Parameter setters
    setVolume = (val) => this.volume.setGain(clamp(val, 0, 1));
    setWaveform = (type) => this.osc.setType(type);
    setFilterType = (val) => this.filter.setType(val);
    setFilterFreq = (val) => this.filter.setFreq(val);
    setFilterQ = (val) => this.filter.setQ(val);
    setFilterGain = (val) => this.filter.setGain(val);

    // Update frequency for microtonal adjustments
    updateNoteFrequency = (pitchEnv) => {
        if (!this.currentNoteInfo) return;
        
        const { noteName, baseFreq_, octave } = this.currentNoteInfo;
        
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



        // Apply microtonal pitch adjustments
        const pitchAdjustments = {
            'C': pitchEnv.C, 'C#': pitchEnv.CSharp, 'D': pitchEnv.D, 'D#': pitchEnv.DSharp,
            'E': pitchEnv.E, 'F': pitchEnv.F, 'F#': pitchEnv.FSharp, 'G': pitchEnv.G,
            'G#': pitchEnv.GSharp, 'A': pitchEnv.A, 'A#': pitchEnv.ASharp, 'B': pitchEnv.B
        };
        
        const adjustedBaseFreq = baseFreq * pitchAdjustments[noteName] * pitchEnv.AllThemPitches;
        
        // Calculate frequency using custom octave ratio
        const newFreq = adjustedBaseFreq * Math.pow(pitchEnv.Octave, octave - 4);
        
        // Update oscillator frequency
        this.osc.setFreq(newFreq);
    };

    // Note trigger methods
    noteOn = (noteInfo, synthProps) => {
        if (!noteInfo) return;

        // Clear any existing timeouts and generate new voice ID
        this.clearTimeouts();
        this.voiceId = ++this.voiceIdCounter;
        const currentVoiceId = this.voiceId; // Capture current voice ID for closures
        
        const { freq, note, oct } = noteInfo;
        const { gainEnv, filterEnv, portamentoSpeed } = synthProps;

        this.currentNote = note;
        
        // Store note info for microtonal updates
        // Extract note name from full note string (e.g., "C4" -> "C")
        const noteName = note.replace(/\d+$/, '');
        const baseFreq = {
            'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
            'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
            'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
        }[noteName];
        
        this.currentNoteInfo = {
            noteName: noteName,
            baseFreq: baseFreq,
            octave: oct || parseInt(note.match(/\d+$/)?.[0]) || 4
        };
        
        this.osc.setFreq(freq, portamentoSpeed);

        // console.log('MonoSynth noteOn:', note, 'Freq:', freq, 'gainEnv:', gainEnv, 'filterEnv:', filterEnv);
        
        // Determine hold level (use holdLevel if set and non-zero, otherwise use 1 as default attack level)
        const hasHold = gainEnv.hold && gainEnv.hold > 0;
        const holdLevel = hasHold ? gainEnv.holdLevel : 1;
        this.currentHoldLevel = holdLevel; // Store for use in noteOff
        
        // Gain Envelope AHDSR (R is in noteOff())
        if (gainEnv.a) {
            // console.log('MonoSynth gainEnv.a:', gainEnv.a, 'holdLevel:', holdLevel, 'hasHold:', hasHold);
            this.gain.setGainCurve(this.gain.getGain(), 0, 0); // Reset Volume immediately
            const attackTime = Math.max(gainEnv.a, minTime);
            this.gain.setGainCurve(0, holdLevel, attackTime, gainEnv.attackShape, gainEnv.attackExponent); // Attack to hold level

            if (hasHold) {
                // Attack -> Hold -> Decay -> Sustain
                // console.log('MonoSynth gainEnv.hold:', gainEnv.hold, 'gainEnv.d:', gainEnv.d);
                const attackTimeoutId = setTimeout(() => {
                    // Check if this voice is still active
                    if (this.voiceId !== currentVoiceId) return;
                    
                    // Hold phase - maintain hold level
                    this.isInHoldPhase = true;
                    this.holdPhaseEndTime = Date.now() + (gainEnv.hold * 1000);
                    
                    const holdTimeoutId = setTimeout(() => {
                        // Check if this voice is still active
                        if (this.voiceId !== currentVoiceId) return;
                        
                        this.isInHoldPhase = false;
                        this.holdPhaseEndTime = null;
                        const decayTime = Math.max(gainEnv.d, minTime);
                        this.gain.setGainCurve(holdLevel, gainEnv.s, decayTime, gainEnv.decayShape, gainEnv.decayExponent); // Decay from hold level to sustain
                    }, (gainEnv.hold * 1000));
                    this.timeoutIds.push(holdTimeoutId);
                }, (attackTime * 1000));
                this.timeoutIds.push(attackTimeoutId);
            } else {
                // Traditional ADSR: Attack -> Decay -> Sustain
                const timeoutId = setTimeout(() => {
                    // Check if this voice is still active
                    if (this.voiceId !== currentVoiceId) return;
                    
                    const decayTime = Math.max(gainEnv.d, minTime);
                    this.gain.setGainCurve(holdLevel, gainEnv.s, decayTime, gainEnv.decayShape, gainEnv.decayExponent); // Decay from hold level to sustain
                }, (attackTime * 1000));
                this.timeoutIds.push(timeoutId);
            }
        } else if (gainEnv.d) {
            // console.log('MonoSynth gainEnv.d:', gainEnv.d, 'holdLevel:', holdLevel);
            this.gain.setGainCurve(this.gain.getGain(), holdLevel, 0); // Reset to hold level immediately

            const timeoutId = setTimeout(() => {
                // Check if this voice is still active
                if (this.voiceId !== currentVoiceId) return;
                
                const decayTime = Math.max(gainEnv.d, minTime);
                this.gain.setGainCurve(holdLevel, gainEnv.s, decayTime, gainEnv.decayShape, gainEnv.decayExponent); // Decay
            }, (minTime * 1000));
            this.timeoutIds.push(timeoutId);
        } else if (gainEnv.s) {
            // console.log('MonoSynth gainEnv.s:', gainEnv.s);
            this.gain.setGainCurve(this.gain.getGain(), gainEnv.s, 0); // Set Volume immediately
        }

        // Filter Envelope ADS (R is in noteOff())
        if (filterEnv.amount) {
            if (filterEnv.a) {
                this.filter.setDetune(0, 0); // Reset Detune
                const attackTime = Math.max(filterEnv.a, minTime);
                this.filter.setDetune(filterEnv.amount, attackTime); // Attack

                const timeoutId = setTimeout(() => {
                    // Check if this voice is still active
                    if (this.voiceId !== currentVoiceId) return;
                    
                    this.filter.setDetune(0, Math.max(filterEnv.d, minTime)); // Decay
                }, (attackTime * 1000));
                this.timeoutIds.push(timeoutId);
            } else if (filterEnv.d) {
                this.filter.setDetune(filterEnv.amount, 0); // Reset Detune
                this.filter.setDetune(0, Math.max(filterEnv.d, minTime)); // Decay
            }
        }
        
        return currentVoiceId; // Return voice ID for caller to track
    }
    noteOff = ({ gainEnv, filterEnv }, voiceId = null) => {
        // If voiceId is provided, only process if it matches current voice
        if (voiceId !== null && this.voiceId !== voiceId) {
            console.log('MonoSynth noteOff ignored - voice ID mismatch. Current:', this.voiceId, 'Requested:', voiceId);
            return;
        }
        
        const currentVoiceId = this.voiceId; // Capture current voice ID for closures
        
        if (this.isInHoldPhase && this.holdPhaseEndTime) {
            // We're in hold phase - schedule decay->sustain->release after hold completes
            const remainingHoldTime = Math.max(0, this.holdPhaseEndTime - Date.now());
            // console.log('MonoSynth noteOff during hold phase, remaining hold time:', remainingHoldTime);
            
            const holdCompleteTimeoutId = setTimeout(() => {
                // Check if this voice is still active
                if (this.voiceId !== currentVoiceId) return;
                
                // Hold phase completed, now do decay to sustain
                this.isInHoldPhase = false;
                this.holdPhaseEndTime = null;
                
                if (gainEnv.d && gainEnv.d > 0) {
                    // Has decay phase - decay from hold level to sustain
                    // console.log('MonoSynth decay after hold, decay time:', gainEnv.d, 'sustain level:', gainEnv.s);
                    const decayTime = Math.max(gainEnv.d, minTime);
                    this.gain.setGainCurve(this.currentHoldLevel, gainEnv.s, decayTime, gainEnv.decayShape, gainEnv.decayExponent);
                    
                    // Then release after decay completes
                    const releaseTimeoutId = setTimeout(() => {
                        // Check if this voice is still active
                        if (this.voiceId !== currentVoiceId) return;
                        
                        this.currentNote = null;
                        this.currentNoteInfo = null;
                        const releaseTime = Math.max(gainEnv.r, minTime);
                        this.gain.setGainCurve(gainEnv.s, 0, releaseTime, gainEnv.releaseShape, gainEnv.releaseExponent); // Release
                        this.filter.setDetune(0, Math.max(filterEnv.r, minTime)); // Release
                    }, Math.max(gainEnv.d, minTime) * 1000);
                    this.timeoutIds.push(releaseTimeoutId);
                } else {
                    // No decay phase - go directly to release from hold level
                    // console.log('MonoSynth no decay, direct release from hold level');
                    this.currentNote = null;
                    this.currentNoteInfo = null;
                    const releaseTime = Math.max(gainEnv.r, minTime);
                    this.gain.setGainCurve(this.currentHoldLevel, 0, releaseTime, gainEnv.releaseShape, gainEnv.releaseExponent); // Release
                    this.filter.setDetune(0, Math.max(filterEnv.r, minTime)); // Release
                }
            }, remainingHoldTime);
            this.timeoutIds.push(holdCompleteTimeoutId);
        } else {
            // Normal release - not in hold phase
            this.clearTimeouts();
            this.currentNote = null;
            this.currentNoteInfo = null;
            const releaseTime = Math.max(gainEnv.r, minTime);
            this.gain.setGainCurve(this.gain.getGain(), 0, releaseTime, gainEnv.releaseShape, gainEnv.releaseExponent); // Release
            this.filter.setDetune(0, Math.max(filterEnv.r, minTime)); // Release
        }
    }
    noteStop = (voiceId = null) => {
        // If voiceId is provided, only process if it matches current voice
        if (voiceId !== null && this.voiceId !== voiceId) {
            console.log('MonoSynth noteStop ignored - voice ID mismatch. Current:', this.voiceId, 'Requested:', voiceId);
            return;
        }
        
        const currentVoiceId = this.voiceId; // Capture current voice ID for closures
        
        if (this.isInHoldPhase && this.holdPhaseEndTime) {
            // Even for noteStop, respect the hold phase
            const remainingHoldTime = Math.max(0, this.holdPhaseEndTime - Date.now());
            // console.log('MonoSynth noteStop during hold phase, remaining hold time:', remainingHoldTime);
            
            const holdCompleteTimeoutId = setTimeout(() => {
                // Check if this voice is still active
                if (this.voiceId !== currentVoiceId) return;
                
                this.clearTimeouts();
                this.currentNote = null;
                this.currentNoteInfo = null;
                this.gain.setGainCurve(this.gain.getGain(), 0, 0); // Immediate stop
                this.filter.setDetune(0, minTime);
            }, remainingHoldTime);
            
            // Clear existing timeouts but keep the hold completion timeout
            this.timeoutIds.forEach((id) => clearTimeout(id));
            this.timeoutIds = [holdCompleteTimeoutId];
        } else {
            // Normal immediate stop
            this.clearTimeouts();
            this.currentNote = null;
            this.currentNoteInfo = null;
            this.gain.setGainCurve(this.gain.getGain(), 0, 0); // Immediate stop
            this.filter.setDetune(0, minTime);
        }
    }
}

export default MonoSynth;
