const OpenJTalk = require('openjtalk');
const mei = new OpenJTalk();

class Talker {
  constructor() {
    this.aborted = false;
    this._killHandler = null;
  }

  /**
   * 指定文字列の音声を再生する
   * 句読点毎に分解してwavファイル生成→再生を行う
   * @param {string} text
   * @param {Function} callback
   * @return {Promise}
   */
  run(text, callback) {
    this.aborted = false;

    const texts = text.split(/、|。|\r\n|\r|\n/).filter(target => target.length);

    function next() {
      console.log(`[${texts.length}]${texts[0]}`);

      this._killHandler = mei.talk(texts.shift(), (err, stdout, stderr) => {
        if (this.aborted) {
          callback(false);
          return;
        }

        if (err) {
          console.log('[err]', err);
        }

        if (texts.length) {
          next.call(this);
          return;
        }

        callback(true);
      });
    }

    next.call(this);
  }

  abort() {
    console.log('Aborting...');
    if (this._killHandler) {
      this._killHandler();
    }
    this.aborted = true;
  }
}
module.exports = new Talker();