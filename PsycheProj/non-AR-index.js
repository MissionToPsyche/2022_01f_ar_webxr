import * as THREE from 'three';
import {OrbitControls} from '../jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import {LinearToneMapping} from 'three';
import {Clock} from './build/three.module.js';
import text from '/text.js';
import utilities from '/three-utilities.js';

// General variables.
let modelViewArea;
let scene, renderer, camera;
let reticle,pmremGenerator, currentObject, controls;
let currentModelState = null;
let mixer;
let narrativeIterator;      // Number to keep track of narrative sequence when more than 1 speech box is needed for a single narrative.
let narrativeTextIndicator; // Number to indicate what type of narrative text is currently in the speech box (model description (0), state change description (1), fact (2)).
let currentFactNumber;      // Number to track of the current fact number when a narrative with multiple speech boxes is currently being iterated through.
const clock = new THREE.Clock();

// File name variables.
const globalMeshTexture = "pixel-rocks.png";

// Variables for text from text.js
const greeting = text.greeting;
const modelDescriptions = text.modelDescriptions;
const facts = text.facts;

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

/**
 * non-ar-start-button click.
 * 
 * Initializes the non-AR experience.
 */
$("#non-ar-start-button").click(async function() {

    if(currentObject){
        currentObject.visible = false;
    }

    $('#non-ar-start-button').hide();
    $("#startup-image").hide();

    // Set up preliminary objects and elements.
    let starImagesFilePath = '/assets/stars_opaque/'
    utilities.setSpaceEnvironment(scene, starImagesFilePath);
    $("#satellite").show();
    showNarrative();
    loadTextToNarrative(greeting);
    
    // Initiate with model 1.
    currentModelState = 1;
    loadModel(1);

    // Load the Place and Menu button.
    showViewElements("place-view-element");
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
 * Change State button click.
 */
$("#state-change").click(function() {changeState(1)});

/**
 * Next button click.
 */
$("#next-button").click(function() {changeState(1)});

/**
 * displayFact Function
 * 
 * Displays appropriate fact depending on currentModelState variable.
 * @param {*} factNumber - Number (1-3) representing which fact to display.
 */
function displayFact(factNumber) {
    endNarrativeSequence();
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
 * nextState Function
 * 
 * Changes the model to either the next or the previous state.
 * @param {*} next_or_previous - Number (1 or -1)
 * Passing 1 as parameter changes the model to the next state
 * 
 * Passing -1 as parameter changes the model to the previous state
 */ 
async function changeState(next_or_previous) {
    endNarrativeSequence();

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
    //hideViewElements("main-view-element");
    //hideViewElements("state-change-element");
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
 * showNarrative Function
 * 
 * Displays the speech box (narrative text).
 */
function showNarrative() {
    $("#text-box").show();
    $("#narrative").show();
}

function hideNarrative(){
    $("#text-box").show();
    $("#narrative").show();
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
                let pri = JSON.stringify(animation)
                console.log(animation)
                mixer.clipAction(animation).play()
            })

            // Only place model if we are not in the initial app start.
            if (appStart == false) {
                let currObj = JSON.stringify(currentObject)
                //alert(currObj)
                scene.add(currentObject);

                // If a position parameter was passed, place at specified position.
                //alert("place")
                
                currentObject.position.set(0,0,0)
                //alert("test")
                let pri = JSON.stringify(currentObject.position)
                //alert(pri)
                currentObject.visible = true;
                // arPlace();
                
            }


            controls.update();
            
            render();
           // alert("after update")
        })

    })
}

/**
 * init Function
 * 
 * Initializes three.js objects necessary for rendering AR scene.
 */
function init() {
    
    // Create html element and add to modelViewArea
    modelViewArea = document.createElement('div');
    document.getElementById("model-view-area").appendChild(modelViewArea);

    // Hide speech bubble
    hideNarrative();

    // Initialize scene and camera.
    scene = new THREE.Scene();
    
    camera = new THREE.PerspectiveCamera(45, (window.innerWidth / window.innerHeight), 1, 1000);
    camera.position.set(1,2,-3);
    camera.lookAt(0,0,0);
    //alert("test")

    // Add lights to the scene
    utilities.addLightingTo(scene);

    // Initialize renderer.
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    //renderer.xr.enabled = true;
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
    controls.autoRotate=true;

    let options = {
        optionalFeatures: ['dom-overlay']
    }

    options.domOverlay = {root: document.getElementById('content')};
    const button = document.createElement( 'button' );
    button.id = 'non-ar-start-button';
    button.textContent = 'START NON-AR VERSION';
    document.body.appendChild(button);

    window.addEventListener('resize', onWindowResize);
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
 * animate Function
 */
function animate() {
    renderer.setAnimationLoop(render);
    //render();
    requestAnimationFrame(animate);
    //alert(check)
    controls.update();
}

/**
 * render Function
 * @param {*} timestamp 
 * @param {*} frame 
 */
function render(timestamp, frame) {

    if(mixer){
        let delta = clock.getDelta();
        mixer.update(delta)
    }

    renderer.render( scene, camera );

}
