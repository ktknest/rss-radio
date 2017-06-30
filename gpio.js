const fs = require('fs');
const path = require('path');
const prc = require('./prc');

class GPIO {

  constructor() {
    this.dir = '/sys/class/gpio/';
    this.pins = {};

    prc.onExit(() => {
      this.writeAllOff();
      this.unexportAll();
    });
  }

  export(pin, direction) {
    fs.writeFileSync(`${this.dir}export`, String(pin));
    fs.writeFileSync(`${this.dir}gpio${pin}/direction`, direction);
    this.pins[pin] = direction;
  }

  write(pin, value) {
    if (this.pins[pin] !== 'out') {
      throw new Error(`${pin} can not writing.`);
    }
    fs.writeFileSync(`${this.dir}gpio${pin}/value`, value);
  }

  getDirection(pin) {
    return this.pins[pin] || null;
  }

  read(pin) {
    if (this.pins[pin] !== 'in') {
      throw new Error(`${pin} can not reading.`);
    }
    const value = Number(fs.readFileSync(`${this.dir}gpio${pin}/value`, 'utf8'));
    return isNaN(value) ? null : value;
  }

  writeAllOff() {
    Object.keys(this.pins).forEach(pin => {
      if (this.pins[pin] !== 'out') {
        return;
      }
      this.write(pin, 0);
    });
  }

  unexportAll() {
    Object.keys(this.pins).forEach(pin => {
      fs.writeFileSync(`${this.dir}unexport`, String(pin));
    });
  }
}

module.exports = new GPIO();