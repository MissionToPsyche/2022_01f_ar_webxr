import * as THREE from 'three';
import {ARButton} from 'three/addons/webxr/ARButton.js';
import {OrbitControls} from '../jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {LinearToneMapping} from 'three';
import {Clock} from './build/three.module.js';

// General variables.
let modelViewArea;
let camera, scene, renderer;
let reticle,pmremGenerator, currentObject, controls;
let hitTestSource = null;
let hitTestSourceRequested = false;
let currentModelState = null;
let touchDown, touchX, touchY, deltaX, deltaY;
let mixer;
let narrativeIterator;      // Number to keep track of narrative sequence when more than 1 speech box is needed for a single narrative.
let narrativeTextIndicator; // Number to indicate what type of narrative text is currently in the speech box (model description (0), state change description (1), fact (2)).
let currentFactNumber;      // Number to track of the current fact number when a narrative with multiple speech boxes is currently being iterated through.
const clock = new THREE.Clock();

// File name variables.
const globalMeshTexture = "pixel-rocks.png";
const assets = "assets/";

// Narrative (const) text variables.
const introText = "Welcome to the 16-Psyche AR Experience!  Here you'll learn all about NASA's Psyche asteroid exploration mission!" +
    "  We'll teach you about the leading hypothesis of Psyche's creation as well as neat factoids about the mission.";

const greeting = "Hello explorer!  When you're ready, look around and click the Place button when the reticle is in the center of your screen.";

const modelDescriptions = [
    // Model 1 Description
    "Stage 1: Formation of planetesimal",

    // State Change 1 Description - String Array indicates it will use multiple speech boxes.
    ["<Explain transition from State 1 to State 2 - It accumulated particles over time.>",
    "This is a transition 1 -> 2 test.",
    "Also a transition 1 -> 2 test."],

    // Model 2 Description - String Array indicates it will use multiple speech boxes.
    ["Stage 2: Planetesimal",
    "This is a model 2 test.",
    "Also a model 2 test."],

    // State Change 2 Description
    "<Explain transition from State 2 to State 1 - It was broken down over time.>",

    // Model 3 Description
    "Stage 3: Core/Current asteroid"
];

const facts = [
    // Model 1 Educational Information
    [
        // Model 1 - Asteroid Button - String Array indicates it will use multiple speech boxes.
        ["Planetesimals are one of the building blocks of planets. The hypothesis that Psyche could potentially be leftover core material from a",
        "planetesimal could lead scientists to be able to investigate questions about Earth's core, including how it was formed."],

        // Model 1 - Question Button
        "How might Psyche have formed?",

        // Model 1 - Spacecraft Button - String Array indicates it will use multiple speech boxes.
        ["The spacecraft will is equipped with two Multispectral Imagers. These high resolution cameras will capture images of the asteroid's surface at",
        "different wavelengths of light. This, along with pictures of the topography of Psyche, will allow scientists to study features that provide",
        "clues to Psyche's history."]
    ],

    // Model 2 Educational Information
    [
        // Model 2 - Asteroid Button - String Array indicates it will use multiple speech boxes.
        ["Scientists think Psyche may consist largely of metal from the core of a planetesimal, one of the building blocks of the rocky planets in our",
        "solar system (Mercury, Venus, Earth and Mars). Psyche is most likely a survivor of multiple violent hit-and-run collisions with other material,",
        "common when the solar system was forming."],

        // Model 2 - Question Button
        "How will it be determined if Psyche is core material of a planetesimal?",
        
        // Model 2 - Spacecraft Button - String Array indicates it will use multiple speech boxes.
        ["All of the instruments on the spacecraft will provide clues but, in particular, the magnetometer will look for evidence of an ancient",
        "magnetic field: if Psyche has a significant magnetic field still in its solid body, it was once a core that produced its own dynamo."]
    ],

    // Model 3 Educational Information
    [
        // Model 3 - Asteroid Button - String Array indicates it will use multiple speech boxes.
        ["After numerous collisions, it is hypothesized that the potential planetesimal would have its rocky mantle stripped away and leave behind the",
        "core material. This core material could potentially be what makes up the current asteroid Psyche."],

        // Model 3 - Question Button
        "What is it that planetary cores are made of?",

        // Model 3 - Spacecraft Button - String Array indicates it will use multiple speech boxes.
        ["The spacecraft contains a Gamma Ray and Neutron Spectrometer that will detect, measure, and map Psyche's elemental composition.  These measurements",
        "will be able to give scientists a better idea of what exactly it is that potentially makes up the inner cores of planets."]
    ]
];

