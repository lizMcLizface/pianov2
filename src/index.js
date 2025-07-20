import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import $ from 'jquery';
import { metronome, reset } from './metronome';
import {processChord} from './intervals';
import {HeptatonicScales, scales, getScaleNotes, highlightKeysForScales} from './scales';
import {createHeptatonicScaleTable, selectedRootNote, selectedScales} from './scaleGenerator';
import {chords, processedChords, highlightKeysForChords, createChordRootNoteTable, createChordSuffixTable, selectedChordRootNote, selectedChordSuffixes} from './chords';
import {noteToMidi, noteToName, keys, getElementByNote, getElementByMIDI} from './midi';
import {createScaleChordCrossReference, updateCrossReferenceDisplay} from './cross';
import {modifiers, keyToNote} from './keyboard';
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

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     <App />
//   </React.StrictMode>
// );

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();


console.log(processChord('Cmaj7'));

window.$ = window.jQuery = require('jquery');


createHeptatonicScaleTable();

let firstScaleId = selectedScales[0];
let [family, mode] = firstScaleId.split('-');
let intervals = HeptatonicScales[family][parseInt(mode, 10) - 1].intervals;
let scaleNotes = getScaleNotes(selectedRootNote[0], intervals);
// console.log("Scale Notes for", scaleName, ":", scaleNotes);
highlightKeysForScales(scaleNotes);

// Initialize the chord root note table
createChordRootNoteTable();
// Initialize the chord suffix table
createChordSuffixTable();

highlightKeysForChords(processChord(selectedChordRootNote + selectedChordSuffixes[0])['notes']);




// Initialize the cross-reference display
updateCrossReferenceDisplay();

// Export the update function so other modules can call it when selections change
window.updateCrossReferenceDisplay = updateCrossReferenceDisplay;
window.createScaleChordCrossReference = createScaleChordCrossReference;

let currentNoteIndex = 0;
let currentBarIndex = 0;



// const information = document.getElementById('info')
// information.innerText = `This app is using Chrome (v${process.versions.chrome()}), Node.js (v${process.versions.node()}), and Electron (v${process.versions.electron()})`

const { Vex,  Formatter, Renderer, Stave, Accidental, StaveNote, BarNote, Beam, Dot, StaveConnector, Voice, GhostNote } = require("vexflow");
const { Factory } = Vex.Flow;



if (navigator.requestMIDIAccess) {
    console.log('Browser supports MIDI!');
}

if (navigator.requestMIDIAccess) {
    console.log('Browser still supports MIDI!');
    navigator.requestMIDIAccess()
        .then(success, failure);
}

function listInputsAndOutputs(midiAccess) {
    for (const entry of midiAccess.inputs) {
      const input = entry[1];
      console.log(`Input port [type:'${input.type}']` +
        ` id:'${input.id}'` +
        ` manufacturer:'${input.manufacturer}'` +
        ` name:'${input.name}'` + 
        ` version:'${input.version}'`);
    }
  
    for (const entry of midiAccess.outputs) {
      const output = entry[1];
      console.log(`Output port [type:'${output.type}'] id:'${output.id}' manufacturer:'${output.manufacturer}' name:'${output.name}' version:'${output.version}'`);
    }
  }

function success (midi) {
    console.log('Got midi!', midi);

    listInputsAndOutputs(midi);
    var inputs = midi.inputs.values();
    for (var input = inputs.next();
         input && !input.done;
         input = inputs.next()) {
        // each time there is a midi message call the onMIDIMessage function 
        input.value.onmidimessage = onMIDIMessage;
    }
}
function failure () {
    console.error('No access to your midi devices.')
}



let noteArray = {};
let outputNoteArray = [];//[["e/4","d/4","d/5"],"e##/5","b/4","c/4","D/2","e/4","g/4","a/4","g/4","d/4"];
// let outputNoteArray = ["e##/5","b/4","c/4","D/2"];

var keySignature = 'C';
var selectedNote = 0;
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  
$('#modeSignatureSelect').on('change', function (e) {
    var currentValue = $(this).val();
    var keyValue = $('#keySignatureSelect').val();
    var majorOptions = `
    <option value="0">Gb</option>
    <option value="1">Db</option>
    <option value="2">Ab</option>
    <option value="3">Eb</option>
    <option value="4">Bb</option>
    <option value="5">F</option>
    <option value="6" selected>C</option>
    <option value="7">G</option>
    <option value="8">D</option>
    <option value="9">A</option>
    <option value="10">E</option>
    <option value="11">B</option>
    <option value="12">F#</option>
    `;
    var minorOptions = `
    <option value="0">eb</option>
    <option value="1">bb</option>
    <option value="2">f</option>
    <option value="3">c</option>
    <option value="4">g</option>
    <option value="5">d</option>
    <option value="6" selected>a</option>
    <option value="7">e</option>
    <option value="8">b</option>
    <option value="9">f#</option>
    <option value="10">c#</option>
    <option value="11">g#</option>
    <option value="12">d#</option>
    `;
    console.log(currentValue);
    $("#keySignatureSelect").html(currentValue == 0 ? majorOptions : minorOptions);
    $("#keySignatureSelect").val(keyValue);
    // $("#keySignatureSelect").element.dispatchEvent(new Event('change'))
    var key = $('#keySignatureSelect').find(':selected')[0].innerHTML;
    var signature = $('#modeSignatureSelect').find(':selected')[0].innerHTML;

    // key[0] = key[0].toUpperCase();
    key = capitalizeFirstLetter(key);
    if(signature == "Minor")
        key = key + 'm';

    keySignature = key;

    drawNotes(inputDiv, noteArray, true);
    drawNotes(outputDiv, outputNoteArray, false);
});

// $('#keySignatureSelect').on('change', function (e) {
//     var key = $('#keySignatureSelect').find(':selected')[0].innerHTML;
//     var signature = $('#modeSignatureSelect').find(':selected')[0].innerHTML;

//     // key[0] = key[0].toUpperCase();
//     key = capitalizeFirstLetter(key);
//     if(signature == "Minor")
//         key = key + 'm';

//     keySignature = key;

//     drawNotes(inputDiv, noteArray, true);
//     drawNotes(outputDiv, outputNoteArray, false);
// });

const inputDiv = document.getElementById("input");
const outputDiv = document.getElementById("output");

// var currentHighlight = []
// function highlightNotes(noteArray){
//     for( var key of currentHighlight){
//         var midi = noteToMidi(key) + 12;
//         // if (midi < parseInt($('#lowestNoteSelection').val()) || midi > parseInt($('#highestNoteSelection').val())) continue;
//         keys[midi].element.classList.remove('highlightedKey');
//     }
//     currentHighlight = [];
//     if(Array.isArray(noteArray)){
//         for(var key of noteArray){
//             if ($('#yoloMode')[0] && $('#yoloMode')[0].checked) {
//                 var moduloKey = noteToMidi(key) % 12;
//                 console.log('moduloKey:', moduloKey, 'key:', key);
//                 for(var octave = 0; octave < 8; ++octave){
//                     var midi = moduloKey + 12 + (octave * 12);
//                     if (midi < parseInt($('#lowestNoteSelection').val()) || midi > parseInt($('#highestNoteSelection').val())) continue;
//                     keys[midi].element.classList.add('highlightedKey');
//                     currentHighlight.push(noteToName(midi));
//                 }
//             }
//             else{
//                 var midi = noteToMidi(key) + 12;
//                 // console.log('key: ', key, ' midi note:', midi);
//                 // console.log(keys[midi])
//                 keys[midi].element.classList.add('highlightedKey');;
//                 currentHighlight.push(key);
//             }
//         }
//     }else{
//         var midi = noteToMidi(noteArray) + 12;
//         keys[midi].element.classList.add('highlightedKey');;   
//         currentHighlight.push(noteArray);     
//     }
// }
// // highlightNotes(outputNoteArray[selectedNote])


// var currentScaleHighlight = []
// function highlightScaleNotes(noteArray){
//     for( var key of currentScaleHighlight){
//         var midi = noteToMidi(key) + 12;
//         keys[midi].element.classList.remove('scaleKey');
//     }
//     currentScaleHighlight = [];
//     if(Array.isArray(noteArray)){
//         for(var key of noteArray){
//             var midi = noteToMidi(key) + 12;
//             // console.log('key: ', key, ' midi note:', midi);
//             // console.log(keys[midi])
//             if(midi >=  parseInt($('#lowestNoteSelection').val()) && midi <=  parseInt($('#highestNoteSelection').val())){
//             keys[midi].element.classList.add('scaleKey');;
//             currentScaleHighlight.push(key);
//             }
//         }
//     }else{
//         var midi = noteToMidi(noteArray) + 12;
//         keys[midi].element.classList.add('scaleKey');;   
//         currentScaleHighlight.push(noteArray);     
//     }
// }

function setupStaves(div, divisions = 1){
    while (div.hasChildNodes()) {
        div.removeChild(div.lastChild);
    }

    const inputRenderer = new Renderer(div, Renderer.Backends.SVG);
    // console.log(inputDiv.offsetWidth)
    
    var inputDisplayWidth = div.offsetWidth
    // Configure the rendering context.
    inputRenderer.resize(inputDisplayWidth, 320);
    const inputContext = inputRenderer.getContext();
    // Create a stave of width 400 at position 10, 40 on the canvas.

    var maxWidth = inputDisplayWidth-100
    inputDisplayWidth = maxWidth;
    if(divisions == 0){
        const inputTrebleStave = new Stave(30, 80, maxWidth);
        const inputBassStave = new Stave(30, 160, maxWidth);
        // inputTrebleStave.addTimeSignature('3/8')
        inputTrebleStave.addClef("treble");
        inputBassStave.addClef("bass");

        inputTrebleStave.addKeySignature(keySignature);
        inputBassStave.addKeySignature(keySignature);

        // Connect it to the rendering context and draw!
        inputTrebleStave.setContext(inputContext).draw();
        inputBassStave.setContext(inputContext).draw();


        new StaveConnector(inputBassStave, inputTrebleStave)
        .setType('single')
        .setContext(inputContext)
        .draw();

        new StaveConnector(inputTrebleStave, inputBassStave)
        .setType('brace')
        .setContext(inputContext)
        .draw();

        return {inputRenderer, inputContext, inputDisplayWidth, inputTrebleStave, inputBassStave}
    }
    else{
        var divWidth = maxWidth / divisions
        var trebleStaves = [];
        var bassStaves = [];
        
        trebleStaves.push(new Stave(30,80,divWidth));
        bassStaves.push(new Stave(30,200,divWidth));

        trebleStaves[0].addClef("treble");
        bassStaves[0].addClef("bass");

        trebleStaves[0].addKeySignature(keySignature);
        bassStaves[0].addKeySignature(keySignature);


        for(var i = 1; i < divisions; ++i){
            trebleStaves.push(new Stave(trebleStaves[i-1].width + trebleStaves[i-1].x,80,divWidth));
            bassStaves.push(new Stave(bassStaves[i-1].width + bassStaves[i-1].x,200,divWidth));
        }
            
        for(var stave of trebleStaves)
            stave.setContext(inputContext).draw();
        for(var stave of bassStaves)
            stave.setContext(inputContext).draw();


        new StaveConnector(bassStaves[0], trebleStaves[0])
        .setType('single')
        .setContext(inputContext)
        .draw();

        new StaveConnector(trebleStaves[0], bassStaves[0])
        .setType('brace')
        .setContext(inputContext)
        .draw();
// console.log('treble Staves', trebleStaves)
        inputDisplayWidth = divWidth;
        return {inputRenderer, inputContext, inputDisplayWidth, trebleStaves, bassStaves}
    }

}

function drawIndividualNotes(noteArray, inputContext, inputTrebleStave, inputBassStave){
    var trebleNotes = [];
    var trebleAccidentals = [];
    var bassNotes = [];
    var bassAccidentals = [];
    if(noteArray.constructor == Object){
    for (const [key, value] of Object.entries(noteArray)) {
        // console.log(`${key}: ${value}`);
        if(parseInt(key.slice(-1)) >= 4){
            trebleNotes.push(key);
            // trebleAccidentals.push(key.includes('#') ? '#' : 'n');
        }
        else{
            bassNotes.push(key);
            // bassAccidentals.push(key.includes('#') ? '#' : 'n');

        }
      }
    }
    else{
        for (const key of noteArray) {
            if(parseInt(key.slice(-1)) >= 4){
                trebleNotes.push(key);
                // trebleAccidentals.push(key.includes('#') ? '#' : 'n');
            }
            else{
                bassNotes.push(key);
                // bassAccidentals.push(key.includes('#') ? '#' : 'n');

            }
          }
    }
    if(trebleNotes.length > 0){
      const sNote =  new StaveNote({keys: trebleNotes, duration:'4'});
      var i = 0;
      for( const accidental of trebleAccidentals){
          // console.log(accidental)
          // if(accidental != 'n')
              // sNote.addModifier(new Accidental(accidental), i++);
      }

      const notes =[ sNote];
      const voice = new Voice({ num_beats: 1, beat_value: 4 });
      voice.addTickables(notes);
      Accidental.applyAccidentals([voice], keySignature);

      // Format and justify the notes to 400 pixels.
      new Formatter().joinVoices([voice]).format([voice], 350);
      
      // Render voice
      // voice.draw(inputContext, inputTrebleStave);
      Formatter.FormatAndDraw(inputContext, inputTrebleStave, notes);
  }
  if(bassNotes.length > 0){
      const sNote =  new StaveNote({clef: "bass", keys: bassNotes, duration:'4'});
      var i = 0;
      for( const accidental of bassAccidentals){
          // console.log(accidental)
          // if(accidental != 'n')
              // sNote.addModifier(new Accidental(accidental), i++);
      }

      const notes =[ sNote];
      const voice = new Voice({ num_beats: 1, beat_value: 4 });
      voice.addTickables(notes);
      Accidental.applyAccidentals([voice], keySignature);
      
      // Format and justify the notes to 400 pixels.
      new Formatter().joinVoices([voice]).format([voice], 350);

      // Render voice
      // voice.draw(inputContext, inputBassStave);
      Formatter.FormatAndDraw(inputContext, inputBassStave, notes);
  }
    
}

