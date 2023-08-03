class MIDIController {

    constructor(target, initialValue, channel = 1, MIN = 0, MAX = 100) {
        this._target = target;
        this._initialValue = initialValue;
        this._value = this.checkValue(initialValue);
        this._MIN = MIN;
        this._MAX = MAX;
        this._channel = channel;
        // TODO: verif que channel est dans [1,16]

        this.midi = null;
        this.isActive = false;

        this._target.addEventListener('change', (ev) =>{
            this._value = this.checkValue(ev.target.value);
        })
        //this.init()//.then(this.activate.bind(this));
    }

    set value(val) {
        this._value = this.checkValue(val);
    }

    get value() {
        return this._value;
    }

    async init() {
        await navigator.requestMIDIAccess().then(this.onMIDISuccess.bind(this), this.onMIDIFailure.bind(this));
    }

    activate() {
        const output = this.midi.outputs.get(this.midi.outputs.keys().next().value);
        if (this.midi && output) {
            this.isActive = !this.isActive;
            let message = [0xB0 + (this._channel - 1), 0x14]; // control change (add channel in LSB) | controller #20
            if (this.isActive) {
                message.push(0x20); // value (decimal 32) to activate
            } else {
                message.push(0x30); // value (decimal 48) to desactivate
            }
            //console.log(message);
            output.send(message);
        } else {
            console.log("Nothing MIDI for the time being!");
        }
    }

    onMIDISuccess(midiAccess) {
        this.midi = midiAccess; // store in the global (in real usage, would probably keep in an object instance)

        this.midi.onstatechange = (event) => {
            // Print information about the (dis)connected MIDI controller
            // affiche un message quand l'arduino est conecté/déconnecté
            console.log('statechange', event.port.type, event.port.state, event.port.id, event.port.name);
            const id = event.port.id;
            const type = event.port.type; // 'input'|'output'
            if (type === 'input') {
                const newInput = this.midi.inputs.get(id);
                if (newInput && !newInput.onmidimessage && newInput.state === 'connected') newInput.onmidimessage = this.onMIDIMessage.bind(this);
            }
            // Handle disconnection
            if (event.port.state === 'disconnected' && this.isActive) {
                this.isActive = false;
            }
        };

        this.midi.inputs.forEach((entry) => {
            entry.onmidimessage = this.onMIDIMessage.bind(this);
        });
        console.log("MIDI ready!");
    }

    onMIDIFailure(msg) {
        console.error(`Failed to get MIDI access - ${msg}`);
    }

    // Handling MIDI Iputs
    onMIDIMessage(event) {
        // let str = `MIDI message received at timestamp ${event.timeStamp}[${event.data.length} bytes]: `;
        // for (const character of event.data) {
        //     str += `0x${character.toString(16)} `;
        // }
        // console.log(str);
        // 4 premier bits -> type du message, 4 derniers bits -> channel
        const command = event.data[0] & 0xF0;
        const channel = event.data[0] & 0xF;  // TODO: gestion du channel (filtrer les msgs)
        console.log("reçu sur channel:", channel, "val:", event.data[2]);
        const commands = {
            0x80: 'Note On',
            0x90: 'Note Off',
            0xB0: 'Control Change'
        }

        if (command === 0xB0) {
            const control = event.data[1];
            if (control === 21) {
                const val = event.data[2];
                switch (val) {
                    case 1:
                        this._value += 1;
                        break;
                    case 3:
                        this._value -= 1;
                        break;
                    case 10:
                        this._value += 10;
                        break;
                    case 30:
                        this._value -= 10;
                        break;
                }
                this._value = this.checkValue(this._value);
            }
            if (control === 22) {
                // Reset range value to initialValue
                this._value = this._initialValue;
            }
        }
        this._target.value = this._value;
        // target emits a 'change' event
        const evt = new Event('change', {bubbles: true});
        this._target.dispatchEvent(evt);
    }

    checkValue(val) {
        val = parseInt(val);
        if (val < this._MIN) val = this._MIN;
        if (val > this._MAX) val = this._MAX;
        return val;
    }
}

export default MIDIController;