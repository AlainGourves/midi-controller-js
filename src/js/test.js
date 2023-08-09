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

const handleBtnState = () => {
    const state = controller.isActive();
    if (state) {
        btnActivate.textContent = "Desactivate";
        led.classList.add('on');
    } else {
        btnActivate.textContent = "Activate";
        led.classList.remove('on');
    }
}

window.addEventListener("load", async e => {
    controller = new MIDIController(
        range,
        range.value,
        rangeMin,
        rangeMax
    );
    window.controller = controller;
    await controller.init();
 //   controller.askChannel();
    // controller.activate();
    updateRangeOutput();
    handleBtnState()

    range.addEventListener('change', updateRangeOutput);

    btnActivate.addEventListener('click', (ev) => {
        (controller.isActive()) ? controller.desactivate() : controller.activate();
        handleBtnState()
    })
});