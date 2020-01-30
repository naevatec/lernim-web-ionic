[![License badge](https://img.shields.io/badge/license-Apache2-orange.svg)](http://www.apache.org/licenses/LICENSE-2.0)
[![Documentation badge](https://readthedocs.org/projects/fiware-orion/badge/?version=latest)](http://openvidu.io/docs/home/)

[![][OpenViduLogo]](http://openvidu.io)

# OpenVidu Lernim Ionic

Una aplicación exclusiva del lado del cliente creada con los frameworks Ionic v4 y Angular 7 . Se puede compilar en una aplicación Android nativa , una aplicación iOS nativa y en una aplicación web estándar.

## Running this demo:

1) You will need Node, NPM, Ionic and Cordova to serve the app. Install them with the following command

    `sudo curl -sL https://deb.nodesource.com/setup_8.x | sudo bash -`
    
    `sudo apt-get install -y nodejs`
    
    `sudo npm install -g ionic@latest`
    
    `sudo npm install -g cordova@latest`
    
2) Clone the repo

    `git clone https://github.com/naevatec/lernim-web-ionic.git`

3) Install dependencies

    `cd lernim-web-ionic/lernim-ionic`

    `npm install`

4) openvidu-server and Kurento Media Server must be up and running in your development machine. The easiest way is running this Docker container which wraps both of them (you will need Docker CE)

    `docker run -p 4443:4443 --rm -e openvidu.secret=MY_SECRET openvidu/openvidu-server-kms:2.11.0`
    
    or

    `docker run -p 4443:4443 --rm -e openvidu.secret=MY_SECRET -e openvidu.publicurl=YOUR_OPENVIDU_PUBLIC_URL openvidu/openvidu-server-kms:2.11.0`
    
### In the browser:

  * Run the tutorial
  
    `ionic serve`
    
  * Go to localhost:8100 to test the app once the server is running. The first time you use the docker container, an alert message will suggest you accept the self-signed certificate of openvidu-server when you first try to join a video-call.

### In an Android device with native app:

To deploy the Android APK not only you need to have Java JDK8, Android Studio and Android SDK installed but also you have to set up the specific environment variables. Fortunately, Ionic provide us a [great guide](https://ionicframework.com/docs/installation/android) to allows us to configure step by step all the requirements.

  * When you have your OpenVidu public url, you must set it in `openvidu_secret` variable [in the app](https://github.com/naevatec/lernim-web-ionic/blob/master/lernim-ionic/src/environments/environment.ts) and in the openvidu.publicurl parameter used to run openvidu-server
  
  * Run the tutorial. The app will be automatically launched in your Android device

    `ionic cordova platform add android`
    
    `ionic cordova run android`


### In an iOS device with native app

To deploy the iOS app you will need first to follow this guide to properly configure your development environment. Then, it is crucial to have an OpenVidu Server properly deployed with a valid certificate.

     ¡¡¡ iOS devices will require OpenVidu Server to be deployed in a valid domain well-protected with a certificate. 
     No iPhone or iPad will allow connections to a non-secure OpenVidu Server from within a native application. To facilitate first
     steps with OpenVidu and Ionic on iOS devices, if no custom url is defined here [in the app](https://github.com/naevatec/lernim-web-ionic/blob/master/lernim-ionic/src/environments/environment.ts) then our demos OpenVidu Server will be used. 
     Note: this is a publicly accessible OpenVidu Server. Anyone could access your sessions. Use it only for an initial test and  under your own responsibility!!!

You will need to sign your application in Xcode (opening folder lernim-ionic/platforms/ios) with your developer team to avoid any errors. From [Apple official documentation](https://help.apple.com/xcode/mac/current/#/dev5a825a1ca):

  * Add ios platform and run the tutorial. 
 
    `ionic cordova platform add ios`
    
    `ionic cordova run ios`
 
 
### Integrate module "video-room" OpenVidu

* You need to copy these folders with their content and this files:

    * lernim-ionic/src/app/video-room

    * lernim-ionic/src/app/shared
    
    * lernim-ionic/src/environments
    
    * lernim-ionic/hooks/iosrtc-swift-support.js
    
    * lernim-ionic/src/assets/libs/adapter-4.0.1.js
    
* You need to copy the dependencies and cordova plugins of the file [package.jason](https://github.com/naevatec/lernim-web-ionic/blob/master/lernim-ionic/package.json). The most specific for this module are:

    * `"openvidu-browser": "^2.11.0",`
    
    * `"ngx-linkifyjs": "^1.3.0",`
    
    * `"cordova-plugin-iosrtc": "^6.0.5",`
 
* You need to copy the configuration of the file [config.xml](https://github.com/naevatec/lernim-web-ionic/blob/master/lernim-ionic/config.xml).
    
* include in your [app.module.ts](https://github.com/naevatec/lernim-web-ionic/blob/master/lernim-ionic/src/app/app.module.ts) the import of the module video-room.module:

    * `import { VideoRoomPageModule } from './video-room/video-room.module';`
    
* include in your [app-routing.module.ts](https://github.com/naevatec/lernim-web-ionic/blob/master/lernim-ionic/src/app/app-routing.module.ts) the path of the module video-room.module(you can configure the module path as you need):

    * `const routes: Routes = [
     { path: ':roomName', loadChildren: './video-room/video-room.module#VideoRoomPageModule' },
    ];`

* You need to pass the following parameters to the video module (to the file src/app/video-room/video-room.page.ts):

    * `mySessionId: string;`
    * `myUserName: string;`
    * `role: boolean;`
    
For example as in [dashboard.page.ts](https://github.com/naevatec/lernim-web-ionic/blob/master/lernim-ionic/src/app/dashboard/dashboard.page.ts).


### Get a token from OpenVidu Server   

We need to ask OpenVidu Server for a user token in order to connect to our session. This process should entirely take place in our server-side, not in our client-side. But due to the lack of an application backend in this Demo, the TypeScript code itself will perform the POST operations to OpenVidu Server.

You can see an example here:

* [video-session.service.ts of classroom-demo](https://github.com/OpenVidu/classroom-demo/blob/master/src/angular/frontend/src/app/services/video-session.service.ts)

* [SessionController.java of classroom-demo](https://github.com/OpenVidu/classroom-demo/blob/master/src/main/java/io/openvidu/classroom/demo/session_manager/SessionController.java)

* This behavior MUST BE IN YOUR SERVER-SIDE IN PRODUCTION, by using the API REST, [openvidu-java-client](https://openvidu.io/docs/reference-docs/openvidu-java-client/) or [openvidu-node-client](https://openvidu.io/docs/reference-docs/openvidu-node-client/):

  * Initialize a session in OpenVidu Server (POST /api/sessions)
 
  * Generate a token in OpenVidu Server (POST /api/tokens)
 
  * Configure OpenVidu Web Component in your client side with the token



[OpenViduLogo]: https://secure.gravatar.com/avatar/5daba1d43042f2e4e85849733c8e5702?s=120
