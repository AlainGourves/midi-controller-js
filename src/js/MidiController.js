class MIDIController {

    constructor(target, initialValue, MIN = 0, MAX = 100) {
        this._target = target;
        this._initialValue = initialValue || Math.floor((MAX - MIN)/2);
        this._value = this.checkValue(initialValue);
        this._MIN = MIN;
        this._MAX = MAX;
        this._channel = 0;
        // TODO: verif que channel est dans [1,16]

        this.midi = null;
        this._isActive = false;

        this._target.addEventListener('change', (ev) => {
            this.value = ev.target.value;
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

    filterIOs(entries) {
        let result = null;
        entries.forEach(entry => {
            const name = entry.name;
            if (name.search(/arduino/i) !== -1) {
                result = entry;
            }
        });
        return result;
    }

    askChannel() {
        let message = [0xB0, 0x14, 0x10];
        // 0xB0 (decimal 176) control change
        // 0x14 (decimal 20) controller #20
        // 0x10 (decimal 16) to ask for a channel number
        this.sendMsg(message);
    }

    sendMsg(msg) {
        const output = this.filterIOs(this.midi.outputs);
        if (this.midi && output) {
            // add channel in LSB to command
            msg[0] += this._channel;
            output.send(msg);
        } else {
            console.log("Nothing MIDI for the time being!");
        }
    }

    activate() {
        this._isActive = true;
        // control change, controller #20
        // value (decimal 36) to desactivate
        let message = [0xB0, 0x14, 0x20];
        this.sendMsg(message);
    }

    desactivate() {
        this._isActive = false;
        // control change, controller #20
        // value (decimal 48) to desactivate
        let message = [0xB0, 0x14, 0x30];
        this.sendMsg(message);
    }

    onMIDISuccess(midiAccess) {
        this.midi = midiAccess; // store in the global (in real usage, would probably keep in an object instance)

        this.midi.onstatechange = (event) => {
            // Print information about the (dis)connected MIDI controller
            console.log('statechange', event.port.type, event.port.state, event.port.id, event.port.name);
            const name = event.port.name;
            if (name.search(/arduino/i) !== -1) {
                // filters only Arduino messages
                const id = event.port.id;
                const type = event.port.type; // 'input'|'output'
                if (type === 'input') {
                    const newInput = this.midi.inputs.get(id);
                    if (newInput && !newInput.onmidimessage && newInput.state === 'connected') newInput.onmidimessage = this.onMIDIMessage.bind(this);
                }
                // Handle disconnection
                if (event.port.state === 'disconnected' && this._isActive) {
                    this._isActive = false;
                }
            }
        };

        this.midi.inputs.forEach((entry) => {
            entry.onmidimessage = this.onMIDIMessage.bind(this);
        });

        window.addEventListener('pagehide', (event) => {
            // sends a message to desactivate the controller when the user is about to leave the page
            this.desactivate();
        });

        this.askChannel();
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
        console.log("reçu sur channel:", channel, "command:", event.data[1], "val:", event.data[2]);

            if (command === 0xB0) {
                const control = event.data[1];
                const val = event.data[2] || null;
                if (control === 20) {
                    // response to askChannel()
                    this._channel = channel;
                    if (!this._isActive) this.activate();
                }
                if (control === 21 && channel === this._channel) {
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
                    this.value = this._value;
                }
                if (control === 22 && channel === this._channel) {
                    // Reset range value to initialValue
                    this.value = this._initialValue;
                }
            }
            this._target.value = this.value;
            // target emits a 'change' event
            const evt = new Event('change', { bubbles: true });
            this._target.dispatchEvent(evt);
    }

    checkValue(val) {
        val = parseInt(val);
        if (val < this._MIN) val = this._MIN;
        if (val > this._MAX) val = this._MAX;
        return val;
    }

    isActive() {
        return this._isActive;
    }
}

export default MIDIController;