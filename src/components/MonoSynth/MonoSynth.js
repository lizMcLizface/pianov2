import { Oscillator, Gain, Filter, NoiseGenerator, OscNoiseMixer, StereoPanner } from '../../nodes';
import { clamp, minTime } from '../../util/util';

// Monophonic Synth Class with Voice Spreading Support
class MonoSynth {
    constructor(AC) {
        this.AC = AC;

        // Voice spreading parameters
        this.voiceCount = 1;
        this.detuneSpread = 0;
        this.stereoSpread = 0;
        
        // Multiple oscillators for voice spreading
        this.oscillators = [];
        this.oscillatorPanners = [];
        this.oscillatorMixer = new Gain(this.AC); // Mix multiple oscillators
        
        // Initialize with one oscillator
        this.initializeOscillators(1);
        
        this.noiseGen = new NoiseGenerator(this.AC);
        this.noiseFilter = new Filter(this.AC); // Bandpass filter for noise
        this.mixer = new OscNoiseMixer(this.AC);
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
        
        // Noise filter settings
        this.noiseFilterEnabled = false;
        this.noiseFilterQ = 1;
        
        // Track initialization state
        this.isInitialized = false;
    }

    initializeOscillators(count) {
        // If we need fewer oscillators, disconnect and clean up the extras
        if (count < this.oscillators.length) {
            for (let i = count; i < this.oscillators.length; i++) {
                try {
                    // Disconnect oscillator from panner first
                    if (this.oscillators[i] && this.oscillatorPanners[i]) {
                        this.oscillators[i].disconnect();
                    }
                } catch (e) {
                    console.warn('Failed to disconnect oscillator:', e);
                }
                
                try {
                    // Disconnect panner from mixer
                    if (this.oscillatorPanners[i]) {
                        this.oscillatorPanners[i].disconnect();
                    }
                } catch (e) {
                    console.warn('Failed to disconnect panner:', e);
                }
                
                try {
                    // Reset frequency of disconnected oscillators to prevent weird states
                    if (this.oscillators[i]) {
                        this.oscillators[i].setFreq(440);
                    }
                } catch (e) {
                    console.warn('Failed to reset oscillator frequency:', e);
                }
            }
            this.oscillators = this.oscillators.slice(0, count);
            this.oscillatorPanners = this.oscillatorPanners.slice(0, count);
        }
        
        // If we need more oscillators, create them
        while (this.oscillators.length < count) {
            const osc = new Oscillator(this.AC);
            const panner = new StereoPanner(this.AC);
            
            this.oscillators.push(osc);
            this.oscillatorPanners.push(panner);
            
            // Connect: oscillator -> panner -> mixer
            osc.connect(panner.getNode());
            panner.connect(this.oscillatorMixer.getNode());
            
            // Start the new oscillator only if init has already been called
            if (this.isInitialized) {
                try {
                    osc.start();
                } catch (e) {
                    console.warn('Failed to start oscillator:', e);
                }
            }
        }
        
        // Adjust mixer gain based on voice count to prevent clipping
        // Use a gentler gain reduction - only reduce by 20% per additional voice after the first
        const gainReduction = count === 1 ? 1.0 : 1.0 / (1 + (count - 1) * 0.2);
        this.oscillatorMixer.setGain(gainReduction);
        
        this.voiceCount = count;
        
        // Force immediate update of detuning and stereo spread
        this.updateVoiceDetuning();
        this.updateStereoSpread();
        
        // Reconnect vibrato if it was previously connected
        if (this.vibratoLFO) {
            this.connectVibratoToAll(this.vibratoLFO);
        }
    }

