class Prc {
  constructor() {
    this.handlers = [];

    process.on('SIGINT', () => {
      this.handlers.forEach(handler => handler());
      process.exit(0);
    });

    process.on('exit', code => {
      console.log('\nexiting program...');
      console.log('return code: ' + code);
    });
  }
  
  onExit(handler) {
    if (this.handlers.indexOf(handler) > -1) {
      return;
    }
    this.handlers.push(handler);
  }
}

module.exports = new Prc();