// This allows the user to arrive at a newly initialized session from
// the back button in the browser.
window.addEventListener( "pageshow", function ( event ) {
    var historyTraversal = event.persisted || 
                           ( typeof window.performance != "undefined" && 
                                window.performance.navigation.type === 2 );
    if ( historyTraversal ) {
      // Handle page restore.
      window.location.reload();
    }
});

init();
animate();

$("#text-only-button").click(async function(){

    $("#incompatible-browser-modal").hide();

    // load text-version
    document.getElementById("content").innerHTML='<object type="text/html" data="text-version.html"></object>';
})

$("#xr-viewer").click(async function(){

})

/**
 * Start AR button click.
 * 
 * Initializes the AR experience.
 */
$("#ARButton").click(async function() {
    if(currentObject){
        currentObject.visible = false;
    }

    // Set up preliminary objects and elements.
    setSpaceEnvironment(scene);
    loadSatellite();
    showNarrative();
    loadTextToNarrative(greeting);

    // Initiate with model 1.
    currentModelState = 1;
    loadModel(1);

    // Load the Place and Menu button.
    showViewElements("place-view-element");

    // Entirely remove the display of the <p> tag in order to preserve the formatting of the main HTML doc.
    document.getElementById("intro").style.display = "none";
});

/**
 * Place button click.
 * 
 * Displays the Fact buttons, State Change button, and changes narrative text.
 */
$("#place-button").click(function() {
    scene.remove(currentObject);
    loadModel(currentModelState, false);
    showViewElements("main-view-element");
    narrativeTextIndicator = 0  // Set the indicator to indicate we are displaying a Model Description.
    displayModelDescription();
});

/**
 * Show/Hide Dashboard Button
 */
$("#dashboard-button").click(function() {
    $("#dashboard").slideToggle("fast", "swing");
})

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
    let factText;
    currentFactNumber = factNumber; // Set the global Fact Number variable.
    narrativeTextIndicator = 2      // Set the indicator to indicate we are displaying a Fact.

    // Use switch to load correct string from 'facts' string array.
    switch (currentModelState) {
        case 1:
            factText = facts[0][factNumber - 1];
            break;
        case 2:
            break;
        case 3:
            factText = facts[1][factNumber - 1];
            break;
        case 4:
            break;
        case 5:
            factText = facts[2][factNumber - 1];
            break;
    }

    // If 'factText' is an array, we need multiple sequential speech boxes.  Otherwise, it is a single String and is loaded directly.
    if (Array.isArray(factText)) {
        startNarrativeSequence(factText);
    } else {
        loadTextToNarrative(factText);
    }
}

// NOTE:    These show and hide functions can be replaced with simple JQuery functions.
//          JQuery provides show() and hide() methods that can perform on class names.
//          https://www.w3schools.com/jquery/jquery_hide_show.asp

/**
 * showViewElements Function
 * 
 * @param view - The class name for which view elements to show.
 * 
 * "main-view-element" - shows elements with class "main-view-element"
 * "state-change-element" - shows elements with class "state-change-element"
 */
function showViewElements(view){
    const elements = document.getElementsByClassName(view);

    Array.from(elements).forEach(element => {
        element.style.visibility = "visible";
    });
}

/**
 * hideViewElements Function
 * 
 * @param view - The class name for which view elements to hide.
 * 
 * "main-view-element" - hides elements with class "main-view-element"
 * "state-change-element" - hides elements with class "state-change-element"
 */