function drawNotes(div, noteArray, stacked = false){
    // console.log('Current Note State:', noteArray);

    var noteString = [];
    for (const [key, value] of Object.entries(noteArray)) {
        // console.log(`${key}: ${value}`);
        noteString.push(key);
      }
    // console.log('note string', noteString);
    // document.getElementById("inputText").innerHTML = 'You have pressed: ' + noteString.join(',');
    var {inputRenderer, inputContext, inputDisplayWidth, inputTrebleStave, inputBassStave, trebleStaves, bassStaves} = 
        setupStaves(div, Array.isArray(noteArray) ? noteArray.length : 0);
    
    
    if(noteArray.constructor == Object){
        drawIndividualNotes(noteArray, inputContext, inputTrebleStave, inputBassStave);
        return;
    }

    // console.log(inputTrebleStave)
    if(!($('#chordCheckBox')[0].checked && $('#arpegioButton')[0].checked)){
        for( const [key, value] of Object.entries(noteArray)){
            // console.log('key value pair: ', key, value);
            var trebleNotes = [];
            var bassNotes = [];
            for(const note of value.notes){        
                // console.log('note:', note)    
                if(!Array.isArray(note)){
                    if(parseInt(note.slice(-1)) >= 4){
                        // console.log(key);
                        trebleNotes.push(new StaveNote({keys:[note], duration:'4'}));
                        bassNotes.push(new StaveNote({keys:['b/4'], duration:'qr'}));
                        // trebleNotes.push(key);
                        // trebleAccidentals.push(key.includes('#') ? '#' : 'n');
                    }
                    else{
                        // console.log(key);
                        bassNotes.push(new StaveNote({clef: "bass",keys:[note], duration:'4'}));
                        trebleNotes.push(new StaveNote({keys:['b/4'], duration:'qr'}));
                        // bassNotes.push(key);
                        // bassAccidentals.push(key.includes('#') ? '#' : 'n');
        
                    }
                }else{
                    // console.log(note)
                    var localTrebleNotes = []
                    var localBassNotes = []
                    for (const k of note) {
                        if(parseInt(k.slice(-1)) >= 4){
                            localTrebleNotes.push(k);
                            // trebleAccidentals.push(key.includes('#') ? '#' : 'n');
                        }
                        else{
                            localBassNotes.push(k);
                            // bassAccidentals.push(key.includes('#') ? '#' : 'n');
            
                        }
                    }
                    //   console.log('split: ', localTrebleNotes, localBassNotes)
                    if(localTrebleNotes.length > 0)
                        trebleNotes.push(new StaveNote({keys:localTrebleNotes, duration:'4'}));
                    else
                        trebleNotes.push(new StaveNote({keys:['b/4'], duration:'qr'}));
                    if(localBassNotes.length > 0)
                    bassNotes.push(new StaveNote({clef: "bass",keys:localBassNotes, duration:'4'}));
                    else
                    bassNotes.push(new StaveNote({keys:['b/4'], duration:'qr'}));

                }
            }
            // console.log('treble notes:', trebleNotes)
            // console.log('bass notes:', bassNotes)if(key == currentBarIndex)
            if(key == currentBarIndex){
                if(trebleNotes.length > currentNoteIndex){
                trebleNotes[currentNoteIndex].setStyle({fillStyle: "red", strokeStyle: "red"});
                bassNotes[currentNoteIndex].setStyle({fillStyle: "red", strokeStyle: "red"});
                }
            }
            if(key == 0){
                if(trebleNotes.length > selectedNote){
                trebleNotes[selectedNote].setStyle({fillStyle: "blue", strokeStyle: "blue"});
                bassNotes[selectedNote].setStyle({fillStyle: "blue", strokeStyle: "blue"});
                }
            }

            const notes = trebleNotes;
            const voice = new Voice({ num_beats: trebleNotes.length, beat_value: 4 });

            voice.addTickables(notes);
            Accidental.applyAccidentals([voice], keySignature);
            
            var text = new Vex.Flow.TextNote({
                text: value.root + ' ' + value.scale + ' ' + value.dir,
                font: {
                    family: "Arial",
                    size: 12,
                    weight: ""
                },
                duration: 'q',
                y_shift:22
            })
            .setLine(10)
            .setStave(trebleStaves[key])
            // .setJustification(Vex.Flow.TextNote.Justification.CENTER);

            const textVoice = new Voice({ num_beats: trebleNotes.length, beat_value: 4 });

            var missingDuration = trebleNotes.length - 1;

            var textTicks = [text];
            while(missingDuration > 0){
                if(missingDuration >= 4){
                    textTicks.push(new GhostNote({duration:'w'}))
                    missingDuration -= 4;
                }
                else if(missingDuration >= 2){
                    textTicks.push(new GhostNote({duration:'h'}))
                    missingDuration -= 2;
                }
                else if(missingDuration >= 1){
                    textTicks.push(new GhostNote({duration:'q'}))
                    missingDuration -= 1;
                }
            }
            // for(var i = 0; i < missingDuration; ++i)
            //     textTicks.push(new GhostNote({duration:'q'}))

            textVoice.addTickables(textTicks);

            // Format and justify the notes to 400 pixels.
            const beams = Beam.generateBeams(notes);
            new Formatter().joinVoices([voice]).format([voice], inputDisplayWidth - (key == 0 ? 50 : 50));
            
            // Render voice
            // voice.draw(inputContext, inputTrebleStave);
            // voice.draw(inputContext, inputTrebleStave);

            // console.log(inputTrebleStave)
            // Formatter.FormatAndDraw(inputContext, trebleStaves[key], notes);
            voice.draw(inputContext, trebleStaves[key]);
            new Formatter().joinVoices([textVoice]).format([textVoice], inputDisplayWidth - (key == 0 ? 50 : 50));
            text.setContext(inputContext).draw();
            
            // Formatter.FormatAndDraw(inputContext, trebleStaves[key], voice);
            beams.forEach(function (b) {
                b.setContext(inputContext).draw();
            });
            const voice2 = new Voice({ num_beats: bassNotes.length, beat_value: 4 });

            voice2.addTickables(bassNotes);
            Accidental.applyAccidentals([voice2], keySignature);

            // Format and justify the notes to 400 pixels.
            new Formatter().joinVoices([voice2]).format([voice2], inputDisplayWidth - (key == 0 ? 50 : 50));
            
            // Render voice
            voice2.draw(inputContext, bassStaves[key]);
            // Formatter.FormatAndDraw(inputContext, bassStaves[key], bassNotes);
    // return;
        }
    }
    else{
        var chordLengths = {};
        chordLengths[1]  = ['4'];
        chordLengths[2]  = ['8','8'];
        chordLengths[3]  = ['8','16', '16'];
        chordLengths[4]  = ['16','16','16','16'];
        chordLengths[5]  = ['16','16','16','32','32'];
        chordLengths[6]  = ['16','16','32','32','32','32'];
        chordLengths[7]  = ['16','32','32','32','32','32','32'];
        chordLengths[8]  = ['32','32','32','32','32','32','32','32'];
        chordLengths[9]  = ['32','32','32','32','32','32','32','64','64'];
        chordLengths[10] = ['32','32','32','32','32','32','64','64','64','64'];
        // console.log(chordLengths)
        for( const [key, value] of Object.entries(noteArray)){
            // console.log('key value pair: ', key, value);
            var trebleNotes = [];
            var bassNotes = [];

            var numBeats = value['chorded'].length
            var addedNotes = 0;
            for(const chord of value['chorded']){
                var chordNotes = []
                for(const note of chord){
                    chordNotes.push(noteToMidi(note) + 12)
                }
                chordNotes.sort();
                var treble = false;
                if(chordNotes[0] >= 60)
                    treble = true;
                if(treble){
                    var isSelected = false;
                    var isPlaying = false;
                    for(var i = 0; i < chord.length; ++ i){
                        const note = chord[i];
                        trebleNotes.push(new StaveNote({keys:[note], duration:chordLengths[chord.length][i]}));  
                        if(addedNotes == currentNoteIndex && key == currentBarIndex){
                            isPlaying = true;
                            trebleNotes[trebleNotes.length-1].setStyle({fillStyle: "red", strokeStyle: "red"});
                        }                      
                        if(addedNotes++ == selectedNote && key == 0){
                            isSelected = true;
                            trebleNotes[trebleNotes.length-1].setStyle({fillStyle: "blue", strokeStyle: "blue"});
                        }                      
                    }
                    bassNotes.push(new StaveNote({keys:['b/4'], duration:'qr'}));
                    if(isPlaying){
                        bassNotes[bassNotes.length-1].setStyle({fillStyle: "red", strokeStyle: "red"});
                    }
                    if(isSelected){
                        bassNotes[bassNotes.length-1].setStyle({fillStyle: "blue", strokeStyle: "blue"});
                    }
                }else{                    
                    for(var i = 0; i < chord.length; ++ i){
                        const note = chord[i];
                        bassNotes.push(new StaveNote({clef: "bass",keys:[note], duration:chordLengths[chord.length][i]}));   
                        
                        if(addedNotes == currentNoteIndex && key == currentBarIndex){
                            isPlaying = true;
                            bassNotes[bassNotes.length-1].setStyle({fillStyle: "red", strokeStyle: "red"});
                        }                      
                        if(addedNotes++ == selectedNote && key == 0){
                            isSelected = true;
                            bassNotes[bassNotes.length-1].setStyle({fillStyle: "blue", strokeStyle: "blue"});
                        }                                           
                    }
                    trebleNotes.push(new StaveNote({keys:['b/4'], duration:'qr'}));
                    if(isPlaying){
                        trebleNotes[trebleNotes.length-1].setStyle({fillStyle: "red", strokeStyle: "red"});
                    }
                    if(isSelected){
                        trebleNotes[trebleNotes.length-1].setStyle({fillStyle: "blue", strokeStyle: "blue"});
                    }
                }

            }

            // if(key == 0){
            //     if(trebleNotes.length > selectedNote){
            //     trebleNotes[selectedNote].setStyle({fillStyle: "blue", strokeStyle: "blue"});
            //     bassNotes[selectedNote].setStyle({fillStyle: "blue", strokeStyle: "blue"});
            //     }
            // }
            const notes = trebleNotes;
            // console.log('numBeats:', numBeats)
            // console.log('treblenotes:', trebleNotes.length)
            // console.log('bassnotes:', bassNotes.length)

            const voice = new Voice({ num_beats: numBeats, beat_value: 4 });
            const voice2 = new Voice({ num_beats: numBeats, beat_value: 4 });

            voice.addTickables(trebleNotes);
            voice2.addTickables(bassNotes);
            Accidental.applyAccidentals([voice], keySignature);
            Accidental.applyAccidentals([voice2], keySignature);
            
            var text = new Vex.Flow.TextNote({
                text: value.root + ' ' + value.scale + ' ' + value.dir,
                font: {
                    family: "Arial",
                    size: 12,
                    weight: ""
                },
                duration: 'q',
                y_shift:22
            })
            .setLine(10)
            .setStave(trebleStaves[key])
            const textVoice = new Voice({ num_beats: numBeats, beat_value: 4 });
            var missingDuration = numBeats - 1;
            var textTicks = [text];
            while(missingDuration > 0){
                if(missingDuration >= 4){
                    textTicks.push(new GhostNote({duration:'w'}))
                    missingDuration -= 4;
                }
                else if(missingDuration >= 2){
                    textTicks.push(new GhostNote({duration:'h'}))
                    missingDuration -= 2;
                }
                else if(missingDuration >= 1){
                    textTicks.push(new GhostNote({duration:'q'}))
                    missingDuration -= 1;
                }
            }
            textVoice.addTickables(textTicks);
            new Formatter().joinVoices([textVoice]).format([textVoice], inputDisplayWidth - (key == 0 ? 50 : 50));
            text.setContext(inputContext).draw();

            new Formatter().joinVoices([voice, voice2]).format([voice, voice2], inputDisplayWidth - (key == 0 ? 50 : 50));

            const beams = Beam.generateBeams(notes);
            voice.draw(inputContext, trebleStaves[key]);
            beams.forEach(function (b) {
                b.setContext(inputContext).draw();
            });
            const beams2 = Beam.generateBeams(bassNotes);
            voice2.draw(inputContext, bassStaves[key]);
            beams2.forEach(function (b) {
                b.setContext(inputContext).draw();
            });




            // new Formatter().joinVoices([voice2]).format([voice2], inputDisplayWidth - (key == 0 ? 50 : 50));
        }        
    }


    return;
}

drawNotes(inputDiv, noteArray, true);
drawNotes(outputDiv, outputNoteArray, false);


// const notes = {
//     "C4": 261.63,
//     "Db4": 277.18,
//     "D4": 293.66,
//     "Eb4": 311.13,
//     "E4": 329.63,
//     "F4": 349.23,
//     "Gb4": 369.99,
//     "G4": 392.00,
//     "Ab4": 415.30,
//     "A4": 440,
//     "Bb4": 466.16,
//     "B4": 493.88,
//     "C5": 523.25
// }
  

document.getElementById("inputText").innerHTML = 'You have pressed: ';
document.getElementById("outputText").innerHTML = 'You should press: ';

// function notesAreEqual(inputNotes, referenceNotes){
//     if(inputNotes.length == 0)
//     return false;
//     if(Array.isArray(referenceNotes)){
//         if(inputNotes.length != referenceNotes.length)
//             return false;

