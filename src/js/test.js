import MIDIController from './MidiController.js'

let controller;

const led = document.querySelector('.led');
const btnActivate = document.querySelector('#activate');

const range = document.querySelector('#progress');
const rangeMin = parseInt(range.min);
const rangeMax = parseInt(range.max);
const rangeOutput = document.querySelector('output[for=progress]');

const updateRangeOutput = () => {
    rangeOutput.textContent = range.value;
}

window.addEventListener("load", async e => {
    controller = new MIDIController(
        range,
        range.value,
        1,
        rangeMin,
        rangeMax
    );
    window.controller = controller;
    await controller.init();
    controller.activate();
    updateRangeOutput();

    range.addEventListener('change', updateRangeOutput);

    btnActivate.addEventListener('click', (ev) =>{
        controller.activate();
    })
});