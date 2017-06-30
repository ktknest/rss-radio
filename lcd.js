const exec = require('child_process').exec;

/**
 * 参考
 * http://www.sssg.org/blogs/hiro345/archives/16327.html
 * http://wbbwbb.blog83.fc2.com/blog-entry-221.html
 */

const I2CBUS = 0;
const CHIP_ADDRESS = '0x3e';
const BASE_CMD = `i2cset -y ${I2CBUS} ${CHIP_ADDRESS}`;

class Lcd {
  constructor() {
    const cmdList = [
      `${BASE_CMD} 0 0x38 0x39 0x14 0x78 0x5f 0x6a i`,
      `${BASE_CMD} 0 0x0c 0x01 i`,
      `${BASE_CMD} 0 0x06 i`,
    ];
		exec(cmdList.join(';'), (err, stdout, stderr) => {
			//
		});
  }

  print(text) {
    const hexText = Array.prototype.map.call(text, char => {
      let hexChar = char.charCodeAt().toString(16);
      if (hexChar.length !== 2) {
        hexChar = '2a'; // "*"
      }
      return `0x${hexChar}`;
    });

    const clear1Cmd = `${BASE_CMD} 0x00 0x01 i`;
    const clear2Cmd = `${BASE_CMD} 0x00 0xc0 i`;
    const line1Cmd = `${BASE_CMD} 0x40 ${hexText.slice(0, 8).join(' ')} i`;
    const line2Cmd = `${BASE_CMD} 0x40 ${hexText.slice(8, 16).join(' ')} i`;
    let cmdList = [clear1Cmd, line1Cmd, clear2Cmd, line2Cmd];

		exec(cmdList.join(';'), (err, stdout, stderr) => {
			//
		});
  }
}

module.exports = new Lcd();