//         var parsedInput = [];
//         var parsedReference = [];
//         for(const input of inputNotes)
//             parsedInput.push(noteToMidi(input));
//         for(const input of referenceNotes)
//             parsedReference.push(noteToMidi(input));
//         parsedInput.sort();
//         parsedReference.sort();
//         // console.log(parsedInput)
//         // console.log(parsedReference)
//         // YOLO mode: allow octave-insensitive matching
//         if ($('#yoloMode')[0] && $('#yoloMode')[0].checked) {
//             // Compare only pitch class (modulo 12)
//             let inputMod = parsedInput.map(n => n % 12).sort();
//             let refMod = parsedReference.map(n => n % 12).sort();
//             return inputMod.length === refMod.length && inputMod.every((v, i) => v === refMod[i]);
//         }
//         return parsedInput.every(function(value, index) { return value === parsedReference[index]})
//         return parsedInput == parsedReference;
//     }
//     else{
//         // console.log(inputNotes , ' - ', referenceNotes);
//         // console.log(noteToMidi(inputNotes[0]), ' - ', noteToMidi(referenceNotes))
//     // 
//         if(noteToMidi(inputNotes[0]) == noteToMidi(referenceNotes))
//             return true;
//     }
//     return false;
// }

var currentPressed = [];

var currentSynthNotes = {};

function onKeyPress(event, up) {
    console.log(event.key, event.code, event.type);
    if(event.type == 'keydown'){
        if(event.location == KeyboardEvent.DOM_KEY_LOCATION_LEFT && event.code.includes('Shift')){
            modifiers['LeftShift'] = true;
        }
        else if(event.location == KeyboardEvent.DOM_KEY_LOCATION_RIGHT && event.code.includes('Shift')){
            modifiers['RightShift'] = true;
        }
        else if(event.location == KeyboardEvent.DOM_KEY_LOCATION_LEFT && event.code.includes('Control')){
            modifiers['LeftControl'] = true;
        }
        else if(event.location == KeyboardEvent.DOM_KEY_LOCATION_RIGHT && event.code.includes('Control')){
            modifiers['RightControl'] = true;
        }
        else if(event.location == KeyboardEvent.DOM_KEY_LOCATION_LEFT && event.code.includes('Alt')){
            modifiers['LeftAlt'] = true;
        }
        else if(event.location == KeyboardEvent.DOM_KEY_LOCATION_RIGHT && event.code.includes('Alt')){
            modifiers['RightAlt'] = true;
        }
    }else if(event.type == 'keyup'){
        if(event.location == KeyboardEvent.DOM_KEY_LOCATION_LEFT && event.code.includes('Shift')){
            modifiers['LeftShift'] = false;
        }
        else if(event.location == KeyboardEvent.DOM_KEY_LOCATION_RIGHT && event.code.includes('Shift')){
            modifiers['RightShift'] = false;
        }
        else if(event.location == KeyboardEvent.DOM_KEY_LOCATION_LEFT && event.code.includes('Control')){
            modifiers['LeftControl'] = false;
        }
        else if(event.location == KeyboardEvent.DOM_KEY_LOCATION_RIGHT && event.code.includes('Control')){  
            modifiers['RightControl'] = false;
        }
        else if(event.location == KeyboardEvent.DOM_KEY_LOCATION_LEFT && event.code.includes('Alt')){
            modifiers['LeftAlt'] = false;
        }
        else if(event.location == KeyboardEvent.DOM_KEY_LOCATION_RIGHT && event.code.includes('Alt')){
            modifiers['RightAlt'] = false;
        }
    }


    var note = keyToNote(event);
    if (note == undefined){
        // console.log('Key not mapped: ', event.code);
        return;
    }
    console.log('Modifiers: ', modifiers);
    console.log('Note: ', note);
    var midiNote = noteToMidi(note) + 12;
    console.log('Midi Note: ', midiNote);
    if(modifiers['LeftShift']) midiNote -= 12;
    if(modifiers['RightShift']) midiNote += 12;
    // if (modifiers['LeftControl']) midiNote -= 24;
    // if (modifiers['RightControl']) midiNote += 24;
    if (modifiers['LeftAlt']) midiNote -= 24;
    if (modifiers['RightAlt']) midiNote += 24;
    note = noteToName(midiNote);

    console.log('Note: ', note, ' Midi Note: ', midiNote);

    if(event.type == 'keydown' && note != undefined && !currentPressed.includes(note)){
        noteArray[note] = 127; // Set velocity to 127 for keydown
        if(!currentPressed.includes(note)){
            currentPressed.push(note);
        }
        // console.log('Key Down: ', note);


        var noteString = [];
        for (const [key, value] of Object.entries(noteArray)) {
            // console.log(`${key}: ${value}`);
            noteString.push(key);
        }
        for(const [key, value] of Object.entries(noteArray)){
            var midi = noteToMidi(key) + 12;
            // console.log('key: ', key, ' midi note:', midi);
            // console.log(keys[midi])
            keys[midi].element.classList.add('pressedKey');;
            currentPressed.push(key);
        }

        // if(notesAreEqual(noteString, outputNoteArray[0]['notes'][selectedNote])){
        //     selectedNote = selectedNote + 1;
        //     if(selectedNote == outputNoteArray[0]['notes'].length){
        //         selectedNote = 0;
        //         const prior = outputNoteArray.slice(-1)[0]
        //         outputNoteArray.push(generatePattern(prior['dir'], prior['root'], prior['mode'], prior['scale']));
        //         outputNoteArray.shift();
        //         barCounter++;
        //         // generatePattern();
        //     }

        //     highlightNotes(outputNoteArray[0]['notes'][selectedNote])
        //     drawNotes(outputDiv, outputNoteArray, false);
        //     highlightScaleNotes(outputNoteArray[0]['scaleNotes'])
        //     // selectedNote = selectedNote % outputNoteArray[0]['notes'].length;
        // }

        // noteString = [];
        // for (const [key, value] of Object.entries(noteArray)) {
        //     // console.log(`${key}: ${value}`);
        //     noteString.push(`${key}[${value}]`);
        // }
        document.getElementById("inputText").innerHTML = 'You have pressed: ' + noteString.join(',');
        // document.getElementById("outputText").innerHTML = 'You should press: ' + outputNoteArray[0]['notes'][selectedNote];

        


        drawNotes(inputDiv, noteArray, true);


        if($('#synthEnableBox')[0].checked){
            const osc = context.createOscillator();
            const noteGain = context.createGain();
            var startTime = context.currentTime;
            noteGain.gain.setValueAtTime(0, 0);
            var level = sustainLevel * 64 / 127;
            var activeNoteCount = Object.keys(noteArray).length;
            var dynamicLevel = Math.min(level, 0.8 / Math.max(1, activeNoteCount));
            
            noteGain.gain.linearRampToValueAtTime(dynamicLevel, startTime + noteLength * attackTime);

            // noteGain.gain.linearRampToValueAtTime(level, startTime + noteLength * attackTime);

            // noteGain.gain.setValueAtTime(sustainLevel, context.currentTime + noteLength - noteLength * releaseTime);
            // noteGain.gain.linearRampToValueAtTime(0, context.currentTime + noteLength);

            var lfoGain = context.createGain();
            lfoGain.gain.setValueAtTime(vibratoAmount, 0);
            lfoGain.connect(osc.frequency)

            var lfo = context.createOscillator();
            lfo.frequency.setValueAtTime(vibratoSpeed, 0);
            lfo.start(0);
            // lfo.stop(context.currentTime + noteLength);
            lfo.connect(lfoGain); 
            if(waveform == "custom")
                osc.setPeriodicWave(customWaveform);
            else
                osc.type = waveform;
            osc.frequency.setValueAtTime(pianoNotes[note], 0);
            osc.start(0);
            // osc.stop(context.currentTime + noteLength);
            osc.connect(noteGain);

            noteGain.connect(masterVolume);
            noteGain.connect(delay);

            currentSynthNotes[note] = [noteGain, lfo, osc, startTime, dynamicLevel];
        }

    }
    else if(event.type == 'keyup' && note != undefined){
        // console.log('Key Up: ', note);
        if(noteArray.hasOwnProperty(note)){ // true
            delete noteArray[note];
            var midi = noteToMidi(note) + 12;
            keys[midi].element.classList.remove('pressedKey');
            currentPressed = currentPressed.filter(item => item !== note);
        }
        var noteString = [];
        for (const [key, value] of Object.entries(noteArray)) {
            // console.log(`${key}: ${value}`);
            noteString.push(key);
        }
        // if(notesAreEqual(noteString, outputNoteArray[0]['notes'][selectedNote])){
        //     selectedNote = selectedNote + 1;
        //     if(selectedNote == outputNoteArray[0]['notes'].length){
        //         selectedNote = 0;
        //         const prior = outputNoteArray.slice(-1)[0]
        //         outputNoteArray.push(generatePattern(prior['dir'], prior['root'], prior['mode'], prior['scale']));
        //         outputNoteArray.shift();
        //         barCounter++;
        //         // generatePattern();
        //     }

        //     highlightNotes(outputNoteArray[0]['notes'][selectedNote])
        //     drawNotes(outputDiv, outputNoteArray, false);
        //     highlightScaleNotes(outputNoteArray[0]['scaleNotes'])
        //     // selectedNote = selectedNote % outputNoteArray[0]['notes'].length;
        // }

        // noteString = [];
        // for (const [key, value] of Object.entries(noteArray)) {
        //     // console.log(`${key}: ${value}`);
        //     noteString.push(`${key}[${value}]`);
        // }
        document.getElementById("inputText").innerHTML = 'You have pressed: ' + noteString.join(',');
        // document.getElementById("outputText").innerHTML = 'You should press: ' + outputNoteArray[0]['notes'][selectedNote];

        if ($('#synthEnableBox')[0].checked && note in currentSynthNotes){
            var currentTime = context.currentTime;
            var endTime = Math.max(currentTime, currentSynthNotes[note][3] + noteLength - noteLength * releaseTime) + noteLength* releaseTime
            // var level = sustainLevel * message.data[2] / 127;
            currentSynthNotes[note][0].gain.setValueAtTime(currentSynthNotes[note][4], endTime - noteLength * releaseTime);
            currentSynthNotes[note][0].gain.linearRampToValueAtTime(0, endTime);
            currentSynthNotes[note][2].stop(endTime);
            currentSynthNotes[note][1].stop(endTime);
            delete currentSynthNotes[note];
        }
        drawNotes(inputDiv, noteArray, true);



    }

}





document.addEventListener('keydown', onKeyPress);
document.addEventListener('keyup', onKeyPress);

function onMIDIMessage (message) {
    let pressed = message.data[0] == 144 ? true : false;
    if (message.data[2] == 0) pressed = false; // Note off message with velocity 0
    // console.log('MIDI Message: ', message.data, 'Pressed: ', pressed);
    var noteName = noteToName(message.data[1]);
    for( var key of currentPressed){
        var midi = noteToMidi(key) + 12;
        keys[midi].element.classList.remove('pressedKey');
    }
    currentPressed = [];

    if(pressed){
        console.log('Key Down: ', noteName, '@', message.data[2]);
        noteArray[noteName] = message.data[2];
    }
    else{
        console.log('Key Up: ', noteName);
        if(noteArray.hasOwnProperty(noteName)){ // true
            // console.log('...');
            delete noteArray[noteName];
        }
        // console.log('Note ', message.data[1])
        // console.log('Velocity ', message.data[2])
    }
    // console.log('Current Note State:', noteArray);

    var noteString = [];
    for (const [key, value] of Object.entries(noteArray)) {
        // console.log(`${key}: ${value}`);
        noteString.push(key);
      }
      for(const [key, value] of Object.entries(noteArray)){
          var midi = noteToMidi(key) + 12;
          // console.log('key: ', key, ' midi note:', midi);
          // console.log(keys[midi])
          keys[midi].element.classList.add('pressedKey');;
          currentPressed.push(key);
      }
    // console.log(noteString);

    //outputNoteArray[selectedNote]

    // if(notesAreEqual(noteString, outputNoteArray[0]['notes'][selectedNote])){
    //     selectedNote = selectedNote + 1;
    //     if(selectedNote == outputNoteArray[0]['notes'].length){
    //         selectedNote = 0;
    //         const prior = outputNoteArray.slice(-1)[0]
    //         outputNoteArray.push(generatePattern(prior['dir'], prior['root'], prior['mode'], prior['scale']));
    //         outputNoteArray.shift();
    //         barCounter++;
    //         // generatePattern();
    //     }

    //     highlightNotes(outputNoteArray[0]['notes'][selectedNote])
    //     drawNotes(outputDiv, outputNoteArray, false);
    //     highlightScaleNotes(outputNoteArray[0]['scaleNotes'])
    //     // selectedNote = selectedNote % outputNoteArray[0]['notes'].length;
    // }

    // noteString = [];
    // for (const [key, value] of Object.entries(noteArray)) {
    //     // console.log(`${key}: ${value}`);
    //     noteString.push(`${key}[${value}]`);
    //   }
    document.getElementById("inputText").innerHTML = 'You have pressed: ' + noteString.join(',');

    // document.getElementById("outputText").innerHTML = 'You should press: ' + outputNoteArray[0]['notes'][selectedNote];

    


    drawNotes(inputDiv, noteArray, true);

    
    if(pressed){
        if($('#synthEnableBox')[0].checked){
        const osc = context.createOscillator();
        const noteGain = context.createGain();
        var startTime = context.currentTime;
        noteGain.gain.setValueAtTime(0, 0);
        var level = sustainLevel * message.data[2] / 127;
        var activeNoteCount = Object.keys(noteArray).length;
        var dynamicLevel = Math.min(level, 0.8 / Math.max(1, activeNoteCount));
        
        noteGain.gain.linearRampToValueAtTime(dynamicLevel, startTime + noteLength * attackTime);

        // noteGain.gain.linearRampToValueAtTime(level, startTime + noteLength * attackTime);

        // noteGain.gain.setValueAtTime(sustainLevel, context.currentTime + noteLength - noteLength * releaseTime);
        // noteGain.gain.linearRampToValueAtTime(0, context.currentTime + noteLength);

        var lfoGain = context.createGain();
        lfoGain.gain.setValueAtTime(vibratoAmount, 0);
        lfoGain.connect(osc.frequency)

        var lfo = context.createOscillator();
        lfo.frequency.setValueAtTime(vibratoSpeed, 0);
        lfo.start(0);
        // lfo.stop(context.currentTime + noteLength);
        lfo.connect(lfoGain); 
        if(waveform == "custom")
            osc.setPeriodicWave(customWaveform);
        else
            osc.type = waveform;
        osc.frequency.setValueAtTime(pianoNotes[noteName], 0);
        osc.start(0);
        // osc.stop(context.currentTime + noteLength);
        osc.connect(noteGain);

        noteGain.connect(masterVolume);
        noteGain.connect(delay);

        currentSynthNotes[noteName] = [noteGain, lfo, osc, startTime, dynamicLevel];
        }
    }
    else{
        if(noteName in currentSynthNotes){
            var currentTime = context.currentTime;
            var endTime = Math.max(currentTime, currentSynthNotes[noteName][3] + noteLength - noteLength * releaseTime) + noteLength* releaseTime
        // var level = sustainLevel * message.data[2] / 127;
            currentSynthNotes[noteName][0].gain.setValueAtTime(currentSynthNotes[noteName][4], endTime - noteLength * releaseTime);
            currentSynthNotes[noteName][0].gain.linearRampToValueAtTime(0,endTime );
            // const noteGain = context.createGain();
            // noteGain.gain.linearRampToValueAtTime(sustainLevel, context.currentTime + noteLength * attackTime);

            currentSynthNotes[noteName][1].stop(endTime);
            currentSynthNotes[noteName][2].stop(endTime);
            delete currentSynthNotes[noteName];
        }
    }


    // drawNotes(inputDiv, noteArray);
    // drawInputStaves()
// const notes = [
//     dotted(new StaveNote({ keys: ["e##/5"], duration: "8d" }).addModifier(new Accidental("##"))),
//     new StaveNote({ keys: ["b/4"], duration: "16" }).addModifier(new Accidental("b")),
//     new StaveNote({ keys: ["c/4"], duration: "8" }),
//     new StaveNote({ keys: ["d/2"], duration: "16" }),
//     new StaveNote({ keys: ["e/4"], duration: "16" }).addModifier(new Accidental("b")),
//     new StaveNote({ keys: ["d/4"], duration: "16" }),
//     new StaveNote({ keys: ["e/4"], duration: "16" }).addModifier(new Accidental("#")),
//     new StaveNote({ keys: ["g/4"], duration: "32" }),
//     new StaveNote({ keys: ["a/4"], duration: "32" }),
//     new StaveNote({ keys: ["g/4"], duration: "16" }),
//     new StaveNote({ keys: ["d/4"], duration: "q" }),
// ];

// const beams = Beam.generateBeams(notes);
// Formatter.FormatAndDraw(context, outputTrebleStave, notes);
// beams.forEach((b) => {
//     b.setContext(context).draw();
// });
    // let str = `MIDI message received at timestamp ${event.timeStamp}[${event.data.length} bytes]: `;
    // for (const character of event.data) {
    //   str += `0x${character.toString(16)} `;
    // }
    // console.log(str);

    // console.log(message.data);
}