function hideViewElements(view){
    const elements = document.getElementsByClassName(view);

    Array.from(elements).forEach(element => {
        element.style.visibility = "hidden";
    });
}

/**
 * Change State button click.
 */
$("#state-change").click(function() {changeState(1)});

/**
 * Next button click.
 */
$("#next-button").click(function() {changeState(1)});

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
        if (currentModelState == 5) {
            currentModelState = 1;
        } else {
            currentModelState++;
        }
    } else if (next_or_previous == -1) {
        // Changing to previous sequential state.
        if (currentModelState == 1) {
            currentModelState = 5;
        } else {
            currentModelState--;
        }
    } else {
        // Invalid value was passed.
    }

    // If 'currentModelState' is an even number, we're in a transition state.  Hide buttons, display Next button.
    if ((currentModelState % 2) == 0) {
        hideViewElements("main-view-element");
        showViewElements("state-change-element")
        narrativeTextIndicator = 1; // Set the indicator to indicate we are displaying a State Change Description.
    } else {
        hideViewElements("state-change-element");
        showViewElements("main-view-element");
        narrativeTextIndicator = 0; // Set the indicator to indicate we are displaying a Model Description.
    }

    // Get current model position, remove model from scene.
    let position = currentObject.position;
    scene.remove(currentObject);

    // Load next model - 'false' is needed for model to place on screen, 'position' is needed to retain same position.
    loadModel(currentModelState, false, position);

    // Display proper narrative based on currentModelState variable.
    displayModelDescription();

    // Display the speech box.
    showNarrative();
}

/** 
 * startNarrativeSequence Function
 * 
 * Starts the narrative sequence for narratives that require the use of more than 1 speech box.  In lieu of using a
 * scroll bar, this function initiates a sequence of speech boxes for narratives that do not fit into a single speech
 * box.
 * 
 * @param {String Array} text - Text to be loaded to the narrative iteratively.
*/
function startNarrativeSequence(text) {
    showViewElements("speech-box-button");
    hideViewElements("main-view-element");
    hideViewElements("state-change-element");
    narrativeIterator = 0;
    loadTextToNarrative(text[0]);
}

/**
 * Speech Box button click.
 * 
 * Iterates to the next narrative element shown in the speech box.
 */
$("#speech-box-button").click(function() {
    narrativeIterator++;
    let length;
    let nextText;

    // Get the proper String Array depending on the 'narrativeTextIndicator' value (0 for Model, 1 for State Change, 2 for Fact).
    if (narrativeTextIndicator == 0 || narrativeTextIndicator == 1) {
        // Model and State Change Descriptions use same 'modelDescriptions' variable so are put in the same conditional statement.
        length = modelDescriptions[currentModelState - 1].length;
        nextText = modelDescriptions[currentModelState - 1][narrativeIterator];
    } else if (narrativeTextIndicator == 2) {
        // Because 'currentModelState' ranges 1-5 and the Facts[] Array has only 3 elements, use a switch to get proper String, similar to the switch in displayFact() function.
        switch (currentModelState) {
            case 1:
                length = facts[0][currentFactNumber - 1].length;
                nextText = facts[0][currentFactNumber - 1][narrativeIterator];
                break;
            case 3:
                length = facts[1][currentFactNumber - 1].length;
                nextText = facts[1][currentFactNumber - 1][narrativeIterator];
                break;
            case 5:
                length = facts[2][currentFactNumber - 1].length;
                nextText = facts[2][currentFactNumber - 1][narrativeIterator];
                break;
            default:
                break;
        }
    }

    loadTextToNarrative(nextText);

    // If our iterator indicates that this is the last string of the sequence, we end the sequence.
    if (narrativeIterator == (length - 1)) {
        endNarrativeSequence();
    }
})

/**
 * endNarrativeSequence Function
 * 
 * Ends the narrative sequence.  Shows/Hides proper view elements and restarts all counters/iterators.
 */
