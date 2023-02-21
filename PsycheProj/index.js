import * as THREE from 'three';
import {ARButton} from 'three/addons/webxr/ARButton.js';
import {OrbitControls} from '../jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {LinearToneMapping} from 'three';
import {Clock} from './build/three.module.js';

// General variables.
let container;
let camera, scene, renderer;
let reticle,pmremGenerator, currentObject, controls;
let hitTestSource = null;
let hitTestSourceRequested = false;
let currentModelState = null;
let touchDown, touchX, touchY, deltaX, deltaY;
let mixer;
const clock = new THREE.Clock();

// Hold the current string that is displayed in the speech box.
let currentNarrativeText;

// Flag to indicate when we are using a string array for the narrative text.
let currentNarrativeTextArrayFlag = 0;

// Hold the array of strings that are iterated through the speech box with the "..." button.
let currentNarrativeTextArray;

// Hold the iterator to keep track of which string within a string array is currently displayed in the speech box.
let currentNarrativeTextIterator = 0;

// Hold the max number of iterations (speech boxes) needed to iterate through the current narrative text diplayed in the speech box.
let currentNarrativeTextSize = 0;

// Narrative (const) text variables.
const greeting = "Hi explorer!  I'm the Psyche satellite, here to guide you.  Look around and click the Place button " +
    "when the reticle is in the center of your screen."

const modelDescriptions = [
    "<Explain State 1 - It's (assumed) appearance 10 million years ago.>",
    "<Explain State 2 - It's (assumed) appearance 5 million years ago.>",
    "<Explain State 3 - It's (assumed) appearance today.>"
];

const facts = [
    [
        [
            "<Model 1 - Fact 1> - This fact is gonna be really long to show the speech box behavior when there are long instances of text we wnat to display.  So, I'm gonna keep typing...",
            "and showing that this can be really long.  Words words words.  These are a bunch of words.  Psyche is an asteroid.  It's really far away.  It's pretty cool.  It's so cool that NASA...",
            "loves it.  This should be in the third speech box."
        ],
        "<Model 1 - Fact 2>",
        "<Model 1 - Fact 3>"
    ],
    [
        "<Model 2 - Fact 1>",
        "<Model 2 - Fact 2>",
        "<Model 2 - Fact 3>"
    ],
    [
        "<Model 3 - Fact 1>",
        "<Model 3 - Fact 2>",
        "<Model 3 - Fact 3>"
    ]
];

init();
animate();

/**
 * Start AR button click.
 * 
 * Initializes the AR experience.
 */
$("#ARButton").click(async function() {
    if(currentObject){
        currentObject.visible = false;
    }

    // Remove title screen background.
    document.getElementById("body").setAttribute("background-image", "none");

    // Set up preliminary objects and elements.
    setSpaceEnvironment(scene);
    loadSatellite();
    showNarrative();
    loadTextToNarrative(greeting);

    // Initiate with model 1.
    currentModelState = 1;
    loadModel(1);
});

/**
 * Place button click.
 * 
 * Displays the Fact buttons, State Change button, and changes narrative text.
 */
$("#place-button").click(function() {
    scene.remove(currentObject);
    loadModel(currentModelState, false);
    loadModelInfoToNarrative();
    unHideButtons();
});

/**
 * Fact 1 button click.
 */
$("#fact-one").click(function() {displayFact(1)});

/**
 * Fact 2 button click.
 */
$("#fact-two").click(function() {displayFact(2)});

/**
 * Fact 3 button click.
 */
$("#fact-three").click(function() {displayFact(3)});

/**
 * displayFact Function
 * 
 * Displays appropriate fact depending on currentModelState variable.
 * @param {*} factNumber - Number (1-3) representing which fact to display.
 */
function displayFact(factNumber) {
    loadTextToNarrative(facts[currentModelState - 1][factNumber - 1]);
}

/**
 * hideButtons Function
 * 
 * Hides all the buttons on the screen.
 */
