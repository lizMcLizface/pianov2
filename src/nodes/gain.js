import { generateEnvelopeCurve } from '../util/util';

class Gain {
    constructor(AC) {
        this.AC = AC;
        this.node = this.AC.createGain();
    }

    connect = (destination) => {
        if (Array.isArray(destination)) {
            destination.forEach((dest) => this.node.connect(dest));
        } else {
            this.node.connect(destination);
        }
    }

    // Getters
    getNode = () => this.node;
    getGain = () => this.node.gain.value;

    // Setters
    setGain = (val, time = 0) => {
        time
            ? this.node.gain.setTargetAtTime(val, this.AC.currentTime, time)
            : this.node.gain.setValueAtTime(val, this.AC.currentTime);
    }

    /**
     * Sets gain using an envelope curve
     * @param {number} currentLevel - Starting gain value (if null, reads current value)
     * @param {number} finalLevel - Target gain value
     * @param {number} duration - Time duration in seconds (0 = immediate)
     * @param {string} shape - Envelope shape type
     * @param {number} exponent - Curve exponent factor
     * @param {number} startTime - When to start the curve (default: now)
     */
    setGainCurve = (currentLevel, finalLevel, duration = 0, shape = 'linear', exponent = 2, startTime = null) => {
        const when = startTime !== null ? startTime : this.AC.currentTime;
        
        // Cancel any existing scheduled values to prevent overlaps
        this.node.gain.cancelScheduledValues(when);
        
        // Read actual current value if currentLevel is null or not provided
        const actualCurrentLevel = this.node.gain.value;
        
        if (duration <= 0) {
            // Immediate change
            this.node.gain.setValueAtTime(finalLevel, when);
            return;
        }

        // Generate the curve using our utility function
        // Use more steps for longer durations for smoother curves
        const steps = Math.max(10, Math.min(512, Math.floor(duration * 100)));

        const curve = generateEnvelopeCurve(actualCurrentLevel, finalLevel, shape, exponent, steps);
        // console.log(`Generated envelope curve: ${curve}`);


        // Convert to Float32Array as required by setValueCurveAtTime
        const curveArray = new Float32Array(curve);
        
        // Set the current value first to ensure smooth transition
        // this.node.gain.setValueAtTime(actualCurrentLevel, when);
        
        // Apply the curve
        this.node.gain.setValueCurveAtTime(curveArray, when, duration);
    }
}

export default Gain;
