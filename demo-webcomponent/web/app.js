var OPENVIDU_SERVER_URL = "https://" + location.hostname + ":4443";
var OPENVIDU_SERVER_SECRET = "4p1x3ls";

$(document).ready(() => {
    const webComponent = document.querySelector("openvidu-teaching-webcomponent");
    const form = document.getElementById("main");

    webComponent.addEventListener("joinSession", (event) => {
        form.style.display = "none";
        webComponent.style.display = "block";
    });
    webComponent.addEventListener("leaveSession", (event) => {
        form.style.display = "block";
        webComponent.style.display = "none";
    });
    webComponent.addEventListener("error", (event) => {
        console.log("Error event", event.detail);
    });
});

function joinSession() {
    const sessionName = document.getElementById("sessionName").value;
    const user = document.getElementById("user").value;
    const teacher = document.getElementById("checkTeacher");
    const roleTeacher = !!teacher.checked;

    const webComponent = document.querySelector("openvidu-teaching-webcomponent");
    console.log(webComponent);
    webComponent.sessionConfig = {
        sessionName,
        user,
        ov_url: OPENVIDU_SERVER_URL,
        ov_secret: OPENVIDU_SERVER_SECRET,
        students: null,
        roleTeacher
    };
}