    updateVoiceDetuning() {
        if (this.oscillators.length <= 1) {
            // Single oscillator, ensure it's not detuned
            if (this.oscillators[0]) {
                if (this.currentNoteInfo) {
                    // If a note is playing, set to base frequency with no detune
                    this.setOscillatorFrequency(this.oscillators[0], 0, 0.001); // Very short ramp
                } else {
                    // If no note is playing, reset to a standard frequency to clear any detune
                    // Use smooth ramp to prevent clicks
                    try {
                        this.oscillators[0].setFreq(440, 0.002); // 2ms ramp
                    } catch (e) {
                        console.warn('Failed to reset single oscillator frequency:', e);
                    }
                }
            }
            return;
        }

        // Calculate detune values for multiple oscillators
        const centerIndex = (this.oscillators.length - 1) / 2;
        
        this.oscillators.forEach((osc, index) => {
            if (!this.currentNoteInfo) return;
            
            // Calculate detune offset from center
            // For even number of oscillators, spread them symmetrically
            let detuneOffset = 0;
            if (this.oscillators.length > 1 && this.detuneSpread > 0) {
                if (this.oscillators.length === 2) {
                    // Special case for 2 oscillators: -spread/2 and +spread/2
                    detuneOffset = (index - 0.5) * this.detuneSpread;
                } else {
                    // For 3+ oscillators: spread evenly across the range
                    detuneOffset = (index - centerIndex) * (this.detuneSpread / centerIndex);
                }
            }
            
            // Clamp detune to reasonable range to prevent frequency issues
            detuneOffset = Math.max(-1200, Math.min(1200, detuneOffset)); // ±1 octave max
            
            this.setOscillatorFrequency(osc, detuneOffset, 0.001); // Very short ramp for detuning
        });
    }

    updateStereoSpread() {
        if (this.oscillatorPanners.length <= 1) {
            // Single oscillator, ensure it's centered
            if (this.oscillatorPanners[0]) {
                try {
                    this.oscillatorPanners[0].setPan(0); // Force center position
                } catch (e) {
                    console.warn('Failed to center single oscillator pan:', e);
                }
            }
            return;
        }

        // Distribute oscillators across the stereo field
        this.oscillatorPanners.forEach((panner, index) => {
            let panPosition = 0;
            
            if (this.oscillatorPanners.length === 2) {
                // Special case for 2 oscillators: -0.5 and +0.5
                panPosition = (index - 0.5) * 2; // -1 and +1
            } else {
                // For 3+ oscillators: spread evenly from -1 to +1
                panPosition = (index / (this.oscillatorPanners.length - 1) - 0.5) * 2;
            }
            
            const scaledPan = panPosition * (this.stereoSpread / 100); // Scale by spread amount
            const clampedPan = Math.max(-1, Math.min(1, scaledPan)); // Clamp to valid range
            
            try {
                panner.setPan(clampedPan);
            } catch (e) {
                console.warn('Failed to set pan position:', e);
            }
        });
    }

    setOscillatorFrequency(oscillator, detuneInCents, rampTime = 0.002) {
        if (!this.currentNoteInfo || !oscillator) return;
        
        const { baseFreq_ } = this.currentNoteInfo;
        
        // Validate base frequency
        if (!baseFreq_ || baseFreq_ <= 0 || !isFinite(baseFreq_)) {
            console.warn('Invalid base frequency:', baseFreq_);
            return;
        }
        
        // Validate detune amount
        if (!isFinite(detuneInCents)) {
            console.warn('Invalid detune amount:', detuneInCents);
            return;
        }
        
        const detuneRatio = Math.pow(2, detuneInCents / 1200); // Convert cents to frequency ratio
        const detunedFreq = baseFreq_ * detuneRatio;
        
        // Validate final frequency
        if (!isFinite(detunedFreq) || detunedFreq <= 0 || detunedFreq > 20000) {
            console.warn('Invalid detuned frequency:', detunedFreq, 'base:', baseFreq_, 'detune:', detuneInCents);
            return;
        }
        
        try {
            // Use small ramp time to prevent clicks/cracks
            oscillator.setFreq(detunedFreq, rampTime);
        } catch (e) {
            console.warn('Failed to set oscillator frequency:', e);
        }
    }

