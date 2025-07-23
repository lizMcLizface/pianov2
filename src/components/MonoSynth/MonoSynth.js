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
        this.timeoutIds = [];
        this.isInHoldPhase = false;
        this.holdPhaseEndTime = null;
        this.currentHoldLevel = 1; // Store hold level for use in noteOff
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

    // Parameter setters
    setVolume = (val) => this.volume.setGain(clamp(val, 0, 1));
    setWaveform = (type) => this.osc.setType(type);
    setFilterType = (val) => this.filter.setType(val);
    setFilterFreq = (val) => this.filter.setFreq(val);
    setFilterQ = (val) => this.filter.setQ(val);
    setFilterGain = (val) => this.filter.setGain(val);

    // Note trigger methods
    noteOn = (noteInfo, synthProps) => {
        if (!noteInfo) return;

        this.clearTimeouts();
        const { freq, note } = noteInfo;
        const { gainEnv, filterEnv, portamentoSpeed } = synthProps;

        this.currentNote = note;
        this.osc.setFreq(freq, portamentoSpeed);

        console.log('MonoSynth noteOn:', note, 'Freq:', freq, 'gainEnv:', gainEnv, 'filterEnv:', filterEnv);
        
        // Determine hold level (use holdLevel if set and non-zero, otherwise use 1 as default attack level)
        const hasHold = gainEnv.hold && gainEnv.hold > 0;
        const holdLevel = hasHold ? gainEnv.holdLevel : 1;
        this.currentHoldLevel = holdLevel; // Store for use in noteOff
        
        // Gain Envelope AHDSR (R is in noteOff())
        if (gainEnv.a) {
            console.log('MonoSynth gainEnv.a:', gainEnv.a, 'holdLevel:', holdLevel, 'hasHold:', hasHold);
            this.gain.setGainCurve(this.gain.getGain(), 0, 0); // Reset Volume immediately
            const attackTime = Math.max(gainEnv.a, minTime);
            this.gain.setGainCurve(0, holdLevel, attackTime, gainEnv.attackShape, gainEnv.attackExponent); // Attack to hold level

            if (hasHold) {
                // Attack -> Hold -> Decay -> Sustain
                console.log('MonoSynth gainEnv.hold:', gainEnv.hold, 'gainEnv.d:', gainEnv.d);
                const attackTimeoutId = setTimeout(() => {
                    // Hold phase - maintain hold level
                    this.isInHoldPhase = true;
                    this.holdPhaseEndTime = Date.now() + (gainEnv.hold * 1000);
                    
                    const holdTimeoutId = setTimeout(() => {
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
                    const decayTime = Math.max(gainEnv.d, minTime);
                    this.gain.setGainCurve(holdLevel, gainEnv.s, decayTime, gainEnv.decayShape, gainEnv.decayExponent); // Decay from hold level to sustain
                }, (attackTime * 1000));
                this.timeoutIds.push(timeoutId);
            }
        } else if (gainEnv.d) {
            console.log('MonoSynth gainEnv.d:', gainEnv.d, 'holdLevel:', holdLevel);
            this.gain.setGainCurve(this.gain.getGain(), holdLevel, 0); // Reset to hold level immediately

            const timeoutId = setTimeout(() => {
                const decayTime = Math.max(gainEnv.d, minTime);
                this.gain.setGainCurve(holdLevel, gainEnv.s, decayTime, gainEnv.decayShape, gainEnv.decayExponent); // Decay
            }, (minTime * 1000));
            this.timeoutIds.push(timeoutId);
        } else if (gainEnv.s) {
            console.log('MonoSynth gainEnv.s:', gainEnv.s);
            this.gain.setGainCurve(this.gain.getGain(), gainEnv.s, 0); // Set Volume immediately
        }

        // Filter Envelope ADS (R is in noteOff())
        if (filterEnv.amount) {
            if (filterEnv.a) {
                this.filter.setDetune(0, 0); // Reset Detune
                const attackTime = Math.max(filterEnv.a, minTime);
                this.filter.setDetune(filterEnv.amount, attackTime); // Attack

                const timeoutId = setTimeout(() => {
                    this.filter.setDetune(0, Math.max(filterEnv.d, minTime)); // Decay
                }, (attackTime * 1000));
                this.timeoutIds.push(timeoutId);
            } else if (filterEnv.d) {
                this.filter.setDetune(filterEnv.amount, 0); // Reset Detune
                this.filter.setDetune(0, Math.max(filterEnv.d, minTime)); // Decay
            }
        }
    }
    noteOff = ({ gainEnv, filterEnv }) => {
        if (this.isInHoldPhase && this.holdPhaseEndTime) {
            // We're in hold phase - schedule decay->sustain->release after hold completes
            const remainingHoldTime = Math.max(0, this.holdPhaseEndTime - Date.now());
            console.log('MonoSynth noteOff during hold phase, remaining hold time:', remainingHoldTime);
            
            const holdCompleteTimeoutId = setTimeout(() => {
                // Hold phase completed, now do decay to sustain
                this.isInHoldPhase = false;
                this.holdPhaseEndTime = null;
                
                if (gainEnv.d && gainEnv.d > 0) {
                    // Has decay phase - decay from hold level to sustain
                    console.log('MonoSynth decay after hold, decay time:', gainEnv.d, 'sustain level:', gainEnv.s);
                    const decayTime = Math.max(gainEnv.d, minTime);
                    this.gain.setGainCurve(this.currentHoldLevel, gainEnv.s, decayTime, gainEnv.decayShape, gainEnv.decayExponent);
                    
                    // Then release after decay completes
                    const releaseTimeoutId = setTimeout(() => {
                        this.currentNote = null;
                        const releaseTime = Math.max(gainEnv.r, minTime);
                        this.gain.setGainCurve(gainEnv.s, 0, releaseTime, gainEnv.releaseShape, gainEnv.releaseExponent); // Release
                        this.filter.setDetune(0, Math.max(filterEnv.r, minTime)); // Release
                    }, Math.max(gainEnv.d, minTime) * 1000);
                    this.timeoutIds.push(releaseTimeoutId);
                } else {
                    // No decay phase - go directly to release from hold level
                    console.log('MonoSynth no decay, direct release from hold level');
                    this.currentNote = null;
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
            const releaseTime = Math.max(gainEnv.r, minTime);
            this.gain.setGainCurve(this.gain.getGain(), 0, releaseTime, gainEnv.releaseShape, gainEnv.releaseExponent); // Release
            this.filter.setDetune(0, Math.max(filterEnv.r, minTime)); // Release
        }
    }
    noteStop = () => {
        if (this.isInHoldPhase && this.holdPhaseEndTime) {
            // Even for noteStop, respect the hold phase
            const remainingHoldTime = Math.max(0, this.holdPhaseEndTime - Date.now());
            console.log('MonoSynth noteStop during hold phase, remaining hold time:', remainingHoldTime);
            
            const holdCompleteTimeoutId = setTimeout(() => {
                this.clearTimeouts();
                this.currentNote = null;
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
            this.gain.setGainCurve(this.gain.getGain(), 0, 0); // Immediate stop
            this.filter.setDetune(0, minTime);
        }
    }
}

export default MonoSynth;
