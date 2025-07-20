
function noteToMidi(note){
    var pitch = note[0].toLowerCase();
    var octave = parseInt(note.slice(-1));
    var sliced = note.slice(1,-2);
    // console.log('pos:', pitch, octave, sliced);
    var offset = 0;
    switch(sliced){
        default: break;
        case '#' : offset = 1; break;
        case '##': offset = 2; break;
        case 'b' : offset = -1; break;
        case 'bb': offset = -2; break;
    }
    // console.log('accidental offset:', sliced, offset)
    var key = 0;
    switch(pitch){
        case 'c': key = 0; break;
        case 'd': key = 2; break;
        case 'e': key = 4; break;
        case 'f': key = 5; break;
        case 'g': key = 7; break;
        case 'a': key = 9; break;
        case 'b': key = 11; break;
    }
    // console.log('key:', pitch, key)
    return (octave * 12) + key + offset;
}
// // noteToMidi('E/4')
// // noteToMidi('E#/4')
// // noteToMidi('Ebb/4')

function noteToName(input){
    var octave = String(Math.floor(input / 12) - 1);
    var note = input % 12;
    var noteName = 'C';
    switch(note){
        case 0:
            noteName = 'C';
            break;
        case 1:
            noteName = 'C#';
            break;
        case 2:
            noteName = 'D';
            break;
        case 3:
            noteName = 'D#';
            break;
        case 4:
            noteName = 'E';
            break;
        case 5:
            noteName = 'F';
            break;
        case 6:
            noteName = 'F#';
            break;
        case 7:
            noteName = 'G';
            break;
        case 8:
            noteName = 'G#';
            break;
        case 9:
            noteName = 'A';
            break;
        case 10:
            noteName = 'A#';
            break;
        case 11:
            noteName = 'B';
            break;
    }
    return noteName + '/' + octave;

}


const getElementByNote = (note) =>
  note && document.querySelector(`[note="${note}"]`);
const getElementByMIDI = (note) =>
  note && document.querySelector(`[midi="${note}"]`);