function hideButtons() {
    document.getElementById("state-change").style.display = "none"
    document.getElementById("fact-one").style.display = "none"
    document.getElementById("fact-two").style.display = "none";
    document.getElementById("fact-three").style.display = "none";
    document.getElementById("place-button").style.display = "none"; // This currently does not remove the place button from the screen
    document.getElementById("menu-icon").style.display = "none";
}

/**
 * unHideButtons Function
 * 
 * Displays all the buttons on the screen.
 */
function unHideButtons() {
    document.getElementById("state-change").style.display = "block"
    document.getElementById("fact-one").style.display = "block";
    document.getElementById("fact-two").style.display = "block";
    document.getElementById("fact-three").style.display = "block";
    document.getElementById("place-button").style.display = "block";
    document.getElementById("menu-icon").style.display = "block";
}

/**
 * Speech Box button click.
 * 
 * The loadTextToNarrative() function does not use the argument in this case.  So it can be anything (or empty string).
 */
$("#speech-box-button").click(function() {loadTextToNarrative("This argument can be anything.")});

/**
 * Change State button click.
 */
$("#state-change").click(function() {changeState(1)});

/**
 * nextState Function
 * 
 * Changes the model to either the next or the previous state.
 * @param {*} next_or_previous - Number (1 or -1)
 * Passing 1 as parameter changes the model to the next state
 * 
 * Passing -1 as parameter changes the model to the previous state
 */ 
async function changeState(next_or_previous) {

    if (next_or_previous == 1)
    {
        // Changing to next sequential state.
        if (currentModelState == 3) {
            currentModelState = 1;
        } else {
            currentModelState++;
        }
    } else if (next_or_previous == -1) {
        // Changing to previous sequential state.
        if (currentModelState == 1) {
            currentModelState = 3;
        } else {
            currentModelState--;
        }
    } else {
        // Invalid value was passed.
    }

    // Remove buttons during state-change animation.
    hideButtons();

    // We will invoke the state change animation here.
    loadTextToNarrative("3 second place holder for state change animation.");
    await sleep(3000);

    // Get current model position, remove model from scene.
    let position = currentObject.position;
    scene.remove(currentObject);

    // Load next model - 'false' is needed for model to place on screen, 'position' is needed to retain same position.
    loadModel(currentModelState, false, position);

    // Display proper narrative based on currentModelState variable.
    loadModelInfoToNarrative();

    // Display the speech box.
    showNarrative();

    // Display fact buttons after state-change animation completes.
    unHideButtons();
}

/**
 * arPlace Function
 * 
 * Places the Psyche asteroid model on the screen at the reticle location.
 */
function arPlace() {
    if (reticle.visible) {
        currentObject.position.setFromMatrixPosition(reticle.matrix);
        currentObject.visible = true;
    }
};

/**
 * Open menu click.
 */
document.getElementById("menu-icon").onclick = function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
}

/**
 * Close menu click.
 */
document.getElementById("close-menu").onclick = function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}

/**
 * Music settings button click.
 * 
 * Mutes/Unmutes the ambient music.
 */
$("#music-settings").click(function() {
    let myAudio = document.getElementById("music");
    myAudio.muted=!myAudio.muted;
})

/**
 * loadSatellite Function
 * 
 * Loads the satellite guide onto the screen.
 */
function loadSatellite() {
    document.getElementById("satellite").width = "60";
}

/**
 * showNarrative Function
 * 
 * Displays the speech box (narrative text).
 */
function showNarrative() {
    document.getElementById("narrative").style.display = "block";
}

/**
 * loadModelInfoToNarrative Function
 * 
 * Loads the proper narrative text (not facts) about the current model to the speech box.
 */
function loadModelInfoToNarrative() {
    loadTextToNarrative(modelDescriptions[currentModelState - 1]);
}

/**
 * loadTextToNarrative Function
 * 
 * Loads specific text to the speech box (narrative text).
 * @param {*} text - Text to load into the speech box.
 */
