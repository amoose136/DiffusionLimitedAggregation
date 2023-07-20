(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
let selectedElement, offset, transform;
const mySVG = document.getElementById("mySVG");
const redCircle = document.getElementById("redCircle");
const blueCircle = document.getElementById("blueCircle");
const myDownloadSVG = document.getElementById("downloadSVG");

// Create a group for the trees and add it to the SVG
const treeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
mySVG.appendChild(treeGroup);

// Create a group for the particles and add it to the SVG, before the treeGroup
const particleGroup = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g"
);
mySVG.insertBefore(particleGroup, treeGroup);

// Create two empty tree path elements and add them to the group
const positiveTree = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
);
positiveTree.setAttribute("stroke", "#9999FF"); // Change color as needed
positiveTree.setAttribute("fill", "none");
positiveTree.setAttribute("stroke-linecap", "round");
treeGroup.appendChild(positiveTree);

const negativeTree = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
);
negativeTree.setAttribute("stroke", "#FF9999"); // Change color as needed
negativeTree.setAttribute("fill", "none");
negativeTree.setAttribute("stroke-linecap", "round");
treeGroup.appendChild(negativeTree);

// Keep track of the nodes in the trees
const nodes = new Map();

let circleRadius = 5; // or any other value you prefer
let particles = [];
let numParticles = parseInt(document.getElementById("particleNumber").value);
const particleRadius = 3;
let diffusionSpeed = parseFloat(
    document.getElementById("diffusionSpeed").value
);
let playing = false;
let animationFrame;
let dragged = false;
let targetFraction = parseFloat(
    document.getElementById("attractiveForce").value
);

document
    .getElementById("attractiveForce")
    .addEventListener("input", function () {
        targetFraction = parseFloat(this.value);
        document.getElementById("attractiveForceNumber").value = this.value;
    });

document
    .getElementById("attractiveForceNumber")
    .addEventListener("input", function () {
        targetFraction = parseFloat(this.value);
        document.getElementById("attractiveForce").value = this.value;
    });

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
        dragged = true;
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
        if (!playing && dragged) {
            dragged = false; // Reset the flag
            cancelAnimationFrame(animationFrame);
            initParticles();
        }
    }

    selectedElement = null;
    if (playing == false && dragged) {
        dragged = false; // Reset the flag
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

document
    .getElementById("diffusionSpeed")
    .addEventListener("change", (event) => {
        let newSpeed = parseFloat(event.target.value);
        if (isNaN(newSpeed)) {
            event.target.value = diffusionSpeed; // reset to last valid value
        } else {
            diffusionSpeed = newSpeed;
            document.getElementById("speedSlider").value = diffusionSpeed;
        }
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
            if (particle.type == "blue") {
                particle.element.setAttribute("fill", "#4444FF");
            } else {
                particle.element.setAttribute("fill", "#FF4444");
            }
            particleGroup.appendChild(particle.element);
            particles.push(particle);
        });

        positiveTree.setAttribute("d", "");
        negativeTree.setAttribute("d", "");
        nodes.clear();
    }
}

// Run the initial setup
initParticles();