const keys = {
    21 : { element: getElementByMIDI("21"), note: "A",  octave: 0 },
    22 : { element: getElementByMIDI("22"), note: "A#", octave: 0 },
    23 : { element: getElementByMIDI("23"), note: "B",  octave: 0 },
    24 : { element: getElementByMIDI("24"), note: "C",  octave: 1 },
    25 : { element: getElementByMIDI("25"), note: "C#", octave: 1 },
    26 : { element: getElementByMIDI("26"), note: "D",  octave: 1 },
    27 : { element: getElementByMIDI("27"), note: "D#", octave: 1 },
    28 : { element: getElementByMIDI("28"), note: "E",  octave: 1 },
    29 : { element: getElementByMIDI("29"), note: "F",  octave: 1 },
    30 : { element: getElementByMIDI("30"), note: "F#", octave: 1 },
    31 : { element: getElementByMIDI("31"), note: "G",  octave: 1 },
    32 : { element: getElementByMIDI("32"), note: "G#", octave: 1 },
    33 : { element: getElementByMIDI("33"), note: "A",  octave: 1 },
    34 : { element: getElementByMIDI("34"), note: "A#", octave: 1 },
    35 : { element: getElementByMIDI("35"), note: "B",  octave: 1 },
    36 : { element: getElementByMIDI("36"), note: "C",  octave: 2 },
    37 : { element: getElementByMIDI("37"), note: "C#", octave: 2 },
    38 : { element: getElementByMIDI("38"), note: "D",  octave: 2 },
    39 : { element: getElementByMIDI("39"), note: "D#", octave: 2 },
    40 : { element: getElementByMIDI("40"), note: "E",  octave: 2 },
    41 : { element: getElementByMIDI("41"), note: "F",  octave: 2 },
    42 : { element: getElementByMIDI("42"), note: "F#", octave: 2 },
    43 : { element: getElementByMIDI("43"), note: "G",  octave: 2 },
    44 : { element: getElementByMIDI("44"), note: "G#", octave: 2 },
    45 : { element: getElementByMIDI("45"), note: "A",  octave: 2 },
    46 : { element: getElementByMIDI("46"), note: "A#", octave: 2 },
    47 : { element: getElementByMIDI("47"), note: "B",  octave: 2 },
    48 : { element: getElementByMIDI("48"), note: "C",  octave: 3 },
    49 : { element: getElementByMIDI("49"), note: "C#", octave: 3 },
    50 : { element: getElementByMIDI("50"), note: "D",  octave: 3 },
    51 : { element: getElementByMIDI("51"), note: "D#", octave: 3 },
    52 : { element: getElementByMIDI("52"), note: "E",  octave: 3 },
    53 : { element: getElementByMIDI("53"), note: "F",  octave: 3 },
    54 : { element: getElementByMIDI("54"), note: "F#", octave: 3 },
    55 : { element: getElementByMIDI("55"), note: "G",  octave: 3 },
    56 : { element: getElementByMIDI("56"), note: "G#", octave: 3 },
    57 : { element: getElementByMIDI("57"), note: "A",  octave: 3 },
    58 : { element: getElementByMIDI("58"), note: "A#", octave: 3 },
    59 : { element: getElementByMIDI("59"), note: "B",  octave: 3 },
    60 : { element: getElementByMIDI("60"), note: "C",  octave: 4 },
    61 : { element: getElementByMIDI("61"), note: "C#", octave: 4 },
    62 : { element: getElementByMIDI("62"), note: "D",  octave: 4 },
    63 : { element: getElementByMIDI("63"), note: "D#", octave: 4 },
    64 : { element: getElementByMIDI("64"), note: "E",  octave: 4 },
    65 : { element: getElementByMIDI("65"), note: "F",  octave: 4 },
    66 : { element: getElementByMIDI("66"), note: "F#", octave: 4 },
    67 : { element: getElementByMIDI("67"), note: "G",  octave: 4 },
    68 : { element: getElementByMIDI("68"), note: "G#", octave: 4 },
    69 : { element: getElementByMIDI("69"), note: "A",  octave: 4 },
    70 : { element: getElementByMIDI("70"), note: "A#", octave: 4 },
    71 : { element: getElementByMIDI("71"), note: "B",  octave: 4 },
    72 : { element: getElementByMIDI("72"), note: "C",  octave: 5 },
    73 : { element: getElementByMIDI("73"), note: "C#", octave: 5 },
    74 : { element: getElementByMIDI("74"), note: "D",  octave: 5 },
    75 : { element: getElementByMIDI("75"), note: "D#", octave: 5 },
    76 : { element: getElementByMIDI("76"), note: "E",  octave: 5 },
    77 : { element: getElementByMIDI("77"), note: "F",  octave: 5 },
    78 : { element: getElementByMIDI("78"), note: "F#", octave: 5 },
    79 : { element: getElementByMIDI("79"), note: "G",  octave: 5 },
    80 : { element: getElementByMIDI("80"), note: "G#", octave: 5 },
    81 : { element: getElementByMIDI("81"), note: "A",  octave: 5 },
    82 : { element: getElementByMIDI("82"), note: "A#", octave: 5 },
    83 : { element: getElementByMIDI("83"), note: "B",  octave: 5 },
    84 : { element: getElementByMIDI("84"), note: "C",  octave: 6 },
    85 : { element: getElementByMIDI("85"), note: "C#", octave: 6 },
    86 : { element: getElementByMIDI("86"), note: "D",  octave: 6 },
    87 : { element: getElementByMIDI("87"), note: "D#", octave: 6 },
    88 : { element: getElementByMIDI("88"), note: "E",  octave: 6 },
    89 : { element: getElementByMIDI("89"), note: "F",  octave: 6 },
    90 : { element: getElementByMIDI("90"), note: "F#", octave: 6 },
    91 : { element: getElementByMIDI("91"), note: "G",  octave: 6 },
    92 : { element: getElementByMIDI("92"), note: "G#", octave: 6 },
    93 : { element: getElementByMIDI("93"), note: "A",  octave: 6 },
    94 : { element: getElementByMIDI("94"), note: "A#", octave: 6 },
    95 : { element: getElementByMIDI("95"), note: "B",  octave: 6 },
    96 : { element: getElementByMIDI("96"), note: "C",  octave: 7 },
    97 : { element: getElementByMIDI("97"), note: "C#", octave: 7 },
    98 : { element: getElementByMIDI("98"), note: "D",  octave: 7 },
    99 : { element: getElementByMIDI("99"), note: "D#", octave: 7 },
    100 : { element: getElementByMIDI("100"), note: "E",  octave: 7 },
    101 : { element: getElementByMIDI("101"), note: "F",  octave: 7 },
    102 : { element: getElementByMIDI("102"), note: "F#", octave: 7 },
    103 : { element: getElementByMIDI("103"), note: "G",  octave: 7 },
    104 : { element: getElementByMIDI("104"), note: "G#", octave: 7 },
    105 : { element: getElementByMIDI("105"), note: "A",  octave: 7 },
    106 : { element: getElementByMIDI("106"), note: "A#", octave: 7 },
    107 : { element: getElementByMIDI("107"), note: "B",  octave: 7 },
    108 : { element: getElementByMIDI("108"), note: "C",  octave: 8 },
};


export { noteToMidi, noteToName, keys, getElementByNote, getElementByMIDI };