function endNarrativeSequence() {
    hideViewElements("speech-box-button");

    // Show the proper button(s) based on the the type of narrative currently being shown in the speech box.
    if (narrativeTextIndicator == 1) {
        showViewElements("state-change-element");
    } else {
        showViewElements("main-view-element");
    }
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
document.getElementById("menu-button").onclick = function openNav() {
    document.getElementById("sidenav").style.width = "250px";
}

/**
 * Close menu click.
 */
document.getElementById("close-menu").onclick = function closeNav() {
    document.getElementById("sidenav").style.width = "0";
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
    $("#satellite").show();
}

/**
 * showNarrative Function
 * 
 * Displays the speech box (narrative text).
 */
function showNarrative() {
    document.getElementById("textBox").style.display = "block";
    document.getElementById("narrative").style.display = "block";
}

function hideNarrative(){
    document.getElementById("textBox").style.display = "none";
    document.getElementById("narrative").style.display = "none";
}

/**
 * displayModelDescription Function
 * 
 * Loads the proper model description about the current model to the speech box.
 */
function displayModelDescription() {
    let descriptionText = modelDescriptions[currentModelState - 1];

    if (Array.isArray(descriptionText)) {
        startNarrativeSequence(descriptionText);
    } else {
        loadTextToNarrative(descriptionText);
    }
}

/**
 * loadTextToNarrative Function
 * 
 * Loads specific text to the speech box (narrative text).
 * @param {*} text - Text to load into the speech box.
 */
function loadTextToNarrative(text) {
    document.getElementById("narrative").textContent = text;
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

        // Load texture file for mesh's
        var textureLoader = new THREE.TextureLoader().setPath('assets/');
        var texture = textureLoader.load(globalMeshTexture);
        texture.flipY = false;
      
        loader.load(currentModelState + ".glb", function(glb) {
            currentObject = glb.scene;

            // This block of code applies the texture to all Mesh's in the .glb file
            currentObject.traverse ( ( o ) => {
                if ( o.isMesh ) {
                    o.material.map = texture;
                    o.material.bumpMap = texture;
                    o.material.roughnessMap = texture;

                    // Affects how intense the shading is based on the texture
                    o.material.bumpScale = 0.1;
                }
            } );

            // Gets animation from glb and plays it.
            mixer = new THREE.AnimationMixer(currentObject);

            glb.animations.forEach(animation =>{

                /*
                // This if statement will ensure that state change animations only play once
                if((currentModelState % 2) == 0){
                    mixer.clipAction(animation).setLoop(THREE.LoopOnce);
                }
                */

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
    // Load the introduction text.
    document.getElementById("intro").textContent = introText;

    // Mute music by default.
    document.getElementById("music").muted = true;

    // Create html element and add to modelViewArea
    modelViewArea = document.createElement('div');
    document.getElementById("model-view-area").appendChild(modelViewArea);

    // Hide speech bubble
    hideNarrative();

    // Initialize scene and camera.
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, (window.innerWidth / window.innerHeight), 0.001, 200);

    // Add lights to the scene
    const directionalLight = new THREE.DirectionalLight(0x404040, 1);
    scene.add(directionalLight);

    const hemisphereLight = new THREE.HemisphereLight(0xf6e86d, 0x404040, 1);
    scene.add(hemisphereLight);

    const spotLight = new THREE.SpotLight(0xf6e86d, 1, 10, Math.PI/2);
    scene.add(spotLight);
    

    // Initialize renderer.
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    modelViewArea.appendChild(renderer.domElement);

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

                document.getElementById("place-button").setAttribute("disabled", "true");
            } );

            hitTestSourceRequested = true;
        }

        if (hitTestSource) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);

            if (hitTestResults.length) {
                const hit = hitTestResults[0];

                document.getElementById("place-button").removeAttribute("disabled");

                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
            } else {
                reticle.visible = false;
                document.getElementById("place-button").setAttribute("disabled", "true");
            }
        }
    }

    renderer.render( scene, camera );
}
