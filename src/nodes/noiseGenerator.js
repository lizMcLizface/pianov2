class NoiseGenerator {
    constructor(AC) {
        this.AC = AC;
        this.workletNode = null;
        this.gainNode = new GainNode(AC, { gain: 1 }); // Start with gain 1, mixer will control it
        this.isInitialized = false;
        this.currentNoiseType = 'white';
        
        // Start with fallback immediately, then upgrade to worklet if available
        this.initializeFallback();
        this.initializeWorklets();
    }
    
    async initializeWorklets() {
        try {
            // Load all noise processor worklets
            await this.AC.audioWorklet.addModule('/white-noise-processor.js');
            await this.AC.audioWorklet.addModule('/pink-noise-processor.js');
            await this.AC.audioWorklet.addModule('/brown-noise-processor.js');
            
            // Upgrade to worklet-based noise
            this.upgradeToWorklet();
        } catch (error) {
            console.error('Failed to initialize noise worklets, using fallback:', error);
            // Keep using fallback
        }
    }
    
    upgradeToWorklet() {
        // Disconnect fallback
        if (this.workletNode) {
            this.workletNode.disconnect();
        }
        
        try {
            // Create new worklet based on current type
            switch (this.currentNoiseType) {
                case 'white':
                    this.workletNode = new AudioWorkletNode(this.AC, 'white-noise-processor');
                    break;
                case 'pink':
                    this.workletNode = new AudioWorkletNode(this.AC, 'pink-noise-processor');
                    break;
                case 'brown':
                    this.workletNode = new AudioWorkletNode(this.AC, 'brown-noise-processor');
                    break;
                default:
                    this.workletNode = new AudioWorkletNode(this.AC, 'white-noise-processor');
            }
            
            this.workletNode.connect(this.gainNode);
            this.isInitialized = true;
            console.log('Upgraded to AudioWorklet noise generation');
        } catch (error) {
            console.error('Failed to create worklet, keeping fallback:', error);
        }
    }
    
    initializeFallback() {
        console.log('Initializing noise fallback');
        // Fallback using ScriptProcessorNode for older browsers
        const bufferSize = 4096;
        this.workletNode = this.AC.createScriptProcessor(bufferSize, 0, 1);
        
        let sampleCount = 0;
        this.workletNode.onaudioprocess = (event) => {
            const outputBuffer = event.outputBuffer;
            const outputData = outputBuffer.getChannelData(0);
            
            for (let i = 0; i < outputBuffer.length; i++) {
                switch (this.currentNoiseType) {
                    case 'white':
                        outputData[i] = (Math.random() * 2 - 1);
                        break;
                    case 'pink':
                        // Simplified pink noise for fallback
                        outputData[i] = (Math.random() * 2 - 1) * 0.5;
                        break;
                    case 'brown':
                        // Simplified brown noise for fallback
                        outputData[i] = (Math.random() * 2 - 1) * 0.3;
                        break;
                    default:
                        outputData[i] = 0;
                }
            }
            
            // Log first few samples to verify noise generation
            sampleCount++;
            if (sampleCount % 100 === 0) {
                console.log('Noise samples:', outputData.slice(0, 5), 'gain:', this.gainNode.gain.value);
            }
        };
        
        this.workletNode.connect(this.gainNode);
        
        // ScriptProcessorNode needs to be connected to destination to actually process
        // Create a silent connection to ensure processing happens
        const silentGain = this.AC.createGain();
        silentGain.gain.value = 0;
        this.workletNode.connect(silentGain);
        silentGain.connect(this.AC.destination);
        
        this.isInitialized = true;
        console.log('Noise fallback initialized, connected to gainNode');
    }
    
    setNoiseType(type) {
        this.currentNoiseType = type;
        
        if (!this.isInitialized) {
            return;
        }
        
        // Disconnect old worklet
        if (this.workletNode) {
            this.workletNode.disconnect();
        }
        
        try {
            // Try to create new worklet based on type
            switch (type) {
                case 'white':
                    this.workletNode = new AudioWorkletNode(this.AC, 'white-noise-processor');
                    break;
                case 'pink':
                    this.workletNode = new AudioWorkletNode(this.AC, 'pink-noise-processor');
                    break;
                case 'brown':
                    this.workletNode = new AudioWorkletNode(this.AC, 'brown-noise-processor');
                    break;
                default:
                    this.workletNode = new AudioWorkletNode(this.AC, 'white-noise-processor');
            }
            
            this.workletNode.connect(this.gainNode);
        } catch (error) {
            // Fall back to ScriptProcessorNode if worklet fails
            console.log('Worklet failed, using fallback for noise type:', type);
            this.initializeFallback();
        }
    }
    
    setGain(gain) {
        this.gainNode.gain.setValueAtTime(gain, this.AC.currentTime);
    }
    
    connect(destination) {
        this.gainNode.connect(destination);
    }
    
    disconnect() {
        this.gainNode.disconnect();
    }
    
    getNode() {
        return this.gainNode;
    }
}

export default NoiseGenerator;
