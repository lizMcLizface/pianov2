import $ from 'jquery';

const animations = document.querySelectorAll('[data-animation');

function reset(){    
    var el = document.getElementsByClassName('metronome');
    Array.from(el).forEach((e) =>{
      e.style.animationName = 'none';
      void(e.offsetHeight); /* trigger reflow */
      e.style.animationName = null; 
    })
}

$('#metronomeCheckBox').on('change', function (e) {
    animations.forEach(animation => {
      const running = getComputedStyle(animation).getPropertyValue("--animps") || 'running';
      animation.style.setProperty('--animps', running === 'running' ? 'paused' : 'running');
    })
    if($('#metronomeCheckBox')[0].checked){
        reset();
    }else{
    }
});

// $('#metronomeModeSelect').on('change', function (e) {
// 	if($('#metronomeModeSelect').val() == '0'){
// 		$('.metronome01')[0].style.setProperty('--box-shadow-color', '#fde725')
// 		$('.metronome02')[0].style.setProperty('--box-shadow-color', '#c8e020')
// 		$('.metronome03')[0].style.setProperty('--box-shadow-color', '#90d743')
// 		$('.metronome04')[0].style.setProperty('--box-shadow-color', '#5ec962')
// 		$('.metronome05')[0].style.setProperty('--box-shadow-color', '#35b779')
// 		$('.metronome06')[0].style.setProperty('--box-shadow-color', '#20a486')
// 		$('.metronome07')[0].style.setProperty('--box-shadow-color', '#21918c')
// 		$('.metronome08')[0].style.setProperty('--box-shadow-color', '#287c8e')
// 		$('.metronome09')[0].style.setProperty('--box-shadow-color', '#31688e')
// 		$('.metronome10')[0].style.setProperty('--box-shadow-color', '#3b528b')
// 		$('.metronome11')[0].style.setProperty('--box-shadow-color', '#443983')
// 		$('.metronome12')[0].style.setProperty('--box-shadow-color', '#481f70')
// 		$('.metronome13')[0].style.setProperty('--box-shadow-color', '#440154')
// 		$('.metronome14')[0].style.setProperty('--box-shadow-color', '#481f70')
// 		$('.metronome15')[0].style.setProperty('--box-shadow-color', '#443983')
// 		$('.metronome16')[0].style.setProperty('--box-shadow-color', '#3b528b')
// 		$('.metronome17')[0].style.setProperty('--box-shadow-color', '#31688e')
// 		$('.metronome18')[0].style.setProperty('--box-shadow-color', '#287c8e')
// 		$('.metronome19')[0].style.setProperty('--box-shadow-color', '#21918c')
// 		$('.metronome20')[0].style.setProperty('--box-shadow-color', '#20a486')
// 		$('.metronome21')[0].style.setProperty('--box-shadow-color', '#35b779')
// 		$('.metronome22')[0].style.setProperty('--box-shadow-color', '#5ec962')
// 		$('.metronome23')[0].style.setProperty('--box-shadow-color', '#90d743')
// 		$('.metronome24')[0].style.setProperty('--box-shadow-color', '#c8e020')
// 	}
// 	if($('#metronomeModeSelect').val() == '1'){
// 		$('.metronome01')[0].style.setProperty('--box-shadow-color', '#fde725')
// 		$('.metronome02')[0].style.setProperty('--box-shadow-color', '#90d743')
// 		$('.metronome03')[0].style.setProperty('--box-shadow-color', '#35b779')
// 		$('.metronome04')[0].style.setProperty('--box-shadow-color', '#21918c')
// 		$('.metronome05')[0].style.setProperty('--box-shadow-color', '#31688e')
// 		$('.metronome06')[0].style.setProperty('--box-shadow-color', '#443983')
// 		$('.metronome07')[0].style.setProperty('--box-shadow-color', '#440154')
// 		$('.metronome08')[0].style.setProperty('--box-shadow-color', '#443983')
// 		$('.metronome09')[0].style.setProperty('--box-shadow-color', '#31688e')
// 		$('.metronome10')[0].style.setProperty('--box-shadow-color', '#21918c')
// 		$('.metronome11')[0].style.setProperty('--box-shadow-color', '#35b779')
// 		$('.metronome12')[0].style.setProperty('--box-shadow-color', '#90d743')
// 		$('.metronome13')[0].style.setProperty('--box-shadow-color', '#fde725')
// 		$('.metronome14')[0].style.setProperty('--box-shadow-color', '#90d743')
// 		$('.metronome15')[0].style.setProperty('--box-shadow-color', '#35b779')
// 		$('.metronome16')[0].style.setProperty('--box-shadow-color', '#21918c')
// 		$('.metronome17')[0].style.setProperty('--box-shadow-color', '#31688e')
// 		$('.metronome18')[0].style.setProperty('--box-shadow-color', '#443983')
// 		$('.metronome19')[0].style.setProperty('--box-shadow-color', '#440154')
// 		$('.metronome20')[0].style.setProperty('--box-shadow-color', '#443983')
// 		$('.metronome21')[0].style.setProperty('--box-shadow-color', '#31688e')
// 		$('.metronome22')[0].style.setProperty('--box-shadow-color', '#21918c')
// 		$('.metronome23')[0].style.setProperty('--box-shadow-color', '#35b779')
// 		$('.metronome24')[0].style.setProperty('--box-shadow-color', '#90d743')
// 	}
// 	if($('#metronomeModeSelect').val() == '2'){
// 		$('.metronome01')[0].style.setProperty('--box-shadow-color', '#fde725')
// 		$('.metronome02')[0].style.setProperty('--box-shadow-color', '#35b779')
// 		$('.metronome03')[0].style.setProperty('--box-shadow-color', '#31688e')
// 		$('.metronome04')[0].style.setProperty('--box-shadow-color', '#440154')
// 		$('.metronome05')[0].style.setProperty('--box-shadow-color', '#31688e')
// 		$('.metronome06')[0].style.setProperty('--box-shadow-color', '#35b779')
// 		$('.metronome07')[0].style.setProperty('--box-shadow-color', '#fde725')
// 		$('.metronome08')[0].style.setProperty('--box-shadow-color', '#35b779')
// 		$('.metronome09')[0].style.setProperty('--box-shadow-color', '#31688e')
// 		$('.metronome10')[0].style.setProperty('--box-shadow-color', '#440154')
// 		$('.metronome11')[0].style.setProperty('--box-shadow-color', '#31688e')
// 		$('.metronome12')[0].style.setProperty('--box-shadow-color', '#35b779')
// 		$('.metronome13')[0].style.setProperty('--box-shadow-color', '#fde725')
// 		$('.metronome14')[0].style.setProperty('--box-shadow-color', '#35b779')
// 		$('.metronome15')[0].style.setProperty('--box-shadow-color', '#31688e')
// 		$('.metronome16')[0].style.setProperty('--box-shadow-color', '#440154')
// 		$('.metronome17')[0].style.setProperty('--box-shadow-color', '#31688e')
// 		$('.metronome18')[0].style.setProperty('--box-shadow-color', '#35b779')
// 		$('.metronome19')[0].style.setProperty('--box-shadow-color', '#fde725')
// 		$('.metronome20')[0].style.setProperty('--box-shadow-color', '#35b779')
// 		$('.metronome21')[0].style.setProperty('--box-shadow-color', '#31688e')
// 		$('.metronome22')[0].style.setProperty('--box-shadow-color', '#440154')
// 		$('.metronome23')[0].style.setProperty('--box-shadow-color', '#31688e')
// 		$('.metronome24')[0].style.setProperty('--box-shadow-color', '#35b779')
// 	}
// 	if($('#metronomeModeSelect').val() == '3'){
// 		$('.metronome01')[0].style.setProperty('--box-shadow-color', '#fde725')
// 		$('.metronome02')[0].style.setProperty('--box-shadow-color', '#5ec962')
// 		$('.metronome03')[0].style.setProperty('--box-shadow-color', '#21918c')
// 		$('.metronome04')[0].style.setProperty('--box-shadow-color', '#3b528b')
// 		$('.metronome05')[0].style.setProperty('--box-shadow-color', '#440154')
// 		$('.metronome06')[0].style.setProperty('--box-shadow-color', '#3b528b')
// 		$('.metronome07')[0].style.setProperty('--box-shadow-color', '#21918c')
// 		$('.metronome08')[0].style.setProperty('--box-shadow-color', '#5cc863')
// 		$('.metronome09')[0].style.setProperty('--box-shadow-color', '#fde725')
// 		$('.metronome10')[0].style.setProperty('--box-shadow-color', '#5cc863')
// 		$('.metronome11')[0].style.setProperty('--box-shadow-color', '#21918c')
// 		$('.metronome12')[0].style.setProperty('--box-shadow-color', '#3b528b')
// 		$('.metronome13')[0].style.setProperty('--box-shadow-color', '#440154')
// 		$('.metronome14')[0].style.setProperty('--box-shadow-color', '#3b528b')
// 		$('.metronome15')[0].style.setProperty('--box-shadow-color', '#21908d')
// 		$('.metronome16')[0].style.setProperty('--box-shadow-color', '#5ec962')
// 		$('.metronome17')[0].style.setProperty('--box-shadow-color', '#fde725')
// 		$('.metronome18')[0].style.setProperty('--box-shadow-color', '#5ec962')
// 		$('.metronome19')[0].style.setProperty('--box-shadow-color', '#21908d')
// 		$('.metronome20')[0].style.setProperty('--box-shadow-color', '#3b528b')
// 		$('.metronome21')[0].style.setProperty('--box-shadow-color', '#440154')
// 		$('.metronome22')[0].style.setProperty('--box-shadow-color', '#3b528b')
// 		$('.metronome23')[0].style.setProperty('--box-shadow-color', '#21908d')
// 		$('.metronome24')[0].style.setProperty('--box-shadow-color', '#5cc863')
// 	}
// 	if($('#metronomeModeSelect').val() == '4'){
// 		$('.metronome01')[0].style.setProperty('--box-shadow-color', '#fde725')
// 		$('.metronome02')[0].style.setProperty('--box-shadow-color', '#addc30')
// 		$('.metronome03')[0].style.setProperty('--box-shadow-color', '#5ec962')
// 		$('.metronome04')[0].style.setProperty('--box-shadow-color', '#28ae80')
// 		$('.metronome05')[0].style.setProperty('--box-shadow-color', '#21918c')
// 		$('.metronome06')[0].style.setProperty('--box-shadow-color', '#2c728e')
// 		$('.metronome07')[0].style.setProperty('--box-shadow-color', '#3b528b')
// 		$('.metronome08')[0].style.setProperty('--box-shadow-color', '#472d7b')
// 		$('.metronome09')[0].style.setProperty('--box-shadow-color', '#440154')
// 		$('.metronome10')[0].style.setProperty('--box-shadow-color', '#472d7b')
// 		$('.metronome11')[0].style.setProperty('--box-shadow-color', '#3b528b')
// 		$('.metronome12')[0].style.setProperty('--box-shadow-color', '#2c728e')
// 		$('.metronome13')[0].style.setProperty('--box-shadow-color', '#21918c')
// 		$('.metronome14')[0].style.setProperty('--box-shadow-color', '#28ae80')
// 		$('.metronome15')[0].style.setProperty('--box-shadow-color', '#5cc863')
// 		$('.metronome16')[0].style.setProperty('--box-shadow-color', '#addc30')
// 		$('.metronome17')[0].style.setProperty('--box-shadow-color', '#fde725')
// 		$('.metronome18')[0].style.setProperty('--box-shadow-color', '#addc30')
// 		$('.metronome19')[0].style.setProperty('--box-shadow-color', '#5cc863')
// 		$('.metronome20')[0].style.setProperty('--box-shadow-color', '#28ae80')
// 		$('.metronome21')[0].style.setProperty('--box-shadow-color', '#21918c')
// 		$('.metronome22')[0].style.setProperty('--box-shadow-color', '#28ae80')
// 		$('.metronome23')[0].style.setProperty('--box-shadow-color', '#5cc863')
// 		$('.metronome24')[0].style.setProperty('--box-shadow-color', '#aadc32')
// 	}
// });