    init() {
        console.log('MonoSynth init - connecting audio nodes');
        
        // Set up noise filter as bandpass with bypass capability
        this.noiseFilter.setType('bandpass');
        this.noiseFilter.setFreq(440); // Default frequency
        this.noiseFilter.setQ(this.noiseFilterQ);
        
        // Create a static audio routing that doesn't change:
        // Noise -> NoiseFilter -> Mixer (always)
        // We'll control the bypass via the filter's gain instead of reconnecting
        this.noiseGen.connect(this.noiseFilter.getNode());
        
        // Connect oscillator mixer and filtered noise to main mixer
        this.mixer.connectOscillator(this.oscillatorMixer.getNode());
        this.mixer.connectNoise(this.noiseFilter.getNode());
        
        console.log('Connected oscillator mixer and filtered noise to mixer');
        
        // Start all oscillators
        this.oscillators.forEach(osc => {
            try {
                osc.start();
            } catch (e) {
                console.warn('Oscillator already started:', e);
            }
        });
        
        // Connect mixer to gain and filter chain
        this.mixer.connect(this.gain.getNode());
        this.gain.connect(this.filter.getNode());
        this.filter.connect(this.volume.getNode());

        this.volume.setGain(0.2);
        this.gain.setGain(0);
        
        // Initialize filter state
        this.updateNoiseFilterBypass();
        
        // Mark as initialized
        this.isInitialized = true;
        
        console.log('MonoSynth audio chain connected');
    }

    // Voice spreading methods
    setVoiceCount(count) {
        const clampedCount = Math.max(1, Math.min(8, Math.round(count))); // Limit to 1-8 voices
        if (clampedCount !== this.voiceCount) {
            this.initializeOscillators(clampedCount);
            
            // Reset oscillator states to prevent detuned artifacts
            // Use a small delay to ensure oscillator initialization is complete
            setTimeout(() => {
                this.resetOscillatorStates();
            }, 10);
        }
    }

    setDetuneSpread(spreadInCents) {
        this.detuneSpread = Math.max(0, Math.min(100, spreadInCents)); // Limit to 0-100 cents
        // Use very short ramp when updating detuning to prevent clicks
        this.updateVoiceDetuning();
    }

    setStereoSpread(spreadPercent) {
        this.stereoSpread = Math.max(0, Math.min(100, spreadPercent)); // Limit to 0-100%
        this.updateStereoSpread();
    }

    // Method to reset all oscillators to clean state (useful when switching voice counts)
    resetOscillatorStates() {
        this.oscillators.forEach(osc => {
            try {
                // Reset to standard frequency with smooth ramp to prevent clicks
                osc.setFreq(440, 0.005); // 5ms ramp
            } catch (e) {
                console.warn('Failed to reset oscillator state:', e);
            }
        });
        
        // Small delay to allow frequency ramp to complete, then update detuning
        setTimeout(() => {
            this.updateVoiceDetuning();
            this.updateStereoSpread();
        }, 10);
    }

