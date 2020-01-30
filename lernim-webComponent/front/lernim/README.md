[![License badge](https://img.shields.io/badge/license-Apache2-orange.svg)](http://www.apache.org/licenses/LICENSE-2.0)
[![Documentation badge](https://readthedocs.org/projects/fiware-orion/badge/?version=latest)](http://openvidu.io/docs/home/)

[![][OpenViduLogo]](http://openvidu.io)

# lernim-webComponent

## Generate video Web Component files:

* Install NPM dependencies of Angular app:

  `cd lernim-web-ionic/lernim-webComponent/front/lernim `

  `npm install`
 
* To generate video Web Component run this command:

  `npm run build:openvidu-webcomponent -- VERSION`
  
  For example: `npm run build:openvidu-webcomponent -- 2.11.0`

This command is a script declared in the package.json and uses the file `openvidu-webcomponent-build.js`.

    `"build:openvidu-webcomponent": "ng build --prod --output-hashing none && node openvidu-webcomponent-build.js"`

Will generate a folder called `openvidu-webcomponent` that will contain the generated files to implement the Web Component.

  * `openvidu-webcomponent-{VERSION}.js`: JavaScript file of OpenVidu Web Component.
  
  * `openvidu-webcomponent-{VERSION}.css`: styles for OpenVidu Web Component.
  
Here you can see how to use the web component: [demo-webcomponent](https://github.com/naevatec/lernim-web-ionic/tree/master/demo-webcomponent)


## Run to test the app:

1) You will need node, NPM and angular-cli to execute the app. You can install them with:

      `sudo apt-get update`
  
      `sudo curl -sL https://deb.nodesource.com/setup_8.x | sudo bash -`
  
      `sudo apt-get install -y nodejs`
  
      `sudo npm install -g @angular/cli`

2) Openvidu-server and Kurento Media Server must be up and running in your development machine. The easiest way is running this Docker container which wraps both of them (you will need Docker CE):

     `docker run -p 4443:4443 --rm -e openvidu.secret=MY_SECRET openvidu/openvidu-server-kms:2.11.0`
  
3) Launch the server:

     `ng serve --open`
     
First you must create a room with a user with teacher role, the other users don´t have that role.

  * for this you must insert in role input `TEACHER` (in capital letters).




[OpenViduLogo]: https://secure.gravatar.com/avatar/5daba1d43042f2e4e85849733c8e5702?s=120