class Metronome
{
    constructor(tempo = 120)
    {
        this.audioContext = null;
        this.notesInQueue = [];         // notes that have been put into the web audio and may or may not have been played yet {note, time}
        this.currentBeatInBar = 0;
        this.currentNoteInBeat = 0;
        this.beatsPerBar = 4;
        this.tempo = tempo;
        this.lookahead = 25;          // How frequently to call scheduling function (in milliseconds)
        this.scheduleAheadTime = 0.1;   // How far ahead to schedule audio (sec)
        this.nextNoteTime = 0.0;     // when the next note is due
        this.isRunning = false;
        this.intervalID = null;
    }

    nextNote()
    {
        // Advance current note and time by a quarter note (crotchet if you're posh)
        var secondsPerBeat = 60.0 / this.tempo; // Notice this picks up the CURRENT tempo value to calculate beat length.
        // console.log($('#metronomeModeSelect').val());
        // switch($('#metronomeModeSelect').val()){
            // case '0':
                this.nextNoteTime += secondsPerBeat; // Add beat length to last beat time
            
                this.currentBeatInBar++;    // Advance the beat number, wrap to zero
                if (this.currentBeatInBar == this.beatsPerBar) {
                    this.currentBeatInBar = 0;
                }
                // break;
            // case '1':
            //     this.nextNoteTime += secondsPerBeat / 2.; // Add beat length to last beat time
            //     this.currentNoteInBeat++;
            //     // console.log(this.currentNoteInBeat, this.currentBeatInBar)
            //     if(this.currentNoteInBeat == 2){
            //         this.currentNoteInBeat = 0;
            //         this.currentBeatInBar++;    // Advance the beat number, wrap to zero
            //         // console.log('Advancing beat number'); 
            //         if (this.currentBeatInBar == this.beatsPerBar) {
            //             this.currentBeatInBar = 0;
            //         }
            //     }
            //     break;
            // case '2':
            //     this.nextNoteTime += secondsPerBeat / 4.; // Add beat length to last beat time
            //     this.currentNoteInBeat++;
            //     if(this.currentNoteInBeat == 4){
            //         this.currentNoteInBeat = 0;
            //         this.currentBeatInBar++;    // Advance the beat number, wrap to zero
            //         if (this.currentBeatInBar == this.beatsPerBar) {
            //             this.currentBeatInBar = 0;
            //         }
            //     }
            //     break;
            // case '3':
            //     this.nextNoteTime += secondsPerBeat / 3.; // Add beat length to last beat time
                
            //     this.currentNoteInBeat++;
            //     if(this.currentNoteInBeat == 3){
            //         this.currentNoteInBeat = 0;
            //         this.currentBeatInBar++;    // Advance the beat number, wrap to zero
            //         if (this.currentBeatInBar == this.beatsPerBar) {
            //             this.currentBeatInBar = 0;
            //         }
            //     }
            //     break;
            // case '4':
            //     // console.log(this.currentNoteInBeat, this.currentBeatInBar)
            //     this.nextNoteTime += this.currentNoteInBeat == 0 ? secondsPerBeat / 3. * 2. : secondsPerBeat / 3.; // Add beat length to last beat time
            //     // console.log('---------------------')
            //     this.currentNoteInBeat++;
            //     // if(this.currentNoteInBeat == 2){
            //         // this.currentNoteInBeat++;
            //         // this.nextNoteTime += secondsPerBeat / 3; // Add beat length to last beat time
            //     // }
            //     // console.log(this.currentNoteInBeat, this.currentBeatInBar)
            //     if(this.currentNoteInBeat == 2){
            //         this.currentNoteInBeat = 0;
            //         this.currentBeatInBar++;    // Advance the beat number, wrap to zero
            //         if (this.currentBeatInBar == this.beatsPerBar) {
            //             this.currentBeatInBar = 0;
            //         }
            //     }

        // }
        // this.nextNoteTime += secondsPerBeat; // Add beat length to last beat time
    
        // this.currentBeatInBar++;    // Advance the beat number, wrap to zero
        // if (this.currentBeatInBar == this.beatsPerBar) {
        //     this.currentBeatInBar = 0;
        // }
    }

