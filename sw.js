const gpio = require('./gpio');

class Sw {
  constructor() {
    this.pins = {};
    this.intervalId = null;
  }

  onChange(pin, handler) {
    if (!this.pins[pin]) {
      const direction = gpio.getDirection(pin);
      console.log(pin, direction);
      if (direction === 'out') {
        throw new Error(`${pin} can not reading.`);
      } else if (!direction) {
        gpio.export(pin, 'in');
      }

      this.pins[pin] = {
        value: gpio.read(pin),
        handlers: []
      };
    }

    if (this.pins[pin].handlers.indexOf(handler) > -1) {
      console.warn('handler is already registered.');
      return;
    }

    this.pins[pin].handlers.push(handler);

    if (!this.intervalId) {
      this._start();
    }
  }

  offChange(pin, handler) {
    const data = this.pins[pin];
    if (!data) {
      return;
    }

    if (handler) {
      const index = data.handlers.indexOf(handler);
      if (index > -1) {
        data.handlers.splice(index, 1);
      }
      return;
    }

    delete this.pins[pin];

    if (Object.keys(this.pins).length === 0) {
      this._stop();
    }
  }

  _start() {
    this.intervalId = setInterval(this._loop.bind(this), 20);
  }

  _stop() {
    clearInterval(this.intervalId);
  }

  _loop() {
    Object.keys(this.pins).forEach(pin => {
      const data = this.pins[pin];

      const nowValue = gpio.read(pin);
      if (nowValue === data.value) {
        return;
      }
      data.value = nowValue;
      data.handlers.forEach(handler => handler(nowValue));
    });
  }
}

module.exports = new Sw();