// function getScaleModes(mode){
//     if(mode == "Major Mode")
//         return ["Major", "Dorian", "Phrygian", "Lydian", "Mixolydian","Natural Minor","Locrian"];
//     if(mode == "Melodic Minor Mode")
//         return ["Melodic Minor", "Dorian b2", "Lydian Augmented", "Lydian Dominant", "Aeolian Dominant","Half diminished","Altered"];
//     if(mode == "Harmonic Minor Mode")
//         return ["Harmonic Minor", "Locrian ♮6", "Major #5", "Dorian #4", "Phrygian Dominant","Lydian #2","Altered dominant bb7"];
//     if(mode == "Harmonic Major Mode")
//         return ["Harmonic Major", "Dorian b5", "Phrygian b4", "Lydian b3", "Mixolydian b2","Lydian Augmented #2","Locrian bb7"];
//     if(mode == "Diminished Mode")
//         return ["Diminished","Inverted Diminished"];
//     if(mode == "Whole Tone Mode")
//         return ["Whole Tone"];
//     if(mode == "Augmented Mode")
//         return ["Augmented", "Inverted Augmented"];
// }
// function getScaleIntervals(mode){
//     if(mode == "Major Mode")
//         return [2,2,1,2,2,2,1];
//     if(mode == "Melodic Minor Mode")
//         return [2,1,2,2,2,2,1];
//     if(mode == "Harmonic Minor Mode")
//         return [2,1,2,2,1,3,1];
//     if(mode == "Harmonic Major Mode")
//         return [2,2,1,2,1,3,1];
//     if(mode == "Diminished Mode")
//         return [2,1,2,1,2,1,2,1];
//     if(mode == "Whole Tone Mode")
//         return [2,2,2,2,2,2];
//     if(mode == "Augmented Mode")
//         return [3,1,3,1,3,1]

// }

// function generateScale(rootNoteName, mode, scale, direction){
//     var root = noteToMidi(rootNoteName) + 12;
//     // console.log('rootNote: ', rootNoteName, root);

//     var scales = getScaleModes(mode);
//     var intervals = getScaleIntervals(mode);

// // console.log(scales);
// // console.log(scale);
//     var selectedScale = scales.findIndex(element => element == scale);
//     var intervals = getScaleIntervals(mode);

//     var selectedIntervals = selectedScale == 0 ? intervals : intervals.slice(selectedScale).concat(intervals.slice(0,selectedScale));

    
//     var scaleNotes = [];
//     var currentNote = root;
//     scaleNotes.push(noteToName(currentNote));
//     if(direction != "down"){
//         for(const step of selectedIntervals){
//             if(step == 1)
//                 currentNote = currentNote + 1;
//             if(step == 2)
//                 currentNote = currentNote + 2;
//             if(step == 3)
//                 currentNote = currentNote + 3;
//             scaleNotes.push(noteToName(currentNote));
//         }
//     }else{
//         selectedIntervals = selectedIntervals.reverse();
//         for(const step of selectedIntervals){
//             if(step == 1)
//                 currentNote = currentNote - 1;
//             if(step == 2)
//                 currentNote = currentNote - 2;
//             if(step == 3)
//                 currentNote = currentNote - 3;
//             scaleNotes.push(noteToName(currentNote));
//         }
//     }
//     return scaleNotes;
// }

// var currentRoot =  parseInt($("#rootScaleSelect").val());
// var currentScale =  $('#keyScaleSelect').val();
// var currentMode = $("#modeScaleSelect").find(':selected')[0].innerHTML;
// var intervals = getScaleIntervals(currentMode);
// var currentIntervals = currentScale == 0 ? intervals : intervals.slice(currentScale).concat(intervals.slice(0,currentScale));

// function setScaleText(){
//     // console.log()
//     var mode = $("#modeScaleSelect").find(':selected')[0].innerHTML;
//     var scale = $("#keyScaleSelect").find(':selected')[0].innerHTML;

//     var scales = getScaleModes(mode);
//     var intervals = getScaleIntervals(mode);
//     var selectedScale = $('#keyScaleSelect').val();
//     var selectedIntervals = selectedScale == 0 ? intervals : intervals.slice(selectedScale).concat(intervals.slice(0,selectedScale));

//     // console.log('Selected Mode:', mode);
//     // console.log('Selected Scale: ', scales[$('#keyScaleSelect').val()]);
//     // console.log('Selected Intervals: ', selectedIntervals, selectedIntervals.reduce((partialSum, a) => partialSum + a, 0));

//     var outArray = [];
//     for(const step of selectedIntervals){
//         if(step == 1)
//             outArray.push("H");
//         if(step == 2)
//             outArray.push("W");
//         if(step == 3)
//             outArray.push("WH");
//     }
//     var outString = outArray.join(' - ');
//     document.getElementById("scaleText").innerHTML = outString;

//     var root =  parseInt($("#rootScaleSelect").val());
//     // console.log( root);
//     // console.log(noteToName(root));

//     var scaleNotes = [];
//     var currentNote = root;
//     scaleNotes.push(noteToName(currentNote));
//     for(const step of selectedIntervals){
//         if(step == 1)
//             currentNote = currentNote + 1;
//         if(step == 2)
//             currentNote = currentNote + 2;
//         if(step == 3)
//             currentNote = currentNote + 3;
//         scaleNotes.push(noteToName(currentNote));
//     }
//     highlightScaleNotes(scaleNotes)
//     var outString = scaleNotes.join(' - ');
//     document.getElementById("scaleText").innerHTML = outString;
//     // outputNoteArray = scaleNotes;
//     selectedNote = 0;
//     // highlightNotes(outputNoteArray[selectedNote])

//     // drawNotes(inputDiv, noteArray, true);
//     // drawNotes(outputDiv, outputNoteArray, false);

// }

// function randomIntFromInterval(min, max) { // min and max included 
//     return Math.floor(Math.random() * (max - min + 1) + min)
//   }

//   function shuffle(array) {
//     let currentIndex = array.length,  randomIndex;
  
//     // While there remain elements to shuffle.
//     while (currentIndex != 0) {
  
//       // Pick a remaining element.
//       randomIndex = Math.floor(Math.random() * currentIndex);
//       currentIndex--;
  
//       // And swap it with the current element.
//       [array[currentIndex], array[randomIndex]] = [
//         array[randomIndex], array[currentIndex]];
//     }
  
//     return array;
//   }


// var barCounter = 0;

// function getScaleDistances(currentRoot, currentMode, currentIntervals, targetMode){                
//     // console.log('Changing Scale')
//     var baseInterval = getScaleIntervals(targetMode);
//     var intervals = [baseInterval]
//     for(var i = 1; i < baseInterval.length && i < getScaleModes(targetMode).length; ++i)
//         intervals.push(baseInterval.slice(i).concat(baseInterval.slice(0,i)))
//     // console.log('candidate intervals:', intervals)
//     var intervalNotes = []
//     for(var i = 0; i < intervals.length; ++i){
//         var notes = [currentRoot]
//         for( var j = 0; j < intervals[i].length; ++j){
//             notes.push(notes.slice(-1)[0] + intervals[i][j]);
//         }
//         intervalNotes.push(notes);
//     }
//     // console.log('candidate notes:', intervalNotes);
//     var currentNotes = [currentRoot];
//     // console.log(currentIntervals)
//     for( var j = 0; j < currentIntervals.length; ++j){
//         currentNotes.push(currentNotes.slice(-1)[0] + currentIntervals[j]);
//     }  
//     // console.log('Current notes:' , currentNotes)
//     var distances = []
//     for(var i = 0; i < intervalNotes.length; ++i){
//         var distance = 0;
//         for(var j = 0; j < currentNotes.length; ++j){
//             distance = distance + Math.abs(intervalNotes[i][j] - currentNotes[j])
//         }
//         distances.push(distance)
//     }
//     // console.log('Distances:', distances)
//     return distances;
// }

// function chordToIntervals(chord){
//     var intervals = [];
//     console.log('Chord:', chord);
//     switch(chord){
//         case 0: intervals = [0]; break; //monad
//         case 1: intervals = [0, 4]; break; //diad
//         case 2: intervals = [0, 4, 7]; break; //maj
//         case 3: intervals = [0, 3, 7]; break; //min
//         case 4: intervals = [0, 2, 7]; break; //sus2
//         case 5: intervals = [0, 5, 7]; break; //sus4
//         case 6: intervals = [0, 4, 7, 10]; break; //7
//         case 7: intervals = [0, 4, 7, 11]; break; //maj7
//         case 8: intervals = [0, 3, 7, 10]; break; //min7
//         case 9: intervals = [0, 3, 6]; break; //dim
//         case 10: intervals = [0, 4, 8]; break; //aug
//         case 11: intervals = [0, 4, 7, 9]; break; //6
//         case 12: intervals = [0, 2, 4, 7]; break; //9
//         case 13: intervals = [0, 4, 7, 10, 14]; break; //11
//         case 14: intervals = [0, 3, 7, 11]; break; // minmaj7
//         case 15: intervals = [0, 4, 7, 11]; break; // maj9
//         case 16: intervals = [0, 4, 7, 5]; break; // add4
//         case 17: intervals = [0, 4, 7, 13]; break; // add9
//         case 18: intervals = [0, 4, 7, 9]; break; // maj6/9
//         case 19: intervals = [0, 3, 7, 9]; break; // min6/9
//     }
//     return intervals;
// }

// function chordStringToIndex(chordString){
//     switch(chordString){
//         case 'monad': return 0;
//         case 'diad': return 1;
//         case 'maj': case 'M': return 2;
//         case 'min': case 'm': return 3;
//         case 'sus2': return 4;
//         case 'sus4': return 5;
//         case '7': return 6;
//         case 'maj7': return 7;
//         case 'min7': return 8;
//         case 'dim': return 9;
//         case 'aug': return 10;
//         case '6': return 11;
//         case '9': return 12;    
//         case '11': return 13;
//         case 'minmaj7': return 14;
//         case 'maj9': return 15;
//         case 'add4': return 16;
//         case 'add9': return 17;
//         case 'maj6/9': return 18;
//         case 'min6/9': return 19;
//     }
//     return 2;
// }

// function generatePattern(priorDirection, priorRoot, priorMode, priorScale){
//     console.log('Calling generate Pattern with: ', priorDirection, priorRoot, priorMode, priorScale);

//     const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

//     var currentRoot = noteToMidi(priorRoot) + 12;
//     var currentScaleModes = getScaleModes(priorMode);
//     var currentSelectedScale = 0;
//     for( const mode of currentScaleModes){
//         if(mode == priorScale)
//             break;
//         currentSelectedScale++;
//     }
//     var currentScaleIntervals = getScaleIntervals(priorMode);
//     var currentIntervals = currentSelectedScale == 0 ? currentScaleIntervals : currentScaleIntervals.slice(currentSelectedScale).concat(currentScaleIntervals.slice(0,currentSelectedScale));     

//     var newRoot = currentRoot;
//     var newMode = priorMode;
//     var newScale = getScaleModes(newMode)[currentSelectedScale];