function loadTextToNarrative(text) {

    // Check if 'text' is a single string or an array of multiple strings.
    if (Array.isArray(text)) {
        // 'text' is an array of multiple strings - we need multiple speech boxes with the '...' button.

        // Set the size.
        currentNarrativeTextSize = text.length;

        // Set the flag.
        currentNarrativeTextArrayFlag = 1;

        // Show the speech box button.
        document.getElementById("speech-box-button").style.display = "block";

        // Set the narrative text array.
        currentNarrativeTextArray = text;

        // Set the narrative text (to be currently displayed).
        currentNarrativeText = currentNarrativeTextArray[currentNarrativeTextIterator];

        // Increment the iterator.
        currentNarrativeTextIterator++;

        // Hide all buttons.
        hideButtons();

    } else if (currentNarrativeTextArrayFlag == 1) {
        // We are currently iterating through 'currentNarrativeTextArray'.  We won't use 'text' parameter here.

        // Set the narrative text (to be currently displayed).
        currentNarrativeText = currentNarrativeTextArray[currentNarrativeTextIterator];

        // If we've displayed the last string in the array, reset our variables and hide the speech box button.
        if (currentNarrativeTextIterator == (currentNarrativeTextSize - 1)) {
            currentNarrativeTextArrayFlag = 0;
            currentNarrativeTextIterator = 0;
            currentNarrativeTextSize = 0;
            document.getElementById("speech-box-button").style.display = "none";
            unHideButtons();
        } else {
            // Increment the iterator.
            currentNarrativeTextIterator++;
        }

    } else {
        // 'text' is a single string.
        currentNarrativeText = text;
        currentNarrativeTextIterator = 0;
        currentNarrativeTextSize = 0;
        document.getElementById("speech-box-button").style.display = "none";
    }

    document.getElementById("narrative").textContent = currentNarrativeText;
}

/**
 * sleep Function
 * 
 * Pauses program execution.
 * @param {number} ms - Amount of time to pause in milliseconds.
 * @returns - Promise object.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * loadModel Function
 * 
 * Loads the proper Psyche asteroid model onto the screen.
 * 
 * @param {*} currentModelState - Number (1-3) representing which model to load.
 * 
 * @param {*} appStart - (optional) Boolean
 * True (or no argument passed) means this is the first model being loaded upon app start.  Model will load not be
 * placed on screen.
 * 
 * False means the Place or State Change button is pressed (this is not the first model being loaded upon app start).
 * Model will load at reticle location.
 * 
 * @param {*} position - (optional) three.js object position (comprised of x, y, z values) representing specific
 * position to place the model.  Used to change state of model while remaining in same position on screen.  If
 * left blank, model will be placed at reticle location.
 */
function loadModel(currentModelState, appStart = true, position = null) {
    new RGBELoader()
    .setDataType(THREE.UnsignedByteType)
    .setPath('assets/')
    .load('photo_studio_01_1k.hdr', function(texture) {

        // Create environment property of scene, involves lighting of object. 
        // https://threejs.org/docs/#api/en/scenes/Scene
        var envmap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.enviroment = envmap;
        texture.dispose();
        pmremGenerator.dispose();

        // Load glb file and add it to scene.
        var loader = new GLTFLoader().setPath('assets/');
      
        loader.load(currentModelState + ".glb", function(glb) {
            currentObject = glb.scene;

            // Gets animation from glb and plays it.
            mixer = new THREE.AnimationMixer(currentObject);

            glb.animations.forEach(animation =>{
                mixer.clipAction(animation).play()
            })

            // Only place model if we are not in the initial app start.
            if (appStart == false) {
                scene.add(currentObject);

                // If a position parameter was passed, place at specified position.
                if (position != null) {
                    currentObject.position.set(position.x, position.y, position.z);
                } else {
                    arPlace();
                }
            }

            controls.update();
            render();
        })
    })
}

/**
 * init Function
 * 
 * Initializes three.js objects necessary for rendering AR scene.
 */