// Add event listener for the reset button
document.getElementById("resetButton").addEventListener("click", () => {
    if (playing) {
        playing = false;
        cancelAnimationFrame(animationFrame);
    }
    initParticles();
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

document.getElementById("hideParticles").addEventListener("change", (event) => {
    const visibility = event.target.checked ? "hidden" : "visible";
    redCircle.style.visibility = visibility;
    blueCircle.style.visibility = visibility;
    particles.forEach(
        (particle) => (particle.element.style.visibility = visibility)
    );
});

document.getElementById("downloadButton").addEventListener("click", () => {
    let wasPlaying = playing;
    if (playing) {
        playing = false;
        cancelAnimationFrame(animationFrame);
    }
    if (!playing) {
        // Empty the download SVG
        while (myDownloadSVG.firstChild) {
            myDownloadSVG.removeChild(myDownloadSVG.firstChild);
        }

        // Copy all elements from display SVG to download SVG
        const allElements = mySVG.querySelectorAll("circle, path");
        allElements.forEach((element) => {
            let clone = element.cloneNode(true);
            // Set visibility of cloned elements based on checkbox state
            if (element.tagName === "circle") {
                clone.style.visibility = document.getElementById(
                    "hideParticles"
                ).checked
                    ? "hidden"
                    : "visible";
            }
            myDownloadSVG.appendChild(clone);
        });

        // Serialize the download SVG
        var svgData = new XMLSerializer().serializeToString(myDownloadSVG);
        var preface = '<?xml version="1.0" standalone="no"?>\r\n';
        var svgBlob = new Blob([preface, svgData], {
            type: "image/svg+xml;charset=utf-8",
        });
        var svgUrl = URL.createObjectURL(svgBlob);
        var downloadLink = document.createElement("a");
        downloadLink.href = svgUrl;
        downloadLink.download = "DLA.svg";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
    if (wasPlaying == true && playing == false) {
        playing = true;
        animationFrame = requestAnimationFrame(mainLoop);
    }
});

// Main loop
const mainLoop = () => {
    const svgRect = mySVG.getBoundingClientRect();
    const margin = svgRect.width * 0.15;

    particles = particles.filter((particle) => {
        if (particle.state.includes("alive")) {
            // Get target circle (opposite color)
            let targetCircle = particle.type === "red" ? blueCircle : redCircle;

            // Compute direction towards target
            let targetDirectionX =
                parseFloat(targetCircle.getAttribute("cx")) - particle.x;
            let targetDirectionY =
                parseFloat(targetCircle.getAttribute("cy")) - particle.y;

            // Normalize direction vector (you could also use a different normalization to make the effect more pronounced)
            let len = Math.sqrt(
                targetDirectionX * targetDirectionX +
                    targetDirectionY * targetDirectionY
            );
            targetDirectionX /= len;
            targetDirectionY /= len;

            // Compute random motion
            let dx = (Math.random() * 2 - 1) * diffusionSpeed;
            let dy = (Math.random() * 2 - 1) * diffusionSpeed;

            // Add a fraction of the target direction to the random motion
            dx += targetFraction * targetDirectionX;
            dy += targetFraction * targetDirectionY;

            // Update position
            particle.x += dx;
            particle.y += dy;
            particle.element.setAttribute("cx", particle.x);
            particle.element.setAttribute("cy", particle.y);

            let opposingCircle =
                particle.type === "red" ? blueCircle : redCircle;

            if (pointInsideCircle(particle, opposingCircle)) {
                // When a particle dies
                particle.state = `dead${particle.type}`;
                particle.element.setAttribute("fill", "grey");

                return true; // keep this particle
            }

            // Check collision with other particles
            particles.forEach((otherParticle) => {
                if (
                    otherParticle.state === `dead${particle.type}` &&
                    pointInsideCircle(particle, otherParticle.element)
                ) {
                    particle.state = `dead${particle.type}`;
                    particle.element.setAttribute("fill", "grey");

                    // Append the new branch to the existing tree path
                    const branch = `M ${particle.x} ${particle.y} L ${otherParticle.x} ${otherParticle.y}`;
                    if (particle.type === "red") {
                        let d = positiveTree.getAttribute("d");
                        positiveTree.setAttribute("d", d + " " + branch);
                    } else {
                        let d = negativeTree.getAttribute("d");
                        negativeTree.setAttribute("d", d + " " + branch);
                    }
                }
            });

            // Check if the particle is off-canvas
            if (
                particle.x < -margin ||
                particle.y < -margin ||
                particle.x > svgRect.width + margin ||
                particle.y > svgRect.height + margin
            ) {
                // Reset the particle to its starting position
                if (particle.type === "red") {
                    particle.x = parseFloat(redCircle.getAttribute("cx"));
                    particle.y = parseFloat(redCircle.getAttribute("cy"));
                } else {
                    particle.x = parseFloat(blueCircle.getAttribute("cx"));
                    particle.y = parseFloat(blueCircle.getAttribute("cy"));
                }
                particle.element.setAttribute("cx", particle.x);
                particle.element.setAttribute("cy", particle.y);
            }
        }

        return true; // keep this particle
    });

    if (playing) {
        animationFrame = requestAnimationFrame(mainLoop);
    }
};

},{}]},{},[1]);
