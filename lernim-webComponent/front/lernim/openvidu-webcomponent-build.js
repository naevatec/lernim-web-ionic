const fs = require('fs-extra');
const concat = require('concat');

if (process.argv.length != 3) {
    console.warn("Usage: npm run build:openvidu-teaching-webcomponent -- VERSION");
    console.warn('For example: "npm run build:openvidu-teaching-webcomponent -- 2.8.0"');
    process.exit(-1);
}
var VERSION = process.argv[2];

async function buildElement() {
  const files = [
    './dist/openvidu-lernim/runtime.js',
    './dist/openvidu-lernim/polyfills.js',
    './dist/openvidu-lernim/scripts.js',
    './dist/openvidu-lernim/main.js',
  ];

  try {
    await fs.ensureDir('openvidu-webcomponent');
    await concat(files, './openvidu-webcomponent/openvidu-teaching-webcomponent-' + VERSION + '.js')
    await fs.copy('./dist/openvidu-lernim/styles.css', './openvidu-webcomponent/openvidu-teaching-webcomponent-' + VERSION + '.css');
  } catch (err) {
    console.error('Error executing build funtion in webcomponent-builds.js', err);
  }
}

buildElement()
  .then(() => {
    console.log('OpenVidu Web Component (' + VERSION + ') built')
  });
