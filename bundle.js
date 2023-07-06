(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
let selectedElement, offset, transform;
const mySVG = document.getElementById("mySVG");
const redCircle = document.getElementById("redCircle");
const blueCircle = document.getElementById("blueCircle");

let circleRadius = 5; // or any other value you prefer
let particles = [];
let numParticles = parseInt(document.getElementById("particleNumber").value);
const particleRadius = 3;
let diffusionSpeed = parseFloat(
    document.getElementById("diffusionSpeed").value
);
let playing = false;
let animationFrame;

function selectElement(evt) {
    selectedElement = evt.target;
    offset = getMousePosition(evt);
    // Get all the transforms currently on this element
    var transforms = selectedElement.transform.baseVal;
    if (
        transforms.length === 0 ||
        transforms.getItem(0).type !== SVGTransform.SVG_TRANSFORM_TRANSLATE
    ) {
        // Create an transform that translates by (0, 0)
        var translate = mySVG.createSVGTransform();
        translate.setTranslate(0, 0);
        selectedElement.transform.baseVal.insertItemBefore(translate, 0);
    }
    transform = transforms.getItem(0);
    offset.x -= transform.matrix.e;
    offset.y -= transform.matrix.f;
}

function drag(evt) {
    if (selectedElement) {
        evt.preventDefault();
        var coord = getMousePosition(evt);
        transform.setTranslate(coord.x - offset.x, coord.y - offset.y);
    }
}

function deselectElement(evt) {
    if (selectedElement) {
        // Update cx and cy attributes based on the transform
        selectedElement.setAttribute(
            "cx",
            parseFloat(selectedElement.getAttribute("cx")) + transform.matrix.e
        );
        selectedElement.setAttribute(
            "cy",
            parseFloat(selectedElement.getAttribute("cy")) + transform.matrix.f
        );

        // Remove the transform
        selectedElement.transform.baseVal.removeItem(0);
    }

    selectedElement = null;
    if (playing == false) {
        cancelAnimationFrame(animationFrame);
        initParticles();
    }
}

function getMousePosition(evt) {
    var CTM = mySVG.getScreenCTM();
    return {
        x: (evt.clientX - CTM.e) / CTM.a,
        y: (evt.clientY - CTM.f) / CTM.d,
    };
}

// Add event listeners for the circles
redCircle.addEventListener("mousedown", selectElement);
blueCircle.addEventListener("mousedown", selectElement);
window.addEventListener("mousemove", drag);
window.addEventListener("mouseup", deselectElement);

// Add event listeners for the number of particles slider and input field
document.getElementById("particleSlider").addEventListener("input", (event) => {
    numParticles = parseInt(event.target.value);
    document.getElementById("particleNumber").value = numParticles;
});

document.getElementById("particleNumber").addEventListener("input", (event) => {
    numParticles = parseInt(event.target.value);
    document.getElementById("particleSlider").value = numParticles;
});

// Add event listeners for the diffusion speed slider and input field
document.getElementById("speedSlider").addEventListener("input", (event) => {
    diffusionSpeed = parseFloat(event.target.value);
    document.getElementById("diffusionSpeed").value = diffusionSpeed;
});

document.getElementById("diffusionSpeed").addEventListener("input", (event) => {
    diffusionSpeed = parseFloat(event.target.value);
    document.getElementById("speedSlider").value = diffusionSpeed;
});

function pointInsideCircle(particle, circle) {
    let dx = particle.x - parseFloat(circle.getAttribute("cx"));
    let dy = particle.y - parseFloat(circle.getAttribute("cy"));
    return Math.sqrt(dx * dx + dy * dy) <= circleRadius;
}

function initParticles() {
    particles.forEach((particle) => {
        particle.element.remove();
    });
    particles = [];

    for (let i = 0; i < numParticles; i++) {
        let particleRed = {
            x: parseFloat(redCircle.getAttribute("cx")),
            y: parseFloat(redCircle.getAttribute("cy")),
            element: document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle"
            ),
            state: "aliveRed",
            type: "red", // indicating particle source
        };

        let particleBlue = {
            x: parseFloat(blueCircle.getAttribute("cx")),
            y: parseFloat(blueCircle.getAttribute("cy")),
            element: document.createElementNS(
                "http://www.w3.org/2000/svg",
                "circle"
            ),
            state: "aliveBlue",
            type: "blue", // indicating particle source
        };

        [particleRed, particleBlue].forEach((particle) => {
            particle.element.setAttribute("cx", particle.x);
            particle.element.setAttribute("cy", particle.y);
            particle.element.setAttribute("r", particleRadius);
            particle.element.setAttribute("fill", particle.type);
            mySVG.appendChild(particle.element);
            particles.push(particle);
        });
    }
}

// Run the initial setup
initParticles();

// Add event listener for the reset button
document.getElementById("resetButton").addEventListener("click", () => {
    if (playing == true) {
        playing = false;
        cancelAnimationFrame(animationFrame);
        initParticles();
        playing = true;
    } else {
        initParticles();
    }
});

// Add event listeners for the play and pause buttons
document.getElementById("playButton").addEventListener("click", () => {
    if (!playing) {
        playing = true;
        animationFrame = requestAnimationFrame(mainLoop);
    }
});

document.getElementById("pauseButton").addEventListener("click", () => {
    if (playing) {
        playing = false;
        cancelAnimationFrame(animationFrame);
    }
});

document.getElementById("downloadButton").addEventListener("click", () => {
    var svgData = new XMLSerializer().serializeToString(
        document.getElementById("mySVG")
    );
    var preface = '<?xml version="1.0" standalone="no"?>\r\n';
    var svgBlob = new Blob([preface, svgData], {
        type: "image/svg+xml;charset=utf-8",
    });
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = "newSVG.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});

// Main loop
const mainLoop = () => {
    particles.forEach((particle) => {
        if (particle.state.includes("alive")) {
            let dx = (Math.random() * 2 - 1) * diffusionSpeed;
            let dy = (Math.random() * 2 - 1) * diffusionSpeed;
            particle.x += dx;
            particle.y += dy;
            particle.element.setAttribute("cx", particle.x);
            particle.element.setAttribute("cy", particle.y);

            let opposingCircle =
                particle.type === "red" ? blueCircle : redCircle;

            if (pointInsideCircle(particle, opposingCircle)) {
                particle.state = `dead${particle.type}`;
                particle.element.setAttribute("fill", "grey");
                return; // skip further checks
            }

            // Check collision with other particles
            particles.forEach((otherParticle) => {
                if (
                    otherParticle.state === `dead${particle.type}` &&
                    pointInsideCircle(particle, otherParticle.element)
                ) {
                    particle.state = `dead${particle.type}`;
                    particle.element.setAttribute("fill", "grey");
                }
            });
        }
    });

    if (playing) {
        animationFrame = requestAnimationFrame(mainLoop);
    }
};

},{}]},{},[1]);