//     if(priorDirection == null){
//         // console.log('Initial Pattern');
//     }
//     else{
//         if($('#scaleChangeButton')[0].checked){
//             var scaleInterval = parseInt($('#scaleChangeInterval').val());
//             var modeInterval = parseInt($('#modeChangeInterval').val());
//             // console.log('BarCounter:', barCounter,'interval:', interval,'mod:', barCounter % scaleInterval)
//             if(barCounter % scaleInterval == 0 && (!$('#modeChangeButton')[0].checked || barCounter % modeInterval != 0)){
//                 var distances = getScaleDistances(newRoot, priorMode, currentIntervals, priorMode)

//                 var candidates = []
//                 for(var i = 0; i < distances.length; ++i){
//                     if(distances[i] > 0 && distances[i] <= parseInt($('#modeIntervalDistance').val())){
//                         candidates.push(i);
//                     }
//                 }
//                 // console.log('Candidate Intervals:', candidates);
//                 if(candidates.length > 0){
//                     var pickedIndex = randomIntFromInterval(0, candidates.length - 1);
//                     // console.log('Picked:', pickedIndex)
//                     // console.log(getScaleModes(newMode)[candidates[pickedIndex]])
//                     // console.log(distances[candidates[pickedIndex]])
//                     newScale = getScaleModes(newMode)[candidates[pickedIndex]];
//                 }       
//             }
//         }
//         if($('#modeChangeButton')[0].checked){
//             var scaleInterval = parseInt($('#scaleChangeInterval').val());
//             var modeInterval = parseInt($('#modeChangeInterval').val());
//             // console.log('BarCounter:', barCounter,'interval:', interval,'mod:', barCounter % modeInterval)
//             if(barCounter % modeInterval == 0){
//                 var distanceDict = {}

//                 distanceDict['Major Mode'] = getScaleDistances(newRoot, priorMode, currentIntervals, "Major Mode")
//                 distanceDict['Melodic Minor Mode'] = getScaleDistances(newRoot, priorMode, currentIntervals, "Melodic Minor Mode")
//                 distanceDict['Harmonic Minor Mode'] = getScaleDistances(newRoot, priorMode, currentIntervals, "Harmonic Minor Mode")
//                 distanceDict['Harmonic Major Mode'] = getScaleDistances(newRoot, priorMode, currentIntervals, "Harmonic Major Mode")
//                 distanceDict['Diminished Mode'] = getScaleDistances(newRoot, priorMode, currentIntervals, "Diminished Mode")
//                 distanceDict['Whole Tone Mode'] = getScaleDistances(newRoot, priorMode, currentIntervals, "Whole Tone Mode")
//                 distanceDict['Augmented Mode'] = getScaleDistances(newRoot, priorMode, currentIntervals, "Augmented Mode")

//                 var candidates = []
//                 for (const [key, distances] of Object.entries(distanceDict)){
//                     // console.log(key, distances)
//                     for(var i = 0; i < distances.length; ++i){
//                         if(distances[i] > 0 && distances[i] <= parseInt($('#modeIntervalDistance').val())){
//                             candidates.push([key, i]);
//                         }
//                     }
//                 }

//                 // console.log('Candidate Intervals:', candidates);
//                 if(candidates.length > 0){
//                     var pickedIndex = randomIntFromInterval(0, candidates.length - 1);
//                     console.log('Picked:', pickedIndex)
//                     // console.log(getScaleModes(newMode)[candidates[pickedIndex]])
//                     // console.log(distances[candidates[pickedIndex]])
//                     // console.log( candidates[pickedIndex])
//                     newMode = candidates[pickedIndex][0];
//                     newScale = getScaleModes(newMode)[candidates[pickedIndex][1]];
//                     // console.log( newScale)
//                 }       
//             }
//         }


//         if($('#rootProgressionCheckBox')[0].checked){
//             var currentRootName = noteToName(currentRoot);
//             // console.log('Current Root:', noteToName(currentRoot));
//             var currentKey = currentRootName.slice(0,-2);
//             // console.log('Current Key:', currentKey);

//             var currentMidi = currentRoot;
//             var minKey = currentMidi;
//             var maxKey = currentMidi;
//             if($('#lowestRootNoteSelection').val() == '0' && $('#highestRootNoteSelection').val() == '11'){
//                 // console.log('No Root Limitations');
//                 minKey = currentMidi - parseInt($('#rootJumpSelection').val())
//                 maxKey = currentMidi + parseInt($('#rootJumpSelection').val())
//             }
//             else{
//                 var currentIndex = 0;
//                 switch(currentKey){
//                     case 'A':  currentIndex = 0; break;
//                     case 'A#': currentIndex = 1; break;
//                     case 'B':  currentIndex = 2; break;
//                     case 'C':  currentIndex = 3; break;
//                     case 'C#': currentIndex = 4; break;
//                     case 'D':  currentIndex = 5; break;
//                     case 'D#': currentIndex = 6; break;
//                     case 'E':  currentIndex = 7; break;
//                     case 'F':  currentIndex = 8; break;
//                     case 'F#': currentIndex = 9; break;
//                     case 'G':  currentIndex = 10; break;
//                     case 'G#': currentIndex = 11; break;
//                 }
//                 minKey = Math.max(currentIndex - parseInt($('#rootJumpSelection').val()), parseInt($('#lowestRootNoteSelection').val()));
//                 maxKey = Math.min(currentIndex + parseInt($('#rootJumpSelection').val()), parseInt($('#highestRootNoteSelection').val()));
//                 // console.log('Index:', currentIndex)
//                 // console.log('min:', parseInt($('#lowestRootNoteSelection').val()))
//                 // console.log('max:', parseInt($('#highestRootNoteSelection').val()))
//                 // console.log('minKey:', minKey)
//                 // console.log('maxKey:', maxKey)
//                 // var tempRoot = randomIntFromInterval(minKey, maxKey);
//                 // var distance = tempRoot - currentIndex;
//                 minKey = newRoot + (minKey - currentIndex);
//                 maxKey = newRoot + (maxKey - currentIndex);
//             }
//             // console.log('Current Midi Root:', newRoot);
//             // console.log('Minimum Midi Key: ', minKey);
//             // console.log('Maixmum Midi Key: ', maxKey);

//             minKey = clamp(minKey, parseInt($('#lowestNoteSelection').val()), parseInt($('#highestNoteSelection').val()) - 12)
//             maxKey = clamp(maxKey, parseInt($('#lowestNoteSelection').val()), parseInt($('#highestNoteSelection').val()) - 12)

//             var interval = parseInt($('#rootJumpRandomSelection').val());
//             // console.log('BarCounter:', barCounter,'interval:', interval,'mod:', barCounter % interval)
//             if(barCounter % interval == 0){
//                 // console.log('Changing Key')
//                 if(minKey != maxKey){
//                     var candidateRoot = randomIntFromInterval(minKey, maxKey);
//                     while(candidateRoot == newRoot){
//                         candidateRoot = randomIntFromInterval(minKey, maxKey);
//                     }
//                     // console.log('Changed from ', newRoot, 'to', candidateRoot)
//                     newRoot = candidateRoot;
//                 }

//             }

            
//             // console.log('Picked Key: ', newRoot)
//         }
//     }
//     var selectedDirection = 'up';
//     switch($("#octaveProgressionMode").val()){
//         case "0": selectedDirection = 'up'; break;
//         case "1": selectedDirection = 'down'; break;
//         case "2": selectedDirection = 'up/down'; break;
//         case "3": selectedDirection = 'random'; break;
//         case "4": selectedDirection = 'pattern'; break;
//     }

//     var scaleNotes = generateScale(noteToName(newRoot), newMode, newScale, 'up');
//     // console.log('Generated Scale:', scaleNotes)

//     var notes = scaleNotes;

//     if(selectedDirection == 'down')
//         scaleNotes = scaleNotes.reverse();
//     else if(selectedDirection == 'up');
//     else if(selectedDirection == 'up/down'){
//         if(priorDirection == null){
//             if(Math.random() > 0.5){
//                 notes = scaleNotes.reverse();
//                 selectedDirection = 'down'
//             }
//             else
//                 selectedDirection = 'up';
//         }
//         else if(!$('#octaveProgressionCheckBox')[0].checked){
//             if(priorDirection == 'up'){
//                 notes = scaleNotes.reverse();
//                 selectedDirection = 'down';
//             }
//             if(priorDirection == 'down')
//                 selectedDirection = 'up';
//         }else{
//             if(Math.random() > 0.5){
//                 if(priorDirection == 'up'){
//                     notes = scaleNotes.reverse();
//                     selectedDirection = 'down';
//                 }
//                 if(priorDirection == 'down')
//                     selectedDirection = 'up';
//             }
//             else{
//                 if(priorDirection == 'up'){
//                     newRoot = newRoot + 12;
//                     if(newRoot >= parseInt($('#highestNoteSelection').val())){
//                         newRoot = newRoot - 12;
//                         notes = scaleNotes.reverse();
//                         selectedDirection = 'down';
//                     }
//                     else{
//                         scaleNotes = generateScale(noteToName(newRoot), newMode, newScale, 'up');
//                         notes = scaleNotes;
//                         selectedDirection = 'up';
//                     }
//                 }
//                 if(priorDirection == 'down'){
//                     newRoot = newRoot - 12;
//                     if(newRoot <= parseInt($('#lowestNoteSelection').val())){
//                         newRoot = newRoot + 12;
//                         selectedDirection = 'up';
//                     }else{
//                         // console.log('Going to ', noteToName(newRoot + 12), 'from', noteToName(newRoot))
//                         scaleNotes = generateScale(noteToName(newRoot), newMode, newScale, 'up');
//                         notes = scaleNotes.reverse();
//                         selectedDirection = 'down';
//                     }
//                 }

//             }

//         }
//     }else if(priorDirection != null && $('#octaveProgressionCheckBox')[0].checked){
//         var lowestNote = parseInt($('#lowestNoteSelection').val());
//         var highestNote = parseInt($('#highestNoteSelection').val());

//         // console.log('current Root: ', currentRoot, 'min: ', lowestNote,' max: ', highestNote)

//         var octavesAbove = Math.floor(((highestNote - currentRoot - 12) / 12));
//         var octavesBelow = Math.floor(((currentRoot - lowestNote) / 12));

//         if($('#octaveJumpRandomSelection').val() == '1'){
//             octavesAbove = clamp(octavesAbove,0, parseInt($('#octaveJumpSelection').val()));
//             octavesBelow = clamp(octavesBelow,0, parseInt($('#octaveJumpSelection').val()));
//             var octave = randomIntFromInterval(-octavesBelow, octavesAbove);
//             newRoot = newRoot + octave * 12;
//             scaleNotes = generateScale(noteToName(newRoot), newMode, newScale, 'up');
//             notes = scaleNotes;
//         }
//         if($('#octaveJumpRandomSelection').val() == '2'){
//             octavesAbove = clamp(octavesAbove,0, parseInt($('#octaveJumpSelection').val()));
//             octavesBelow = clamp(octavesBelow,0, parseInt($('#octaveJumpSelection').val()));

//             var flip = Math.random() > 0.5;
//             if(flip < 1/3){}
//             else if(flip < 2/3){
//                 var octave = 1;
//                 while(Math.random() > 0.5){
//                     octave += 1;
//                 }
//                 octave = Math.max(octave, octavesAbove);
//                 newRoot = newRoot + octave * 12;
//                 scaleNotes = generateScale(noteToName(newRoot), newMode, newScale, 'up');
//                 notes = scaleNotes;
//             }
//             else{
//                 var octave = 1;
//                 while(Math.random() > 0.5){
//                     octave += 1;
//                 }
//                 octave = -Math.max(octave, octavesBelow);
//                 newRoot = newRoot + octave * 12;
//                 scaleNotes = generateScale(noteToName(newRoot), newMode, newScale, 'up');
//                 notes = scaleNotes;
//             }
//         }

//         // console.log(octavesAbove, octavesBelow)
//     }
//     notes = notes.slice(0,-1);
//     var selectedNotesElements = [];

//     if($('#octaveProgressionMode').val() == '4'){
//         selectedDirection = $('#octaveProgressionSequence').find(':selected')[0].innerHTML;
//         if(parseInt($('#octaveProgressionSequence').val()) == 12){
//             // complex case
//             var complexNotes = [];

//             var scaleNotes0 = parseInt($('#pattern1').val())
//             var scaleNotes1 = parseInt($('#pattern2').val())
//             var scaleNotes2 = parseInt($('#pattern3').val())
//             var scaleNotes3 = parseInt($('#pattern4').val())
//             var scaleNotes4 = parseInt($('#pattern5').val())
//             var scaleNotes5 = parseInt($('#pattern6').val())
//             var scaleNotes6 = parseInt($('#pattern7').val())
//             var scaleNotes7 = parseInt($('#pattern8').val())
//             selectedNotesElements = [scaleNotes0, scaleNotes1, scaleNotes2, scaleNotes3, scaleNotes4, scaleNotes5, scaleNotes6, scaleNotes7];
            
//             var scaleNotest = [scaleNotes0, scaleNotes1, scaleNotes2, scaleNotes3, scaleNotes4, scaleNotes5, scaleNotes6, scaleNotes7];
//             // var scaleNotest = [scaleNotes0, scaleNotes1, scaleNotes2];

//             for (var i = 0; i < scaleNotest.length; ++i){
//                 if (scaleNotest[i] != 7){
//                     complexNotes.push(notes[scaleNotest[i]]);
//                 }
//             }
//             notes = complexNotes;

//             console.log('Complex Notes:', notes);


//         }else if ($('#octaveProgressionSequence').val() == '13'){
//             // no progression
//             var noteStringInput = $('#customPatternInput').val() || '';