    scheduleNote(beatNumber, noteNumber, time)
    {
        // push the note on the queue, even if we're not playing.
        this.notesInQueue.push({ note: beatNumber, time: time });
    
        // create an oscillator
        const osc = this.audioContext.createOscillator();
        const envelope = this.audioContext.createGain();
        
        osc.frequency.value = 800;
        if ((beatNumber % this.beatsPerBar == 0) && noteNumber == 0) 
            osc.frequency.value = 800;
        else if (noteNumber != 0)
            osc.frequency.value = 800;
        else
            osc.frequency.value=800;
        envelope.gain.value = 1;
        
        // Get volume control value
        const volumeControl = document.querySelector('#volume-control');
        const volume = volumeControl ? volumeControl.value : 0.5;
        
        envelope.gain.exponentialRampToValueAtTime(volume, time + 0.001);
        envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.02);


        osc.connect(envelope);
        envelope.connect(this.audioContext.destination);

                

        osc.start(time);
        osc.stop(time + 0.03);
    }

    scheduler()
    {
        // while there are notes that will need to play before the next interval, schedule them and advance the pointer.
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime ) {
            this.scheduleNote(this.currentBeatInBar, this.currentNoteInBeat, this.nextNoteTime);
            this.nextNote();
        }
    }

    start()
    {
        if (this.isRunning) return;

        if (this.audioContext == null)
        {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        this.isRunning = true;

        this.currentBeatInBar = 0;
        this.nextNoteTime = this.audioContext.currentTime + 0.05;

        this.intervalID = setInterval(() => this.scheduler(), this.lookahead);
    }

    stop()
    {
        this.isRunning = false;

        clearInterval(this.intervalID);
    }

    startStop()
    {
        if (this.isRunning) {
            this.stop();
        }
        else {
            this.start();
        }
    }
}

