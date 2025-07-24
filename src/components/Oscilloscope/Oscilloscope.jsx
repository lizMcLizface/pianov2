import React, { useRef, useEffect, useState } from 'react';
import { ComponentContainer, Canvas, Label } from './Oscilloscope.styled';

const BASE_CLASS_NAME = 'Oscilloscope';

const Oscilloscope = ({ audioCtx, sourceNode, className = '' }) => {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const analyserRef = useRef(null);
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        if (!audioCtx || !sourceNode) return;

        // Create analyser node
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 2048;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        // Connect source to analyser
        sourceNode.connect(analyser);
        analyserRef.current = { analyser, dataArray, bufferLength };

        const canvas = canvasRef.current;
        const canvasCtx = canvas.getContext('2d');
        
        // Set canvas size to match its displayed size
        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                canvas.width = rect.width * window.devicePixelRatio;
                canvas.height = rect.height * window.devicePixelRatio;
                canvasCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
            }
        };

        // Initial resize - use setTimeout to ensure DOM is fully laid out
        setTimeout(resizeCanvas, 0);
        
        // Set up ResizeObserver to handle canvas size changes
        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(canvas);
        
        window.addEventListener('resize', resizeCanvas);

        const draw = () => {
            if (!analyserRef.current) return;
            
            const { analyser, dataArray, bufferLength } = analyserRef.current;
            const rect = canvas.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;

            // Get waveform data
            analyser.getByteTimeDomainData(dataArray);

            // Debug: Log the first few waveform values to see if we're getting data
            if (Math.random() < 0.01) { // Log occasionally
                // console.log('Oscilloscope data sample:', dataArray.slice(0, 10));
                const maxVal = Math.max(...dataArray);
                const minVal = Math.min(...dataArray);
                // console.log('Waveform range:', minVal, 'to', maxVal);
            }

            // Clear canvas with dark background
            canvasCtx.fillStyle = 'rgba(10, 10, 15, 0.9)';
            canvasCtx.fillRect(0, 0, width, height);

            // Set up waveform drawing
            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = '#00ff88'; // Green oscilloscope-style color
            canvasCtx.beginPath();

            const sliceWidth = width / bufferLength;
            let x = 0;
            let hasSignal = false;
            let maxAmplitude = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0; // Convert to 0-2 range
                const y = (v * height) / 2;
                
                // Calculate amplitude for signal detection
                const amplitude = Math.abs(v - 1.0);
                maxAmplitude = Math.max(maxAmplitude, amplitude);

                // Check if there's actual signal (not just silence)
                if (amplitude > 0.02) {
                    hasSignal = true;
                }

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.stroke();

            // Update active state
            setIsActive(hasSignal);

            // Draw grid lines for reference
            canvasCtx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
            canvasCtx.lineWidth = 1;
            canvasCtx.setLineDash([2, 4]);

            // Horizontal center line
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, height / 2);
            canvasCtx.lineTo(width, height / 2);
            canvasCtx.stroke();

            // Horizontal quarter lines for amplitude reference
            canvasCtx.strokeStyle = 'rgba(100, 100, 100, 0.1)';
            canvasCtx.beginPath();
            canvasCtx.moveTo(0, height / 4);
            canvasCtx.lineTo(width, height / 4);
            canvasCtx.moveTo(0, (3 * height) / 4);
            canvasCtx.lineTo(width, (3 * height) / 4);
            canvasCtx.stroke();

            // Vertical time lines
            canvasCtx.beginPath();
            canvasCtx.moveTo(width / 4, 0);
            canvasCtx.lineTo(width / 4, height);
            canvasCtx.moveTo(width / 2, 0);
            canvasCtx.lineTo(width / 2, height);
            canvasCtx.moveTo((3 * width) / 4, 0);
            canvasCtx.lineTo((3 * width) / 4, height);
            canvasCtx.stroke();

            canvasCtx.setLineDash([]);

            animationRef.current = requestAnimationFrame(draw);
        };

        // Start animation
        draw();

        return () => {
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            window.removeEventListener('resize', resizeCanvas);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            if (analyserRef.current?.analyser) {
                try {
                    sourceNode.disconnect(analyserRef.current.analyser);
                } catch (e) {
                    // Node might already be disconnected
                }
            }
        };
    }, [audioCtx, sourceNode]);

    return (
        <ComponentContainer className={`${BASE_CLASS_NAME} ${className}`.trim()}>
            <Label>Oscilloscope {isActive ? '●' : '○'}</Label>
            <Canvas ref={canvasRef} />
        </ComponentContainer>
    );
};

export default Oscilloscope;