//             // Parse the string into an array of numbers, ignoring invalid entries
//             var selectedNotesElements_ = noteStringInput.split(' ');
//             // Fallback to default if input is empty or invalid
//             if (selectedNotesElements_.length === 0) {
//                 selectedNotesElements_ = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
//             }
//             for (var i = 0; i < selectedNotesElements_.length; ++i){
//                 selectedNotesElements_[i] = selectedNotesElements_[i].trim();
//                 console.log('Selected Note Element:', selectedNotesElements_[i]);
//                 if(selectedNotesElements_[i][0] == 'C' || selectedNotesElements_[i][0] == 'D' || selectedNotesElements_[i][0] == 'E'|| selectedNotesElements_[i][0] == 'F' || selectedNotesElements_[i][0] == 'G' || selectedNotesElements_[i][0] == 'A' || selectedNotesElements_[i][0] == 'B'){
//                     selectedNotesElements.push(selectedNotesElements_[i]);
//                 }
//             }


//             console.log('Custom Pattern Input:', selectedNotesElements);
//             // rootNoteName
//             notes = [];
//             for (var i = 0; i < selectedNotesElements.length; ++i){
//                 var substring = selectedNotesElements[i][0];
//                 if(substring == 'C' || substring == 'D' || substring == 'E' || substring == 'F' || substring == 'G' || substring == 'A' || substring == 'B'){
//                     console.log('Valid Note:', selectedNotesElements[i], 'Root Note: ', notes[0]);
//                     var rootNote = newRoot;
//                     var rootOctave = Math.floor(rootNote / 12);
//                     var currentNote = noteToMidi(substring + "/" + rootOctave);
//                     if(currentNote < rootNote){
//                         rootOctave += 1;
//                         currentNote = noteToMidi(substring + "/" + rootOctave);
//                     }
//                     // var noteName = substring + rootOctave;
//                     var noteName = noteToName(currentNote);
//                     notes.push(noteName);
//                     console.log('Custom Note:', noteName);
//                 }
//             }
                    
//             // notes = scaleNotes;
//         }       
//         else{
//         switch(parseInt($('#octaveProgressionSequence').val())){
//             case 0: break;
//             case 1: notes = shuffle(notes); break;
//             case 2: notes = [notes[0],notes[5], notes[6]]; break;
//             case 3: notes = [notes[0],notes[5], notes[2], notes[6]]; break;
//             case 4: notes = [notes[0],notes[3], notes[6]]; break;
//             case 5: notes = [notes[0],notes[3], notes[4], notes[0]]; break;
//             case 6: notes = [notes[0],notes[3], notes[0]]; break;
//             case 7: notes = [notes[0],notes[3], notes[4]]; break;
//             case 8: notes = [notes[5],notes[6], notes[0], notes[0]]; break;
//             case 9: notes = [notes[1],notes[4], notes[0]]; break;
//             case 10: notes = [notes[0],notes[0], notes[0], notes[0], notes[3], notes[3], notes[0], notes[0], notes[4], notes[3], notes[0], notes[0]]; break;
//             case 11: notes = [notes[0],notes[0], notes[0], notes[0], notes[3], notes[3], notes[0], notes[0], notes[4], notes[3], notes[0], notes[4]]; break;
//         }
//         console.log('Selected Notes:', notes);
//     }
//     }

//     for(var i = 0; i < parseInt($('#randomScaleSettings').val()); ++i){
//         var indexA = notes.length * Math.random() | 0;
//         var indexB = notes.length * Math.random() | 0;
//         var temp = notes[indexB];
//         notes[indexB] = notes[indexA];
//         notes[indexA] = temp;
//     }


//     // if($('#noteRemovalSettings').val() > 0){
//     if( parseInt($('#noteRemovalSettings').val()) == 6){
//         // console.log('notes before removal:', notes)
//         var index = notes.length * Math.random() | 0;
//         notes = [notes[index]];
//         // console.log('notes after removal:', notes, index)
//     }else{
//     for(var i = 0; i < parseInt($('#noteRemovalSettings').val()); ++i){
//         notes.splice(notes.length * Math.random() | 0, 1)
//     }
    
// }
//     // }
// var chordedNotes = []
//     if($('#chordCheckBox')[0].checked){
//         var reconstructedIntervals = []
//         for(var i = 1; i < scaleNotes.length; ++i)
//             reconstructedIntervals.push(noteToMidi(scaleNotes[i]) - noteToMidi(scaleNotes[i-1]))
//         // console.log(scaleNotes)
//         // console.log(notes)
//         // console.log('intervals were:', reconstructedIntervals)
//         reconstructedIntervals = reconstructedIntervals.concat(reconstructedIntervals)
//         reconstructedIntervals = reconstructedIntervals.concat(reconstructedIntervals)
//         var complexMode = false;
//         var chords = []
//         if($('#octaveProgressionMode').val() == '4'){
//             selectedDirection = $('#octaveProgressionSequence').find(':selected')[0].innerHTML;
//             if(parseInt($('#octaveProgressionSequence').val()) == 12){
//                 complexMode = true;
//                 var chord1 = parseInt($('#chord1').val());
//                 var chord2 = parseInt($('#chord2').val());
//                 var chord3 = parseInt($('#chord3').val());
//                 var chord4 = parseInt($('#chord4').val());
//                 var chord5 = parseInt($('#chord5').val());
//                 var chord6 = parseInt($('#chord6').val());
//                 var chord7 = parseInt($('#chord7').val());
//                 var chord8 = parseInt($('#chord8').val());
//                 var chordst = [chord1, chord2, chord3, chord4, chord5, chord6, chord7, chord8];
//                 console.log('Chord Patterns:', chordst);
//                 for (var i = 0; i < chordst.length; ++i){
//                     if(selectedNotesElements[i] != 7){
//                         chords.push(chordst[i]);
//                         // console.log('Chord:', chordst[i], ' at ', i, ' was selected');
//                     }
//                 }
//             }
//             else if ($('#octaveProgressionSequence').val() == '13'){
//                 complexMode = true;
//                 for (var i = 0; i < selectedNotesElements.length; ++i){
//                     var currentNote = selectedNotesElements[i];
//                     if(currentNote.length == 1){
//                         chords.push(2);
//                     }
//                     else{
//                         var substring = currentNote.slice(1);
//                         // You can use substring as needed here
//                         chords.push(chordStringToIndex(substring));
//                     }
//                 }
//             }
//         }
//         console.log('Chords:', chords);

//         for(var i = 0; i < notes.length; ++i){
//             var chord = []
//             var noteIndex = scaleNotes.findIndex((element) => element  == notes[i]);
//             chord.push(notes[i])
//             if(!complexMode){
//                 for(var c = 1; c < parseInt($('#chordDepthSelection').val()); ++c){
//                     var newNoteMidi = noteToMidi(chord.slice(-1)[0]) + 12 + reconstructedIntervals[noteIndex + 2 * c - 1] + reconstructedIntervals[noteIndex + 2 * c - 2]
//                     if(newNoteMidi > parseInt($('#highestNoteSelection').val()) || newNoteMidi < parseInt($('#lowestNoteSelection').val()))
//                         break;
//                     chord.push(noteToName(newNoteMidi))
//                 }
//             }
//             else{
//                 var currentChord = chords[i % chords.length];
//                 var currentChordIntervals = chordToIntervals(currentChord);
//                 console.log('Current Chord:', currentChord, 'Intervals:', currentChordIntervals);
//                 var rootNodeMidi = noteToMidi(chord[0]);
//                 console.log('Root Node Midi:', rootNodeMidi, 'Root Node Name:', chord[0]);
//                 for(var c = 1; c < currentChordIntervals.length; ++c){
//                     chord.push(noteToName(rootNodeMidi + currentChordIntervals[c] + 12));
//                 }
//                 console.log('Chord:', chord, ' at ', i, ' was selected');

//             }
//             // console.log('Note: ', notes[i], ' was at ', noteIndex);
//             // console.log('Chord:', chord)

//             var inversion = parseInt($('#chordInversionSelection').val())
//             var inversionStep = Math.ceil((noteToMidi(chord.slice(-1)[0]) - noteToMidi(chord[0])) / 12) * 12;
//             var inversions = [chord];
//             for(var c = 0; c < chord.length - 1; ++c){
//                 var referenceChord = inversions.slice(-1)[0]
//                 var invertedChord = []
//                 for(var j = 0; j < chord.length; ++j){
//                     var newNote = noteToMidi(referenceChord[c]) + 12 + inversionStep;
//                     // console.log(newNote, noteToMidi(referenceChord[c]) )
//                     if(newNote >= parseInt($('#highestNoteSelection').val()) || newNote < parseInt($('#lowestNoteSelection').val()))
//                         newNote = noteToMidi(referenceChord[c] + 12)
//                     // console.log(newNote, noteToName)
//                     invertedChord[j] = j != c ? referenceChord[j] : noteToName(newNote);
//                 }
//                 console.log(referenceChord, '-> ', invertedChord)
                
//                 inversions.push(invertedChord);
//             }
//             switch(inversion){
//                 case 2: chordedNotes.push(chord); break;
//                 case 3: chordedNotes.push(inversions[1]); break;
//                 case 4:{
//                     for(var inverted of inversions){
//                         chordedNotes.push(inverted);
//                     }
//                     break;
//                 }
//                 case 5:{
//                     inversions = inversions.reverse()
//                     for(var inverted of inversions){
//                         chordedNotes.push(inverted);
//                     }
//                     break;
//                 }
//                 case 6:{
//                     inversions = inversions.concat(inversions.slice(0,-1).reverse()).slice(0,-1)
//                     for(var inverted of inversions){
//                         chordedNotes.push(inverted);
//                     }
//                     break;
//                 }
//                 case 7:{
//                     inversions = inversions.concat(inversions.slice(0,-1).reverse()).slice(0,-1)
//                     inversions = shuffle(inversions)
//                     for(var inverted of inversions){
//                         chordedNotes.push(inverted);
//                     }
//                     break;
//                 }
//                 case 8: chordedNotes.push(inversions[randomIntFromInterval(0,inversions.length-1)]); break;
//             }

            
//         }
//         notes = chordedNotes;
        
//         if($('#arpegioButton')[0].checked){
//             var newNotes = []
//             for(var chord of notes){
//                 for(var note of chord){
//                     newNotes.push(note);
//                 }
//             }
//             notes = newNotes
//         }

//     }

//     var scale = {
//         notes: notes, 
//         scaleNotes: scaleNotes,
//         scale: newScale, 
//         mode: newMode, 
//         root: noteToName(newRoot), 
//         dir: selectedDirection, 
//         chorded: chordedNotes
//         // intervals : currentIntervals
//     } ;
    
//     return scale;

// }

// function generateFollowUpNotes(){
//     var lastNotes = outputNoteArray.slice(-1)[0];
//     // console.log('last note array:', lastNotes);

//     // currentRoot =  60 + parseInt($("#rootScaleSelect").val());
//     // currentScale =  $('#keyScaleSelect').val();
//     // currentMode = $("#modeScaleSelect").find(':selected')[0].innerHTML;
//     intervals = getScaleIntervals(currentMode);
//     // currentIntervals = currentScale == 0 ? intervals : intervals.slice(currentScale).concat(intervals.slice(0,currentScale));     

//     var scales = getScaleModes(currentMode);
//     // console.log('Generating Scale');
//     // var newDir = lastNotes['dir'] == 'up'? 'down' : 'up';
//     var newDir = Math.random() > 0.5 ? 'down' : 'up';

//     // console.log('Old direction:', lastNotes['dir']);
//     // console.log('New direction:', newDir);

//     var startingNote = 
//         lastNotes['dir'] == 'up' ? 
//             noteToName(noteToMidi(lastNotes['notes'][0]) + 24 ) :
//             noteToName(noteToMidi(lastNotes['notes'][0]) + 0 )
//     var bound = noteToMidi(startingNote) + 12 + (newDir == 'up' ? 12 : -12);
//     if( bound > 108 || bound < 21 )
//         newDir = newDir == 'down' ? 'up' : 'down';


//     currentRoot = newDir == 'up'  ? noteToMidi(startingNote) + 12 : noteToMidi(startingNote);

//     // console.log('Prior note:', lastNotes['notes'].slice(-1)[0]);
//     // console.log('Starting note: ', startingNote)
//     // console.log('Interval Step', lastNotes['intervals'].slice(-1)[0],  lastNotes['intervals'])
//     var scaleNotes = generateScale(startingNote, currentMode, scales[currentScale], newDir);
//     // console.log(scaleNotesUp.slice(-1));
//     // console.log(scaleNotesUp);
//     // var scaleNotesDown = generateScale(scaleNotesUp.slice(-1)[0], currentMode, scales[currentScale], 'down');

//     // console.log(scaleNotesDown);
//     // var scaleNotes = scaleNotesUp.slice(0,-1).concat( scaleNotesDown.slice(0,-1));

//     // document.getElementById("scaleText").innerHTML = outString;
//     outputNoteArray.push(
//         {notes: scaleNotes.slice(0,-1), scale: scales[currentScale], mode: currentMode, root: noteToName(currentRoot), dir: newDir, intervals : 
//             newDir == 'down' ? intervals.reverse() : intervals}, 
//         // {notes: scaleNotesDown.slice(0,-1), scale: scales[currentScale], mode: currentMode, root: noteToName(currentRoot), dir: 'down'}
//     );
// }

// function generateOutputNotes(reset = true){
//     if(reset){
//         barCounter = 0;
//         outputNoteArray = []
//     }

//     outputNoteArray.push(
//         generatePattern(null, 
//             $('#rootScaleSelect').find(':selected')[0].innerHTML, 
//             $('#modeScaleSelect').find(':selected')[0].innerHTML, 
//             $("#keyScaleSelect").find(':selected')[0].innerHTML)
//         );
//     barCounter++;

//     var la = parseInt($("#lookaheadSelection").val());
//     for(var i = 0; i < la; ++ i){
//         const prior = outputNoteArray.slice(-1)[0]
//         outputNoteArray.push(generatePattern(prior['dir'], prior['root'], prior['mode'], prior['scale']));
//         barCounter++;
//     }

//     selectedNote = 0;
//     // highlightNotes(outputNoteArray[0]['scaleNotes'][selectedNote])
//     highlightNotes(outputNoteArray[0]['notes'][selectedNote])