// Create and export metronome instance
const bpmSlider = document.querySelector('#bpmSlider');
const initialBPM = bpmSlider ? Number(bpmSlider.value) : 120;
export const metronome = new Metronome(initialBPM);

// Export the reset function for external use
export { reset };

bpmSlider.addEventListener('input', function() {
    var bpm = Number(this.value)
    document.getElementById("bpmText").innerHTML = bpm;

    var el = document.getElementsByClassName('metronome');
    Array.from(el).forEach((e) =>{
        e.style.animationDuration = 60/bpm + 's';
    //   e.style.animationName = 'none';
      void(e.offsetHeight); /* trigger reflow */
    //   e.style.animationName = null; 
    })

    var isRunning = metronome.isRunning;
    metronome.stop();
    reset()
    metronome.tempo = bpm;
    if (isRunning)
        metronome.start();
    metronome.currentBeatInBar = 0;


    // animations.forEach(animation => {
    //     const running = getComputedStyle(animation).getPropertyValue("--animps") || 'running';
    //     animation.style.setProperty('--animdur', 1 / bpm);
    //   })

    // console.log(bpm)
    // attackTime = Number(this.value);
});

// $('#metronomeModeSelect').on('change', function (e) {
//     var currentValue = $(this).val();

//     metronome.stop();
//     reset()
//     // metronome.tempo = bpm;
//     metronome.start();
//     metronome.currentBeatInBar = 0;
//     metronome.currentNoteInBeat = 0;
// });

// $('#metronomeLengthSelect').on('change', function (e) {
//     var currentValue = $(this).val();

//     // metronome.stop();
//     // reset()
//     // metronome.tempo = bpm;
//     // metronome.start();

//     if(currentValue == '8'){
//         metronome.beatsPerBar = -1
//         metronome.currentBeatInBar = 0;
//         metronome.currentNoteInBeat = 0;
//     }else{
//         metronome.beatsPerBar = Number(currentValue) + 1
//         if(metronome.currentBeatInBar > metronome.beatsPerBar)
//             metronome.currentBeatInBar = metronome.beatsPerBar - 1;
//         // metronome.currentBeatInBar = 0;
//         // metronome.currentNoteInBeat = 0;

//     }
//     // metronome.currentBeatInBar = 0;
//     // metronome.currentNoteInBeat = 0;
// });

$('#metronomeSoundCheckBox').on('change', function (e) {
    if($('#metronomeSoundCheckBox')[0].checked){
        reset()
        metronome.tempo = Number(bpmSlider.value);
        metronome.currentBeatInBar = 0;
        metronome.start();
    }else{
        metronome.stop();
    }
});
