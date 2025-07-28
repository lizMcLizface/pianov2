class OscNoiseMixer {
    constructor(AC) {
        this.AC = AC;
        
        // Create gain nodes for mixing
        this.oscGain = new GainNode(AC, { gain: 1 });
        this.noiseGain = new GainNode(AC, { gain: 0 });
        this.outputGain = new GainNode(AC, { gain: 1 });
        
        // Connect mixer
        this.oscGain.connect(this.outputGain);
        this.noiseGain.connect(this.outputGain);
    }
    
    // Connect oscillator to mixer
    connectOscillator(oscNode) {
        console.log('Mixer: connecting oscillator');
        oscNode.connect(this.oscGain);
    }
    
    // Connect noise generator to mixer
    connectNoise(noiseNode) {
        console.log('Mixer: connecting noise generator');
        noiseNode.connect(this.noiseGain);
    }
    
    // Set the mix ratio (0 = all oscillator, 1 = all noise)
    setMixRatio(ratio) {
        const clampedRatio = Math.max(0, Math.min(1, ratio));
        
        // Use equal power crossfade for smoother mixing
        const oscGain = Math.cos(clampedRatio * Math.PI / 2);
        const noiseGain = Math.sin(clampedRatio * Math.PI / 2);
        
        this.oscGain.gain.setValueAtTime(oscGain, this.AC.currentTime);
        this.noiseGain.gain.setValueAtTime(noiseGain, this.AC.currentTime);
    }
    
    // Set overall output level
    setOutputGain(gain) {
        this.outputGain.gain.setValueAtTime(gain, this.AC.currentTime);
    }
    
    connect(destination) {
        this.outputGain.connect(destination);
    }
    
    disconnect() {
        this.outputGain.disconnect();
    }
    
    getNode() {
        return this.outputGain;
    }
}

export default OscNoiseMixer;