    // Connect vibrato LFO to all oscillators
    connectVibratoToAll(vibratoLFO) {
        this.vibratoLFO = vibratoLFO; // Store reference for later use
        this.oscillators.forEach(osc => {
            try {
                const oscNode = osc.getOscillatorNode();
                // Disconnect any existing vibrato connections first
                if (oscNode && oscNode.detune) {
                    vibratoLFO.connect(oscNode.detune);
                }
            } catch (e) {
                console.warn('Failed to connect vibrato to oscillator:', e);
            }
        });
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
    getNode = () => this.oscillatorMixer.getNode(); // Return the oscillator mixer instead of single osc
    getOscillatorNode = () => this.oscillators[0]?.getOscillatorNode(); // Return first oscillator for compatibility
    getWaveform = () => this.oscillators[0]?.getType() || 'sine';
    getDutyCycle = () => this.oscillators[0]?.getDutyCycle() || 0.5;
    getFilterType = () => this.filter.getType();
    getFilterFreq = () => this.filter.getFreq();
    getFilterQ = () => this.filter.getQ();
    getFilterGain = () => this.filter.getGain();
    getCurrentNoteInfo = () => this.currentNoteInfo;

    // Parameter setters - apply to all oscillators
    setVolume = (val) => this.volume.setGain(clamp(val, 0, 1));
    setWaveform = (type) => {
        this.oscillators.forEach(osc => osc.setType(type));
    };
    setDutyCycle = (val) => {
        this.oscillators.forEach(osc => osc.setDutyCycle(val));
    };
    setFilterType = (val) => this.filter.setType(val);
    setFilterFreq = (val) => this.filter.setFreq(val);
    setFilterQ = (val) => this.filter.setQ(val);
    setFilterGain = (val) => this.filter.setGain(val);
    
    // Noise-related methods
    setNoiseType = (type) => {
        // console.log('MonoSynth setNoiseType:', type);
        this.noiseGen.setNoiseType(type);
    };
    setNoiseMix = (ratio) => {
        // console.log('MonoSynth setNoiseMix:', ratio);
        this.mixer.setMixRatio(ratio);
    };
    setNoiseGain = (gain) => {
        // console.log('MonoSynth setNoiseGain:', gain);
        this.noiseGen.setGain(gain);
    };
    
    // Noise filter methods
    setNoiseFilterEnabled = (enabled) => {
        this.noiseFilterEnabled = enabled;
        this.updateNoiseFilterBypass();
    };
    
    setNoiseFilterQ = (q) => {
        this.noiseFilterQ = q;
        this.noiseFilter.setQ(q);
    };
    
    updateNoiseFilterBypass = () => {
        if (this.noiseFilterEnabled) {
            // Enable filtering - set normal Q and frequency
            this.noiseFilter.setQ(this.noiseFilterQ);
            this.updateNoiseFilterFrequency();
        } else {
            // Bypass filtering - set very low Q and wide frequency to make filter transparent
            this.noiseFilter.setQ(0.1); // Very low Q = very wide, transparent filter
            this.noiseFilter.setFreq(1000); // Mid frequency when bypassed
        }
        // console.log('Noise filter', this.noiseFilterEnabled ? 'enabled' : 'bypassed');
    };
    
    updateNoiseFilterFrequency = () => {
        if (this.noiseFilterEnabled && this.currentNoteInfo) {
            const { baseFreq_ } = this.currentNoteInfo;
            this.noiseFilter.setFreq(baseFreq_);
            console.log('Updated noise filter frequency to:', baseFreq_);
        }
    };

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
        
        // Update the stored frequency and apply to all oscillators with detuning
        this.currentNoteInfo.baseFreq_ = newFreq;
        this.updateVoiceDetuning();
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
            octave: oct || parseInt(note.match(/\d+$/)?.[0]) || 4,
            baseFreq_: freq // Store the actual frequency for noise filter
        };
        
        // Update noise filter frequency if enabled
        this.updateNoiseFilterFrequency();
        
        // Set frequency for all oscillators with detuning and portamento
        this.oscillators.forEach((osc, index) => {
            if (this.oscillators.length <= 1) {
                // Single oscillator, no detuning
                osc.setFreq(freq, portamentoSpeed);
            } else {
                // Multiple oscillators with detuning
                let detuneOffset = 0;
                if (this.detuneSpread > 0) {
                    if (this.oscillators.length === 2) {
                        // Special case for 2 oscillators: -spread/2 and +spread/2
                        detuneOffset = (index - 0.5) * this.detuneSpread;
                    } else {
                        // For 3+ oscillators: spread evenly across the range
                        const centerIndex = (this.oscillators.length - 1) / 2;
                        detuneOffset = (index - centerIndex) * (this.detuneSpread / centerIndex);
                    }
                }
                
                // Clamp detune to reasonable range
                detuneOffset = Math.max(-1200, Math.min(1200, detuneOffset));
                
                const detuneRatio = Math.pow(2, detuneOffset / 1200);
                const detunedFreq = freq * detuneRatio;
                
                // Validate frequency before setting
                if (isFinite(detunedFreq) && detunedFreq > 0 && detunedFreq <= 20000) {
                    osc.setFreq(detunedFreq, portamentoSpeed);
                } else {
                    console.warn('Invalid detuned frequency in noteOn:', detunedFreq);
                    osc.setFreq(freq, portamentoSpeed); // Fallback to base frequency
                }
            }
        });

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
