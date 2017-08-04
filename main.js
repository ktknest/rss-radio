const gpio = require('./gpio');
const talker = require('./talker');
const resource = require('./resource');
const lcd = require('./lcd');
const prc = require('./prc');
const sw = require('./sw');

const PINS = {
  RED_LED: 0,
  YELLOW_LED: 1,
  MAIN_SWITCH: 16,
  CH_SWICH: 3,
  AUTO_SWITCH: 14,
};
const noop = function() {};

class RSS_RADIO {
  constructor() {
    this.isPlaying = false;
    this.isLoaded = false;
    this.loadingId = null;
    this.abort = noop;

    this.setup();
  }

  setup() {
    gpio.export(PINS.RED_LED, 'out');
    gpio.export(PINS.YELLOW_LED, 'out');
    gpio.export(PINS.MAIN_SWITCH, 'in');
    gpio.export(PINS.CH_SWICH, 'in');
    gpio.export(PINS.AUTO_SWITCH, 'in');

    prc.onExit(() => {
      talker.removeAll();
      lcd.print('EXIT');
    });

    this.startLoading();
    this.retry(this.fetch.bind(this), 5, 5000);

    sw.onChange(PINS.MAIN_SWITCH, value => {
      console.log(`[SW:${PINS.MAIN_SWITCH}] ${value}`);

      if (value === 0 || !this.isLoaded) {
        return;
      }

      if (!this.isPlaying) {
        this.play();
      } else {
        talker.abort();
      }
    });

    sw.onChange(PINS.CH_SWICH, value => {
      console.log(`[SW:${PINS.CH_SWICH}] ${value}`);

      if (value === 0 || !this.isLoaded) {
        return;
      }

      this.media = this.media === 'google' ? 'makezine' : 'google';
      talker.abort();
      lcd.print(`STOP    ${this.media}`);
    });
  }

  retry(fn, retryCnt, interval) {
    const recursiveFn = () => fn()
      .catch(() => {
        if (--retryCnt < 1) {
          return;
        }
        setTimeout(() => recursiveFn(), interval);
      });

    recursiveFn();
  }

  fetch() {
    return (process.env.NODE_MODE === 'offline' ? resource.fetchDummy() : resource.fetch())
      .then(result => {
        console.log('Loaded: all');
        this.media = resource.getMediaKeys()[0];
        this.endLoading();
      })
      .catch(err => {
        console.log('fetch error:', err);
      });
  }

  startLoading() {
    let cnt = 1;
    lcd.print(`LOADING${Array(cnt).fill('.').join('')}`);
    let loadingValue = 0;
    this.loadingId = setInterval(() => {
      loadingValue = loadingValue ? 0 : 1;
      gpio.write(PINS.RED_LED, loadingValue);
      cnt++;
      if (cnt > 3) {
        cnt = 1;
      }
    }, 200);
  }

  endLoading() {
    lcd.print('READY');
    clearInterval(this.loadingId);
    gpio.write(PINS.RED_LED, 1);
    this.isLoaded = true;
  }

  play() {
    // ON
    gpio.write(PINS.RED_LED, 0);
    gpio.write(PINS.YELLOW_LED, 1);
    this.isPlaying = true;

    const data = resource.getMediaList(this.media);
    console.log(`=== play: ${this.media}`);
    lcd.print(`PLAY    ${this.media}`);

    let index = Math.floor(Math.random() * data.length);
    let title = data[index].title;
    let description = data[index].description;

    console.log('Start: title >', title);
    talker.run([`${resource.getMediaName(this.media)}の次のニュースです`, title, description].join('\n'), result => {
      // LOOP
      if (!gpio.read(PINS.AUTO_SWITCH)) {
        this.play();
        return;
      }

      // OFF
      gpio.write(PINS.RED_LED, 1);
      gpio.write(PINS.YELLOW_LED, 0);
      this.isPlaying = false;
      this.abort = noop;
      console.log('End', result);
      lcd.print(`STOP    ${this.media}`);
    });
  }
}

new RSS_RADIO();