//     drawNotes(inputDiv, noteArray, true);
//     drawNotes(outputDiv, outputNoteArray, false);

//     return;
    
// }


// setScaleText();
// generateOutputNotes(true);

// console.log('outputNoteArray',outputNoteArray)
// console.log('outputNoteArray[0][notes]',outputNoteArray[0]['notes'])
// console.log('outputNoteArray[0][notes][selectedNote]',outputNoteArray[0]['notes'][selectedNote])

document.getElementById("inputText").innerHTML = 'You have pressed: ';
// document.getElementById("outputText").innerHTML = 'You should press: ' + outputNoteArray[0]['notes'][selectedNote];

// $('#modeScaleSelect').on('change', function (e) {
//     // console.log($("#modeScaleSelect").find(':selected')[0].innerHTML)
    
//     var scales = getScaleModes($("#modeScaleSelect").find(':selected')[0].innerHTML);

//     var i = 0;
//     var parsedScale = []
//     for(var scale of scales){
//         parsedScale.push('<option value ="' + i++ + '">' + scale + "</option>"); 
//     }
//     var scaleOptions = parsedScale.join(' ');
//     // console.log(scaleOptions);
    
//     $("#keyScaleSelect").html(scaleOptions);
//     $("#keyScaleSelect").val(0);
    
//     generateOutputNotes(true);

//     setScaleText()
// });
// $('#keyScaleSelect').on('change', function (e) {
//     generateOutputNotes(true);setScaleText()});
// $('#rootScaleSelect').on('change', function (e) {
//     generateOutputNotes(true);setScaleText()});

// $('#regenButton').on('click', function(e){
//     generateOutputNotes(true);
//     setScaleText()
//     currentBarIndex = 0;
//     currentNoteIndex = 0;
// })


// $('#octaveProgressionMode').on('change', function (e) {
//     if($('#octaveProgressionMode').val() == '4'){
//         $('#octaveProgressionSequence').prop("disabled", false);
//     }
//     else
//         $('#octaveProgressionSequence').prop("disabled", true);
//     generateOutputNotes(true);
//     setScaleText()
//     // generateOutputNotes(true);setScaleText()
// });
// $('#octaveProgressionSequence').on('change', function (e) {
//     generateOutputNotes(true);
//     setScaleText()
//     // generateOutputNotes(true);setScaleText()
// });

// $('#arpegioButton').on('change', function (e) {
//     generateOutputNotes(true);
//     setScaleText()
//     // generateOutputNotes(true);setScaleText()
// });

// $('#pianoCheckBox').on('change', function (e) {
//     if($('#pianoCheckBox')[0].checked){
//         $('#container')[0].style.display = "flex"
//     }else{
//         $('#container')[0].style.display = "none"

//     }
// });
// $('#promptCheckBox').on('change', function (e) {
//     if($('#promptCheckBox')[0].checked){
//         $('#outputContainer')[0].style.display = "flex"
//     }else{
//         $('#outputContainer')[0].style.display = "none"

//     }
// });
$('#stavesCheckBox').on('change', function (e) {
    // console.log('stavebutton')
    // console.log($('#stavesCheckBox')[0].checked)
    // console.log($('#staveContainerBox')[0])
    // console.log($('#staveContainerBox')[0].style.display)
    if($('#stavesCheckBox')[0].checked){
        $('#staveContainerBox')[0].style.display = "flex"
    }else{
        $('#staveContainerBox')[0].style.display = "none"
    }
});



// console.log($('#rootScaleSelect').val())
// console.log($('#modeScaleSelect').val())
// console.log($('#keyScaleSelect').val())

// console.log($('#octaveProgressionMode').val())
// console.log($('#octaveProgressionSequence').val())

// console.log($('#randomScaleSettings').val())
// console.log($('#noteRemovalSettings').val())

// function encodeConfig(){
//     var rootScaleSelect = $('#rootScaleSelect').val().padStart(3,'0')
//     var modeScaleSelect = $('#modeScaleSelect').val().padStart(1,'0')
//     var keyScaleSelect = $('#keyScaleSelect').val().padStart(1,'0')
//     var octaveProgressionMode = $('#octaveProgressionMode').val().padStart(2,'0')
//     var octaveProgressionSequence = $('#octaveProgressionSequence').val().padStart(2,'0')
//     var randomScaleSettings = $('#randomScaleSettings').val().padStart(1,'0')
//     var noteRemovalSettings = $('#noteRemovalSettings').val().padStart(1,'0')

//     var scaleSettings = rootScaleSelect + modeScaleSelect + keyScaleSelect + octaveProgressionMode + octaveProgressionSequence + randomScaleSettings + noteRemovalSettings;

//     var scaleChangeButton = $('#scaleChangeButton')[0].checked ? '1' : '0'
//     var scaleChangeInterval = $('#scaleChangeInterval').val().padStart(1,'0')
//     var modeChangeButton = $('#modeChangeButton')[0].checked ? '1' : '0'
//     var modeChangeInterval = $('#modeChangeInterval').val().padStart(1,'0')
//     var modeIntervalDistance = $('#modeIntervalDistance').val().padStart(2,'0')

//     var scaleProgressionSettings = scaleChangeButton + scaleChangeInterval + modeChangeButton + modeChangeInterval + modeIntervalDistance


//     var rootProgressionCheckBox = $('#rootProgressionCheckBox')[0].checked ? '1' : '0'
//     var lowestRootNoteSelection = $('#lowestRootNoteSelection').val().padStart(2,'0')
//     var highestRootNoteSelection = $('#highestRootNoteSelection').val().padStart(2,'0')
//     var rootJumpSelection = $('#rootJumpSelection').val().padStart(2,'0')
//     var rootJumpRandomSelection = $('#rootJumpRandomSelection').val().padStart(1,'0')
//     var rootJumpRandomMode = $('#rootJumpRandomMode').val().padStart(1,'0')

//     var rootSettings = rootProgressionCheckBox + lowestRootNoteSelection + highestRootNoteSelection + rootJumpSelection + rootJumpRandomSelection + rootJumpRandomMode

//     var octaveProgressionCheckBox = $('#octaveProgressionCheckBox')[0].checked ? '1' : '0'
//     var lowestNoteSelection = $('#lowestNoteSelection').val().padStart(3,'0')
//     var highestNoteSelection = $('#highestNoteSelection').val().padStart(3,'0')
//     var octaveJumpSelection = $('#octaveJumpSelection').val().padStart(1,'0')
//     var octaveJumpRandomSelection = $('#octaveJumpRandomSelection').val().padStart(1,'0')

//     var octaveSettings = octaveProgressionCheckBox + lowestNoteSelection + highestNoteSelection + octaveJumpSelection + octaveJumpRandomSelection

//     var chordCheckBox = $('#chordCheckBox')[0].checked ? '1' : '0'
//     var chordDepthSelection = $('#chordDepthSelection').val().padStart(2,'0')
//     var chordInversionSelection = $('#chordInversionSelection').val().padStart(2,'0')
//     var arpegioButton = $('#arpegioButton')[0].checked ? '1' : '0'

//     var chordSettings = chordCheckBox + chordDepthSelection +  chordInversionSelection + arpegioButton;
    
//     var modeSignatureSelect = $('#modeSignatureSelect').val().padStart(1,'0')
//     var keySignatureSelect = $('#keySignatureSelect').val().padStart(2,'0')
//     var lookaheadSelection = $('#lookaheadSelection').val().padStart(1,'0')
//     var pianoCheckBox = $('#pianoCheckBox')[0].checked ? '1' : '0'
//     var stavesCheckBox = $('#stavesCheckBox')[0].checked ? '1' : '0'
//     var promptCheckBox = $('#promptCheckBox')[0].checked ? '1' : '0'

//     var generalSettings = modeSignatureSelect + keySignatureSelect + lookaheadSelection + pianoCheckBox + stavesCheckBox + promptCheckBox;

//     console.log(generalSettings);



//     var settings = scaleSettings + scaleProgressionSettings + rootSettings + octaveSettings + chordSettings + generalSettings;
    
//     var yoloMode = $('#yoloMode')[0].checked ? '1' : '0'
//     var synthesizerEnabled = $('#synthEnableBox')[0].checked ? '1' : '0'
//     var pattern1 = $('#pattern1').val().padStart(2,'0')
//     var pattern2 = $('#pattern2').val().padStart(2,'0')
//     var pattern3 = $('#pattern3').val().padStart(2,'0')
//     var pattern4 = $('#pattern4').val().padStart(2,'0')
//     var pattern5 = $('#pattern5').val().padStart(2,'0')
//     var pattern6 = $('#pattern6').val().padStart(2,'0')
//     var pattern7 = $('#pattern7').val().padStart(2,'0')
//     var pattern8 = $('#pattern8').val().padStart(2,'0')
//     var chord1 = $('#chord1').val().padStart(2,'0')
//     var chord2 = $('#chord2').val().padStart(2,'0')
//     var chord3 = $('#chord3').val().padStart(2,'0')
//     var chord4 = $('#chord4').val().padStart(2,'0')
//     var chord5 = $('#chord5').val().padStart(2,'0')
//     var chord6 = $('#chord6').val().padStart(2,'0')
//     var chord7 = $('#chord7').val().padStart(2,'0')
//     var chord8 = $('#chord8').val().padStart(2,'0')
//     var patternSettings = synthesizerEnabled + pattern1 + pattern2 + pattern3 + pattern4 + pattern5 + pattern6 + pattern7 + pattern8 + chord1 + chord2 + chord3 + chord4 + chord5 + chord6 + chord7 + chord8;

//     settings = settings + yoloMode + patternSettings;
//     console.log('btn', settings)
//     $('#presetCode').val(settings)

//     return settings
// }

// function decodeConfig(settings){
//     var scaleSettings = settings.slice(0, 11)
//     settings = settings.slice(11);
//     $('#rootScaleSelect').val(parseInt(scaleSettings.slice(0,3),10))
//     $('#modeScaleSelect').val(parseInt(scaleSettings.slice(3,4),10))
//     $('#keyScaleSelect').val(parseInt(scaleSettings.slice(4,5),10))
//     $('#octaveProgressionMode').val(parseInt(scaleSettings.slice(5,7),10))
//     $('#octaveProgressionSequence').val(parseInt(scaleSettings.slice(7,9),10))
//     $('#randomScaleSettings').val(parseInt(scaleSettings.slice(9,10),10))
//     $('#noteRemovalSettings').val(parseInt(scaleSettings.slice(10,11),10))

//     var scaleProgressionSettings = settings.slice(0,6)
//     settings = settings.slice(6);
//     $('#scaleChangeButton')[0].checked = parseInt(scaleProgressionSettings.slice(0,1),10) == 1
//     $('#scaleChangeInterval').val(parseInt(scaleProgressionSettings.slice(1,2),10))
//     $('#modeChangeButton')[0].checked = parseInt(scaleProgressionSettings.slice(2,3),10) == 1
//     $('#modeChangeInterval').val(parseInt(scaleProgressionSettings.slice(3,4),10))
//     $('#modeIntervalDistance').val(parseInt(scaleProgressionSettings.slice(4,6),10))

//     var rootSettings = settings.slice(0, 9);
//     settings = settings.slice(9);
//     $('#rootProgressionCheckBox')[0].checked = parseInt(rootSettings.slice(0,1),10) == 1
//     $('#lowestRootNoteSelection').val(parseInt(rootSettings.slice(1,3),10))
//     $('#highestRootNoteSelection').val(parseInt(rootSettings.slice(3,5),10))
//     $('#rootJumpSelection').val(parseInt(rootSettings.slice(5,7),10))
//     $('#rootJumpRandomSelection').val(parseInt(rootSettings.slice(7,8),10))
//     $('#rootJumpRandomMode').val(parseInt(rootSettings.slice(8,9),10))

//     var octaveSettings = settings.slice(0,9);
//     settings = settings.slice(9);
//     $('#octaveProgressionCheckBox')[0].checked = parseInt(octaveSettings.slice(0,1),10) == 1
//     $('#lowestNoteSelection').val(parseInt(octaveSettings.slice(1,4),10))
//     $('#highestNoteSelection').val(parseInt(octaveSettings.slice(4,7),10))
//     $('#octaveJumpSelection').val(parseInt(octaveSettings.slice(7,8),10))
//     $('#octaveJumpRandomSelection').val(parseInt(octaveSettings.slice(8,9),10))

//     var chordSettings = settings.slice(0,6);
//     settings = settings.slice(6);
//     $('#chordCheckBox')[0].checked = parseInt(chordSettings.slice(0,1),10) == 1
//     $('#chordDepthSelection').val(parseInt(chordSettings.slice(1,3),10))
//     $('#chordInversionSelection').val(parseInt(chordSettings.slice(3,5),10))
//     $('#arpegioButton')[0].checked = parseInt(chordSettings.slice(5,6),10) == 1

//     var generalSettings = settings.slice(0,7);
//     settings = settings.slice(7);
//     $('#modeSignatureSelect').val(parseInt(generalSettings.slice(0,1),10))
//     $('#keySignatureSelect').val(parseInt(generalSettings.slice(1,3),10))
//     $('#lookaheadSelection').val(parseInt(generalSettings.slice(3,4),10))
//     $('#pianoCheckBox')[0].checked = parseInt(generalSettings.slice(4,5),10) == 1
//     $('#stavesCheckBox')[0].checked = parseInt(generalSettings.slice(5,6),10) == 1
//     $('#promptCheckBox')[0].checked = parseInt(generalSettings.slice(6,7),10) == 1


//     console.log(scaleSettings, scaleProgressionSettings, rootSettings, octaveSettings, chordSettings, generalSettings);
    
//     var yoloMode = parseInt(settings.slice(0,1),10) == 1;
//     $('#yoloMode')[0].checked = yoloMode;
//     settings = settings.slice(1);

//     var synthesizerEnabled = parseInt(settings.slice(0,1),10) == 1;
//     $('#synthEnableBox')[0].checked = synthesizerEnabled;
//     settings = settings.slice(1);

