const OpenJTalk = require('openjtalk');
const mei = new OpenJTalk();
const spawn = require('child_process').spawn;
const path = require('path');

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

    console.log('jingle:start');
    const jingle = spawn('aplay', [path.join(__dirname, './src/ji_038.wav')]);
    jingle.on('close', code => {
      if (this.aborted) {
        callback(false);
        return;
      }
      console.log('jingle:end');
      this._killHandler = mei.talkList(texts, (err, stdout, stderr) => {
        if (this.aborted) {
          callback(false);
          return;
        }

        if (err) {
          console.log('[err]', err);
        }

        callback(true);
      });
    });

    this._killHandler = () => {
      console.log('jingle.kill()');
      jingle && jingle.kill();
    };
  }

  removeAll() {
    mei.removeAll();
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