# Audio Visualization Components

## Overview

Two new audio visualization components have been added to the PolySynth ModuleGrid:

1. **Oscilloscope** - Real-time waveform visualization showing the time-domain representation of the audio signal
2. **Spectrogram** - Real-time frequency spectrum visualization showing the frequency content over time

## Features

### Oscilloscope
- Real-time waveform display using Web Audio API AnalyserNode
- Green oscilloscope-style waveform rendering
- Grid lines for amplitude and time reference
- Signal activity indicator (● active, ○ inactive)
- Automatic signal detection based on amplitude threshold
- Responsive canvas that adapts to container size

### Spectrogram
- Scrolling frequency spectrum visualization over time
- Logarithmic frequency scale from 100Hz to 5kHz for better musical visualization
- Color-coded intensity mapping:
  - Blue: Low intensity
  - Cyan: Low-medium intensity
  - Green: Medium intensity
  - Yellow: Medium-high intensity
  - Red: High intensity
- Peak frequency detection and display
- Frequency scale reference lines
- Signal activity indicator

## Technical Implementation

### Web Audio Integration
Both components use the Web Audio API's AnalyserNode to analyze the audio signal from the PolySynth's master gain node:

```javascript
// Create analyser node
const analyser = audioCtx.createAnalyser();
analyser.fftSize = 2048; // Provides 1024 frequency bins
analyser.smoothingTimeConstant = 0.3; // For spectrogram only

// Connect to audio source
sourceNode.connect(analyser);
```

### Performance Optimizations
- Canvas rendering uses requestAnimationFrame for smooth 60fps updates
- Device pixel ratio scaling for high-DPI displays
- Efficient data processing with amplitude thresholds
- Limited frequency range processing (up to 10kHz) for better performance
- Frame limiting for spectrogram history buffer

### Component Architecture
- Each component is self-contained with its own styled components
- Automatic cleanup of animation frames and audio connections
- Responsive design that adapts to theme colors
- Error handling for audio node disconnections

## Usage

The components are automatically integrated into the PolySynth ModuleGrid and will display real-time visualization of the synthesizer's audio output. They work with any sound produced by the PolySynth, including:

- Individual notes
- Chords
- All synthesizer effects (filters, distortion, reverb, etc.)
- Programmatic note playback

The visualizations are particularly useful for:
- Understanding waveform characteristics of different oscillator types
- Visualizing the effect of filters and envelopes
- Frequency analysis of complex sounds and chords
- Educational purposes for understanding audio synthesis concepts

## Browser Compatibility

These components require a modern browser with support for:
- Web Audio API
- Canvas 2D rendering
- requestAnimationFrame
- ES6+ JavaScript features

Most modern browsers (Chrome, Firefox, Safari, Edge) support these features.
