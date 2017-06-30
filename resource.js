const fetch = require('node-fetch');
const xml2js = require('xml2js');
const parser = new xml2js.Parser();
const htmlToText = require('html-to-text');

const rss = {
  google : 'https://news.google.com/news?hl=ja&ned=us&ie=UTF-8&oe=UTF-8&output=rss',
  makezine : 'http://makezine.jp/feed'
};

class Resource {
  constructor() {
    this.data = {};
  }

  fetch() {
    return Promise.all(Object.keys(rss).map(media => {
      return fetch(rss[media])
        .then(res => {
          return res.text();
        })
        .then(body => {
          return new Promise((resolve, reject) => {
            parser.parseString(body, (err, result) => {
              console.log(`Loaded: ${media}`);
              this.data[media] = result.rss.channel[0].item.map(item => {
                let title = htmlToText.fromString(item.title[0]);
                let description = htmlToText.fromString(item.description[0], {
                  ignoreHref: true,
                  ignoreImage: true
                });
                return {
                  title: title,
                  description: description
                };
              });
              resolve();
            });
          });
        });
    }));
  }

  getData(media) {
    return this.data[media];
  }

  getMediaNames() {
    return Object.keys(rss);
  }
}

module.exports = new Resource();