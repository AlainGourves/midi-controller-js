const initialValue = 69;

let midi = null; // global MIDIAccess object
let inputs = [];
let outputs = [];

let isControllerActive = false;

const led = document.querySelector('.led');
const btnActivate = document.querySelector('#activate');

const range = document.querySelector('#progress');
const rangeOutput = document.querySelector('output[for=progress]');

function onMIDISuccess(midiAccess) {
    midi = midiAccess; // store in the global (in real usage, would probably keep in an object instance)

    midi.onstatechange = (event) => {
        // Print information about the (dis)connected MIDI controller
        // affiche un message quand l'arduino est conecté/déconnecté
        // console.log('statechange', event.port.type, event.port.state, event.port.id, event.port.name);
        const id = event.port.id;
        const type = event.port.type; // 'input'|'output'
        if (type === 'input') {
            const newInput = midi.inputs.get(id);
            if (newInput && !newInput.onmidimessage && newInput.state === 'connected') newInput.onmidimessage = onMIDIMessage;
        }
    };
    // listInputsAndOutputs(midi);

    console.log('sysex', midi.sysexEnabled); // SysEx are disabled by default

    midi.inputs.forEach((entry) => {
        entry.onmidimessage = onMIDIMessage;
    });
    console.log("MIDI ready!");
}

function onMIDIFailure(msg) {
    console.error(`Failed to get MIDI access - ${msg}`);
}

// List inputs/outputs
function listInputsAndOutputs(midiAccess) {
    for (const entry of midiAccess.inputs) {
        const input = entry[1];
        console.log(
            `Input port [type:'${input.type}']` +
            ` id:'${input.id}'` +
            ` manufacturer:'${input.manufacturer}'` +
            ` name:'${input.name}'` +
            ` version:'${input.version}'`,
        );
    }

    for (const entry of midiAccess.outputs) {
        const output = entry[1];
        console.log(
            `Output port [type:'${output.type}'] id:'${output.id}' manufacturer:'${output.manufacturer}' name:'${output.name}' version:'${output.version}'`,
        );
    }
}

// Handling MIDI Iputs
function onMIDIMessage(event) {
    let str = `MIDI message received at timestamp ${event.timeStamp}[${event.data.length} bytes]: `;
    for (const character of event.data) {
        str += `0x${character.toString(16)} `;
    }
    // console.log(str);
    // 4 premier bits -> type du message, 4 derniers bits -> channel
    const command = event.data[0] & 0xF0;
    const channel = event.data[0] & 0xF;
    const commands = {
        0x80: 'Note On',
        0x90: 'Note Off',
        0xB0: 'Control Change'
    }

    if (command === 0xB0) {
        const control = event.data[1];
        if (control === 21) {
            const val = event.data[2];
            let curr = getRangeValue();
            switch (val) {
                case 1:
                    curr += 1;
                    break;
                case 3:
                    curr -= 1;
                    break;
                case 10:
                    curr += 10;
                    break;
                case 30:
                    curr -= 10;
                    break;
            }
            changeRangeValue(curr);
        }
        if (control === 22) {
            // Reset range value to initialValue
            changeRangeValue(initialValue);
        }
    }
}

// Mes trucs ---------------------------------
const getRangeValue = () => {
    return parseInt(range.value);
}

const changeRangeValue = (val) => {
    range.value = val;
    const evt = new Event("change", { bubbles: true, cancelable: false });
    range.dispatchEvent(evt);
    updateRangeOutput();
}

const updateRangeOutput = () => {
    rangeOutput.textContent = range.value;
}

const activateController = (ev) => {
    const output = midi.outputs.get(midi.outputs.keys().next().value);
    if (midi && output) {
        // if (midi && midi.outputs.size) {
        isControllerActive = !isControllerActive;
        let message = [0xB0, 0x14]; // control change channel 1 | controller #20
        if (isControllerActive) {
            message.push(0xF); // value 15 to activate
            btnActivate.textContent = "Desactivate";
            led.classList.add('on');
        } else {
            message.push(0x0); // value 0 to desactivate
            btnActivate.textContent = "Activate";
            led.classList.remove('on');
        }
        output.send(message);
    } else {
        console.log("Nothing MIDI for the time being!");
    }
}

window.addEventListener("load", e => {
    navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

    btnActivate.addEventListener('click', activateController);
    range.addEventListener('change', updateRangeOutput);
    changeRangeValue(initialValue);
});