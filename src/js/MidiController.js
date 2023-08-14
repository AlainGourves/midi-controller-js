class MIDIController {

    constructor(target, initialValue, MIN = 0, MAX = 100) {
        this._target = target;
        this._initialValue = (initialValue !== null) ? initialValue : Math.floor((MAX - MIN) / 2);
        this._value = this.checkValue(initialValue);
        this._MIN = MIN;
        this._MAX = MAX;
        this._channel = 0;

        this._subscribers = [];

        this.timer;
        this.activeSensingPeriod = 1000;
        this.raf; // requestAnimationFrame reference

        this.midi = null;
        this._isActive = false;

        this._target.addEventListener('change', (ev) => {
            // update this._value when it's modified from "outside"
            if (ev.target.value !== this._value) {
                this._value = this.checkValue(ev.target.value);
            }
        })

        //this.init()//.then(this.activate.bind(this));
    }

    subscribe(subscriber) {
        this._subscribers = [...this._subscribers, subscriber];
    }

    publish(payload) {
        if (this._subscribers.length) {
            this._subscribers.forEach(subscriber => {
                const evt = new CustomEvent("submsg", {
                    detail: payload,
                });
                subscriber.dispatchEvent(evt);
            });
        } else {
            console.log(payload);
        }
    }

    set value(val) {
        this._value = this.checkValue(val);
    }

    get value() {
        return this._value;
    }

    async init() {
        try {
            await navigator.requestMIDIAccess().then(this.onMIDISuccess.bind(this), this.onMIDIFailure.bind(this));
        } catch (err) {
            const msg = `<b>Web MIDI API not supported by the browser!</b><br>${err.message}`;
            this.publish({
                type: 'error',
                msg
            });
        }
    }

    askChannel() {
        const message = [0xB0, 0x14, 0x10];
        // 0xB0 (decimal 176) control change
        // 0x14 (decimal 20) controller #20
        // 0x10 (decimal 16) to ask for a channel number
        this.sendMIDIMsg(message);
    }

    activate() {
        this._isActive = true;
        // control change, controller #20
        // value (decimal 36) to activate
        const message = [0xB0, 0x14, 0x20];
        this.sendMIDIMsg(message);
        const msg = "<b>MIDI ready!</b>";
        this.publish({ msg });
    }

    desactivate() {
        this._isActive = false;
        // control change, controller #20
        // value (decimal 48) to desactivate
        const message = [0xB0, 0x14, 0x30];
        this.sendMIDIMsg(message);
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

    sendMIDIMsg(msg) {
        const output = this.filterIOs(this.midi.outputs);
        if (this.midi && output) {
            // add channel in LSB to command
            msg[0] += this._channel;
            output.send(msg);
            // reinit timer
            this.timer = Date.now();
        } else {
            const msg = "<b>No MIDI Controller connected</b>";
            this.publish({
                type: 'alert',
                msg
            });
        }
    }

    onMIDISuccess(midiAccess) {
        this.midi = midiAccess; // store in the global (in real usage, would probably keep in an object instance)

        this.midi.onstatechange = (event) => {
            // Print information about the (dis)connected MIDI controller
            const msg = `<b>statechange</b> ${event.port.type} ${event.port.state} ${event.port.name}`;
            this.publish({ msg });
            const name = event.port.name;
            if (name.search(/arduino/i) !== -1) {
                // filters only Arduino messages
                const id = event.port.id;
                const type = event.port.type; // 'input'|'output'
                if (type === 'input') {
                    const newInput = this.midi.inputs.get(id);
                    if (newInput && !newInput.onmidimessage && newInput.state === 'connected') newInput.onmidimessage = this.onMIDIMessage.bind(this);
                }
                if (type === 'output') {
                    const newOutput = this.midi.outputs.get(id);
                    // activate on connection
                    if (newOutput && newOutput.state === 'connected') this.askChannel();
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
    }

    onMIDIFailure(msg) {
        const message = `<b>Failed to get MIDI access</b> - ${msg}`;
        this.publish({
            type: 'error',
            'msg': message
        });
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
        const channel = event.data[0] & 0xF;
        const control = event.data[1];
        const val = event.data[2] || null;

        const msg = `<b>incoming</b> on channel ${channel}: ${(command === 0xB0) ? 'CC' : ''} ${control}, value ${val}`;
        this.publish({ msg });

        if (command === 0xB0) {
            if (control === 20) {
                if (val === channel) {
                    // response to askChannel()
                    console.log("le channel numéro est", channel);
                    this._channel = channel;
                    if (!this._isActive) this.activate();
                } else if (val === 1) {
                    // response to activate demand
                    // starts timer
                    this.timer = Date.now();
                    this.raf = window.requestAnimationFrame(this.ticTac.bind(this));
                }
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
                    case 40:
                        if (channel === this._channel) {
                            // Reset range value to initialValue
                            this.value = this._initialValue;
                        }
                        break;
                }
                this.value = this._value;
                // reinit timer
                this.timer = Date.now();
            }
        }
        // this._target.value = this.value;
        // target emits a custom 'midichange' event
        const evt = new CustomEvent('midichange', {
            detail: {
                value: this.value,
            }
        });
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

    ticTac() {
        const elapsed = Date.now() - this.timer;
        if (elapsed > this.activeSensingPeriod) {
            // Send an Active Sensing message
            const message = [0xB0, 0x14, 0x40];
            this.sendMIDIMsg(message);
        }
        window.requestAnimationFrame(this.ticTac.bind(this));
    }
}

export default MIDIController;