function init() {
    // Create html element and add to container.
    container = document.createElement('div');
    document.getElementById("container").appendChild(container);

    // Initialize scene and camera.
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, (window.innerWidth / window.innerHeight), 0.001, 200);

    // Add light to the scene.
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    light.position.set(0.5, 1, 0.25);
    scene.add(light);

    // Initialize renderer.
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Initializes object for environment map.
    pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader()

    // Allows the camera to orbit around an object.
    controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', render);
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set(0, 0, -0.2);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    let options = {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay']
    }

    options.domOverlay = {root: document.getElementById('content')};
    document.body.appendChild(ARButton.createButton(renderer, options));

    // Handles the creation of reticle, white circle.
    reticle = new THREE.Mesh(
        new THREE.RingGeometry(0.15, 0.2, 32).rotateX((-Math.PI)/ 2 ),
        new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    window.addEventListener('resize', onWindowResize);

    // This code allows the user to spin the model by sliding across it with their finger.
    /*
    renderer.domElement.addEventListener('touchstart',function(e){
        e.preventDefault();
        touchDown=true;
        touchX = e.touches[0].pageX;
        touchY = e.touches[0].pageY;
    },false)

    renderer.domElement.addEventListener('touchend',function(e){
        e.preventDefault();
        touchDown=false;
    },false)

    renderer.domElement.addEventListener('touchmove',function(e){
        e.preventDefault();
        if(!touchDown){
            return;
        }

        deltaX = e.touches[0].pageX-touchX;
        deltaY = e.touches[0].pageY-touchY;
        touchX = e.touches[0].pageX;
        touchY = e.touches[0].pageY;

        rotateObject();
        
    },false)*/
}


/**
 * rotateObject Function
 */
function rotateObject() {
    if (currentObject && reticle.visible) {
        currentObject.rotation.y += (deltaX / 100);
    }
}

/**
 * onWindowResize Function
 */
function onWindowResize() {
    camera.aspect = (window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * setSpaceEnvironment Function
 * 
 * Creates skybox and sets as the space environment scene background.
 * @param {*} scene - three.js Scene object.  Defined in init() Function.
 */
function setSpaceEnvironment(scene) {
    let path = '/assets/stars/';
    let format = '.png';
    let urls = [
        path + 'xpos' + format, path + 'xneg' + format,
        path + 'ypos' + format, path + 'yneg' + format,
        path + 'zpos' + format, path + 'zneg' + format
    ];

    let spaceCube = new THREE.CubeTextureLoader().load(urls);
    spaceCube.format = THREE.RGBAFormat;
    
    scene.background = spaceCube;
}

/**
 * animate Function
 */
function animate() {
    renderer.setAnimationLoop(render);
    requestAnimationFrame(animate);
    controls.update();
}

/**
 * render Function
 * @param {*} timestamp 
 * @param {*} frame 
 */
function render(timestamp, frame) {
    if (frame) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        // Gets change in position for model and updates, allowing for animations.
        const delta = clock.getDelta();
        mixer.update(delta)


        if (hitTestSourceRequested === false) {
            session.requestReferenceSpace('viewer').then(function(referenceSpace) {
                session.requestHitTestSource({ space: referenceSpace }).then(function(source) {
                    hitTestSource = source;
                } );
            } );

            session.addEventListener('end', function() {
                hitTestSourceRequested = false;
                hitTestSource = null;

                reticle.visible = false;

                var box = new THREE.Box3();
                box.setFromObject(currentObject);
                box.center(controls.target);

                document.getElementById("place-button").style.display = "none";
            } );

            hitTestSourceRequested = true;
        }

        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);

            if (hitTestResults.length) {
                const hit = hitTestResults[0];

                document.getElementById("place-button").style.display = "block";

                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
            } else {
                reticle.visible = false;
                document.getElementById("place-button").style.display = "none";
            }
        }
    }

    renderer.render( scene, camera );
}
