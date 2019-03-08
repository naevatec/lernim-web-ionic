[![License badge](https://img.shields.io/badge/license-Apache2-orange.svg)](http://www.apache.org/licenses/LICENSE-2.0)
[![Documentation badge](https://readthedocs.org/projects/fiware-orion/badge/?version=latest)](http://openvidu.io/docs/home/)

[![][OpenViduLogo]](http://openvidu.io)

# Demo-openvidu-webcomponent

## Running this demo:

1) Clone the repo and You will need an http web server installed in your development computer to execute the tutorial. If you have node.js installed, you can use http-server to serve application files. It can be installed with:

  `npm install -g http-server`

2) openvidu-server and Kurento Media Server must be up and running in your development machine. The easiest way is running this Docker container which wraps both of them (you will need Docker CE):

  `docker run -p 4443:4443 --rm -e openvidu.secret=MY_SECRET openvidu/openvidu-server-kms:2.8.0`

3) Run the demo and go to localhost:8080 to test the app once the server is running. The first time you use the docker container, an alert message will suggest you accept the self-signed certificate of openvidu-server when you first try to join a video:

  `http-server lernim-web-ionic/demo-webcomponet/web`


## The code:

* We need to reference two files to implement the webComponet:

  * `openvidu-teaching-webcomponent-{VERSION}.js`: JavaScript file of OpenVidu Web Component. You don't have to manipulate this file.
  
  * `openvidu-teaching-webcomponent-{VERSION}.css`: styles for OpenVidu Web Component. You don't have to manipulate this file.
  
* OpenVidu Web Component emits events `joinSession`, `leaveSession` or `error`, so we can handle them in our JavaScript code. We just need to get the element once the document is ready and add all the listeners we want.


## Configuring OpenVidu Web Component (Session Configuration):

* Method joinSession() gets:

  * The form input values, with the video-call to connect and the nickname the user will have in it.
  
  * The `token` from OpenVidu Server. Check out next point to see how this is done.
  
* When we have our token available, the only thing left to do is to give the desired configuration to openvidu-webcomponent. To do so we use an object with three parameters: `sessionName`, `user`, `roleTeacher` and `token`:

  * `sessionName`: the session name that will be displayed inside the component and to open the session.
  
  * `user`: the nickname that the user will have in the session..
  
  * `roleTeacher`: teacher role true or false (student).
  
  * `token`: the retrieved token from OpenVidu Server.


## Get a token from OpenVidu Server

We need to ask OpenVidu Server for a user token in order to connect to our session. This process should entirely take place in our server-side, not in our client-side. But due to the lack of an application backend in this Demo, the JavaScript code itself will perform the POST operations to OpenVidu Server.

You can see an example here:

* [video-session.service.ts of classroom-demo](https://github.com/OpenVidu/classroom-demo/blob/master/src/angular/frontend/src/app/services/video-session.service.ts)

* [SessionController.java of classroom-demo](https://github.com/OpenVidu/classroom-demo/blob/master/src/main/java/io/openvidu/classroom/demo/session_manager/SessionController.java)

* This behavior MUST BE IN YOUR SERVER-SIDE IN PRODUCTION, by using the API REST, [openvidu-java-client](https://openvidu.io/docs/reference-docs/openvidu-java-client/) or [openvidu-node-client](https://openvidu.io/docs/reference-docs/openvidu-node-client/):

  * Initialize a session in OpenVidu Server (POST /api/sessions)
 
  * Generate a token in OpenVidu Server (POST /api/tokens)
 
  * Configure OpenVidu Web Component in your client side with the token
  

[OpenViduLogo]: https://secure.gravatar.com/avatar/5daba1d43042f2e4e85849733c8e5702?s=120