//     var pattern1 = parseInt(settings.slice(0,2),10);
//     var pattern2 = parseInt(settings.slice(2,4),10);
//     var pattern3 = parseInt(settings.slice(4,6),10);
//     var pattern4 = parseInt(settings.slice(6,8),10);
//     var pattern5 = parseInt(settings.slice(8,10),10);
//     var pattern6 = parseInt(settings.slice(10,12),10);
//     var pattern7 = parseInt(settings.slice(12,14),10);
//     var pattern8 = parseInt(settings.slice(14,16),10);
//     $('#pattern1').val(pattern1);
//     $('#pattern2').val(pattern2);
//     $('#pattern3').val(pattern3);
//     $('#pattern4').val(pattern4);
//     $('#pattern5').val(pattern5);
//     $('#pattern6').val(pattern6);
//     $('#pattern7').val(pattern7);
//     $('#pattern8').val(pattern8);

//     var chord1 = parseInt(settings.slice(16,18),10);
//     var chord2 = parseInt(settings.slice(18,20),10);
//     var chord3 = parseInt(settings.slice(20,22),10);
//     var chord4 = parseInt(settings.slice(22,24),10);
//     var chord5 = parseInt(settings.slice(24,26),10);
//     var chord6 = parseInt(settings.slice(26,28),10);    
//     var chord7 = parseInt(settings.slice(28,30),10);
//     var chord8 = parseInt(settings.slice(30,32),10);
//     $('#chord1').val(chord1);
//     $('#chord2').val(chord2);
//     $('#chord3').val(chord3);
//     $('#chord4').val(chord4);
//     $('#chord5').val(chord5);   
//     $('#chord6').val(chord6);
//     $('#chord7').val(chord7);
//     $('#chord8').val(chord8);

//     var scales = getScaleModes($("#modeScaleSelect").find(':selected')[0].innerHTML);

//     var i = 0;
//     var parsedScale = []
//     for(var scale of scales){
//         parsedScale.push('<option value ="' + i++ + '">' + scale + "</option>"); 
//     }
//     var scaleOptions = parsedScale.join(' ');
//     // console.log(scaleOptions);
    
//     $("#keyScaleSelect").html(scaleOptions);
//     $("#keyScaleSelect").val(parseInt(scaleSettings.slice(4,5),10));
    
//     if($('#octaveProgressionMode').val() == '4'){
//         $('#octaveProgressionSequence').prop("disabled", false);
//     }
//     else
//         $('#octaveProgressionSequence').prop("disabled", true);

//     generateOutputNotes(true);

//     setScaleText()
//     if($('#stavesCheckBox')[0].checked){
//         $('#staveContainerBox')[0].style.display = "flex"
//     }else{
//         $('#staveContainerBox')[0].style.display = "none"
//     }
//     if($('#promptCheckBox')[0].checked){
//         $('#outputContainer')[0].style.display = "flex"
//     }else{
//         $('#outputContainer')[0].style.display = "none"

//     }
//     if($('#pianoCheckBox')[0].checked){
//         $('#container')[0].style.display = "flex"
//     }else{
//         $('#container')[0].style.display = "none"

//     }
// }


// var encoded = encodeConfig();


// var configToLoad = encoded;//'068240408001111061001106111021108511040210062';

function parse_query_string(query) {
    var vars = query.split("&");
    var query_string = {};
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      var key = decodeURIComponent(pair.shift());
      var value = decodeURIComponent(pair.join("="));
      // If first entry with this name
      if (typeof query_string[key] === "undefined") {
        query_string[key] = value;
        // If second entry with this name
      } else if (typeof query_string[key] === "string") {
        var arr = [query_string[key], value];
        query_string[key] = arr;
        // If third or later entry with this name
      } else {
        query_string[key].push(value);
      }
    }
    return query_string;
  }

const queryString = window.location.search;
console.log(parse_query_string(queryString));
var parsedQuery = parse_query_string(queryString);
var configToLoad = '068240408001111061001106111021108511040210062'; // default config
if("?config" in  parsedQuery)
  configToLoad = parsedQuery['?config']
// window.location.search = "?BAKA";
// const urlParams = new URLSearchParams(queryString);
// console.log(urlParams)

// decodeConfig(configToLoad);
// var encoded = encodeConfig();

// $('#encodeButton').on('click', function(event){
//     var encoded = encodeConfig();
//     if (window.history.pushState) {
//         var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?config="+encoded;;
//         window.history.pushState({path:newurl},'',newurl);
//     }
//     // window.location.search = 
// })

// $('#decodeButton').on('click', function(e){
//     decodeConfig($('#presetCode').val());
// })

// $('#regenButton').on('click', function(e){
//     generateOutputNotes(true);
//     setScaleText()
//     currentBarIndex = 0;
//     currentNoteIndex = 0;
// })
// $('#regenButton2').on('click', function(e){
//     generateOutputNotes(true);
//     setScaleText()
//     currentBarIndex = 0;
//     currentNoteIndex = 0;
// })
// $('#regenButton3').on('click', function(e){
//     generateOutputNotes(true);
//     setScaleText()
//     currentBarIndex = 0;
//     currentNoteIndex = 0;
// })
// $('#regenButton4').on('click', function(e){
//     generateOutputNotes(true);
//     setScaleText()
//     currentBarIndex = 0;
//     currentNoteIndex = 0;
// })
// $('#regenButton5').on('click', function(e){
//     generateOutputNotes(true);
//     setScaleText()
//     currentBarIndex = 0;
//     currentNoteIndex = 0;
// })
// $('#regenButton6').on('click', function(e){
//     generateOutputNotes(true);
//     setScaleText()
//     currentBarIndex = 0;
//     currentNoteIndex = 0;
// })
// $('#regenButton7').on('click', function(e){
//     generateOutputNotes(true);
//     setScaleText()
//     currentBarIndex = 0;
//     currentNoteIndex = 0;
// })
// $('#regenButton8').on('click', function(e){
//     generateOutputNotes(true);
//     setScaleText()
//     currentBarIndex = 0;
//     currentNoteIndex = 0;
// })

// console.log($('#regenButton'))


// function playSelectedNote(){
//     var systainLevel = 0.5;
//     const osc = context.createOscillator();
//     const noteGain = context.createGain();
//     noteGain.gain.setValueAtTime(0, 0);
//     noteGain.gain.linearRampToValueAtTime(sustainLevel, context.currentTime + noteLength * attackTime);
//     noteGain.gain.setValueAtTime(sustainLevel, context.currentTime + noteLength - noteLength * releaseTime);
//     noteGain.gain.linearRampToValueAtTime(0, context.currentTime + noteLength);

//     var lfoGain = context.createGain();
//     lfoGain.gain.setValueAtTime(vibratoAmount, 0);
//     lfoGain.connect(osc.frequency)

//     var lfo = context.createOscillator();
//     lfo.frequency.setValueAtTime(vibratoSpeed, 0);
//     lfo.start(0);
//     lfo.stop(context.currentTime + noteLength);
//     lfo.connect(lfoGain); 

//     if(waveform == "custom")
//     osc.setPeriodicWave(customWaveform);
// else
//     osc.type = waveform;




//     osc.frequency.setValueAtTime(pianoNotes[outputNoteArray[0]['notes'].flat()[selectedNote]], 0);
//     osc.start(0);
//     osc.stop(context.currentTime + noteLength);
//     osc.connect(noteGain);

//     noteGain.connect(masterVolume);
//     noteGain.connect(delay);

// }

// $('#playButton').on('click', function(e) {playCurrentNote();})
// $('#playButton2').on('click', function(e) {playCurrentNote();})
// $('#playButton3').on('click', function(e) {playCurrentNote();})
// $('#playButton4').on('click', function(e) {playCurrentNote();})
// $('#playButton5').on('click', function(e) {playCurrentNote();})
// $('#playButton6').on('click', function(e) {playCurrentNote();})
// $('#playButton7').on('click', function(e) {playCurrentNote();})
// $('#playButton8').on('click', function(e) {playCurrentNote();})

// $('#startButton').on('click', function(e) {if (!isPlaying){isPlaying = true; noteLoop();}})
// $('#startButton2').on('click', function(e) {if (!isPlaying){isPlaying = true; noteLoop();}})
// $('#startButton3').on('click', function(e) {if (!isPlaying){isPlaying = true; noteLoop();}})
// $('#startButton4').on('click', function(e) {if (!isPlaying){isPlaying = true; noteLoop();}})
// $('#startButton5').on('click', function(e) {if (!isPlaying){isPlaying = true; noteLoop();}})
// $('#startButton6').on('click', function(e) {if (!isPlaying){isPlaying = true; noteLoop();}})
// $('#startButton7').on('click', function(e) {if (!isPlaying){isPlaying = true; noteLoop();}})
// $('#startButton8').on('click', function(e) {if (!isPlaying){isPlaying = true; noteLoop();}})

// $('#stopButton').on('click', function(e) {isPlaying = false;})
// $('#stopButton2').on('click', function(e) {isPlaying = false;})
// $('#stopButton3').on('click', function(e) {isPlaying = false;})
// $('#stopButton4').on('click', function(e) {isPlaying = false;})
// $('#stopButton5').on('click', function(e) {isPlaying = false;})
// $('#stopButton6').on('click', function(e) {isPlaying = false;})
// $('#stopButton7').on('click', function(e) {isPlaying = false;})
// $('#stopButton8').on('click', function(e) {isPlaying = false;})

// function noteLoop() {
//     const secondsPerBeat = 60.0 / tempo;
//     if (isPlaying) {
//         playCurrentNote();
//         nextNote();
//         // playCurrentNote();
//         // nextNote();
//         window.setTimeout(function() {
//             noteLoop();
//         }, secondsPerBeat * 1000)
//     };
// }

// function nextNote() {
//     // noteSelects[currentNoteIndex].style.background = "yellow";
//     // if (noteSelects[currentNoteIndex - 1]) {
//     //     noteSelects[currentNoteIndex - 1].style.background = "white";
//     // } else {
//     //     noteSelects[7].style.background = "white"
//     // }
//     currentNoteIndex++;
//     // console.log('notes: ', outputNoteArray[0]['notes'])
//     if (currentNoteIndex >= outputNoteArray[currentBarIndex]['notes'].length) {
//         currentNoteIndex = 0;
//         currentBarIndex = currentBarIndex + 1;
//         if(currentBarIndex >= outputNoteArray.length)
//             currentBarIndex = 0;
//     }
// }
  
// function playCurrentNote() {
//     if(currentBarIndex >= outputNoteArray.length){
//         currentBarIndex = 0;
//         currentNoteIndex = 0;
//     }
//     if(currentNoteIndex >= outputNoteArray[currentBarIndex]['notes'].flat().length)
//         currentNoteIndex = 0;
//     if(!Array.isArray(outputNoteArray[currentBarIndex]['notes'][currentNoteIndex])){
//         console.log('playing single note', outputNoteArray[currentBarIndex]['notes'][currentNoteIndex]);
//         const osc = context.createOscillator();
//         const noteGain = context.createGain();
//         noteGain.gain.setValueAtTime(0, 0);
//         noteGain.gain.linearRampToValueAtTime(sustainLevel, context.currentTime + noteLength * attackTime);
//         noteGain.gain.setValueAtTime(sustainLevel, context.currentTime + noteLength - noteLength * releaseTime);
//         noteGain.gain.linearRampToValueAtTime(0, context.currentTime + noteLength);

//         var lfoGain = context.createGain();
//         lfoGain.gain.setValueAtTime(vibratoAmount, 0);
//         lfoGain.connect(osc.frequency)

//         var lfo = context.createOscillator();
//         lfo.frequency.setValueAtTime(vibratoSpeed, 0);
//         lfo.start(0);
//         lfo.stop(context.currentTime + noteLength);
//         lfo.connect(lfoGain); 

//         if(waveform == "custom")
//         osc.setPeriodicWave(customWaveform);
//     else
//         osc.type = waveform;




//         osc.frequency.setValueAtTime(pianoNotes[outputNoteArray[currentBarIndex]['notes'].flat()[currentNoteIndex]], 0);
//         osc.start(0);
//         osc.stop(context.currentTime + noteLength);
//         osc.connect(noteGain);

//         noteGain.connect(masterVolume);
//         noteGain.connect(delay);
//     }
//     else{
//         console.log('playing note array', outputNoteArray[currentBarIndex]['notes'][currentNoteIndex]);
//         for(var note of outputNoteArray[currentBarIndex]['notes'][currentNoteIndex]){
//             // console.log('playing note', note);
//             const osc = context.createOscillator();
//             const noteGain = context.createGain();
//             noteGain.gain.setValueAtTime(0, 0);
//             sustainLevel = 0.5 / outputNoteArray[currentBarIndex]['notes'][currentNoteIndex].length;
//             noteGain.gain.linearRampToValueAtTime(sustainLevel, context.currentTime + noteLength * attackTime);
//             noteGain.gain.setValueAtTime(sustainLevel, context.currentTime + noteLength - noteLength * releaseTime);
//             noteGain.gain.linearRampToValueAtTime(0, context.currentTime + noteLength);
        
//             var lfoGain = context.createGain();
//             lfoGain.gain.setValueAtTime(vibratoAmount, 0);
//             lfoGain.connect(osc.frequency)
        
//             var lfo = context.createOscillator();
//             lfo.frequency.setValueAtTime(vibratoSpeed, 0);
//             lfo.start(0);
//             lfo.stop(context.currentTime + noteLength);
//             lfo.connect(lfoGain); 
        
//             if(waveform == "custom")
//             osc.setPeriodicWave(customWaveform);
//         else
//             osc.type = waveform;
        
        
        
//             // console.log(note, pianoNotes[note])
//             osc.frequency.setValueAtTime(pianoNotes[note], 0);
//             osc.start(0);
//             osc.stop(context.currentTime + noteLength);
//             osc.connect(noteGain);
        
//             noteGain.connect(masterVolume);
//             noteGain.connect(delay);

//         }
//     }
//     drawNotes(outputDiv, outputNoteArray, false);
// }




