const fetch = require('node-fetch');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
const htmlToText = require('html-to-text');
const fs = require('fs');
const path = require('path');

const rss = {
  google : {
    path: 'https://news.google.com/news?hl=ja&ned=us&ie=UTF-8&oe=UTF-8&output=rss',
    name: 'グーグル'
  },
  makezine : {
    path: 'http://makezine.jp/feed',
    name: 'メイク'
  }
};

const dummyJson = {
  google : {
    path: './src/google.json',
    name: 'グーグル'
  },
  makezine : {
    path: './src/makezine.json',
    name: 'メイク'
  }
};

class Resource {
  constructor() {
    this.data = {};
  }

  fetch() {
    return Promise.all(Object.keys(rss).map(media => {
      return fetch(rss[media].path)
        .then(res => {
          return res.text();
        })
        .then(body => {
          return new Promise((resolve, reject) => {
            parser.parseString(body, (err, result) => {
              console.log(`Loaded: ${media}`);
              this.data[media] = {
                name: rss[media].name,
                list: result.rss.channel[0].item.map(item => {
                  let title = htmlToText.fromString(item.title[0]);
                  let description = htmlToText.fromString(item.description[0], {
                    ignoreHref: true,
                    ignoreImage: true
                  });
                  return {
                    title: title,
                    description: description
                  };
                })
              };
              fs.writeFile(path.join(__dirname, `./src/${media}.json`), () => {
                console.log(`save ${path.join(__dirname, `./src/${media}.json`)}`);
              });
              resolve();
            });
          });
        });
    }));
  }

  fetchDummy() {
    console.log('fetchDummy');
    return Promise.all(Object.keys(dummyJson).map(media => {
      return new Promise((resolve, reject) => {
        fs.readFile(path.join(__dirname, dummyJson[media].path), (err, data) => {
          this.data[media] = {
            name: dummyJson[media].name,
            list: JSON.parse(data.toString())
          };
          resolve();
        });
      });
    }));
  }

  getMediaList(media) {
    return this.data[media].list;
  }

  getMediaName(media) {
    return this.data[media].name;
  }

  getMediaKeys() {
    return Object.keys(rss);
  }
}

module.exports = new Resource();