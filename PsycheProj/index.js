import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import {OrbitControls } from '../jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import { LinearToneMapping } from 'three';


// General variables.
let container;
let camera, scene, renderer;
let reticle,pmremGenerator, current_object, controls;
let hitTestSource = null;
let hitTestSourceRequested = false;
let currentModelState = null;

// Narrative text variables.
let model1Text = "<Explain State 1 - It's (assumed) appearance 10 million years ago.>";
let model2Text = "<Explain State 2 - It's (assumed) appearance 5 million years ago.>";
let model3Text = "<Explain State 3 - It's (assumed) appearance today.>";
let model1_Fact1 = "<Model 1 - Fact 1>";
let model1_Fact2 = "<Model 1 - Fact 2>";
let model1_Fact3 = "<Model 1 - Fact 3>";
let model2_Fact1 = "<Model 2 - Fact 1>";
let model2_Fact2 = "<Model 2 - Fact 2>";
let model2_Fact3 = "<Model 2 - Fact 3>";
let model3_Fact1 = "<Model 3 - Fact 1>";
let model3_Fact2 = "<Model 3 - Fact 2>";
let model3_Fact3 = "<Model 3 - Fact 3>";

init();
animate();

/**
 * Music settings button click.
 * 
 * Mutes/Unmutes the ambient music.
 */
$("#music-settings").click(function(){
    let myAudio = document.getElementById("music");
    myAudio.muted=!myAudio.muted;
})

/**
 * Start AR button click.
 * 
 * Initializes the AR experience.
 */
$("#ARButton").click(function(){
    if(current_object){
        current_object.visible = false;
    }
    setSpaceEnvironment(scene);
    loadSatellite();
    loadModel(1);
    document.getElementById("narrative").style.display="block";
});

/**
 * Place button click.
 * 
 * Displays the Fact buttons, State Change button, and changes narrative text.
 */
$("#place-button").click(function(){
    arPlace();
    document.getElementById("fact-one").style.display = "block";
    document.getElementById("fact-two").style.display = "block";
    document.getElementById("fact-three").style.display = "block";
    document.getElementById("state-change").style.display = "block";

    // Initiate with model 1
    document.getElementById("narrative").textContent = model1Text;
    currentModelState = 1;
});

/**
 * Fact 1 button click.
 */
$("#fact-one").click(function(){
    // Display proper narrative based on currentModelState variable
    switch(currentModelState) {
        case 1:
            document.getElementById("narrative").textContent = model1_Fact1;
            break;
        case 2:
            document.getElementById("narrative").textContent = model2_Fact1;
            break;
        case 3:
            document.getElementById("narrative").textContent = model3_Fact1;
            break;
        default:
            // Something went wrong with value of currentModelState variable
            break;
    }
})

/**
 * Fact 2 button click.
 */
$("#fact-two").click(function(){
    // Display proper narrative based on currentModelState variable
    switch(currentModelState) {
        case 1:
            document.getElementById("narrative").textContent = model1_Fact2;
            break;
        case 2:
            document.getElementById("narrative").textContent = model2_Fact2;
            break;
        case 3:
            document.getElementById("narrative").textContent = model3_Fact2;
            break;
        default:
            // Something went wrong with value of currentModelState variable
            break;
    }
})

/**
 * Fact 3 button click.
 */
$("#fact-three").click(function(){
    // Display proper narrative based on currentModelState variable
    switch(currentModelState) {
        case 1:
            document.getElementById("narrative").textContent = model1_Fact3;
            break;
        case 2:
            document.getElementById("narrative").textContent = model2_Fact3;
            break;
        case 3:
            document.getElementById("narrative").textContent = model3_Fact3;
            break;
        default:
            // Something went wrong with value of currentModelState variable
            break;
    }
})

/**
 * State Change button click.
 * 
 * Async function needed for use of sleep timer - this may not be needed once real animations are implemented.
 */
$("#state-change").click(async function(){
    if(currentModelState == 3){
        currentModelState = 1;
    }
    else{
        currentModelState++;
    }

    // Remove fact buttons during state-change animation.
    document.getElementById("fact-one").style.display = "none"
    document.getElementById("fact-two").style.display = "none";
    document.getElementById("fact-three").style.display = "none";

    // We will invoke the state change animation here
    document.getElementById("narrative").textContent = "3 second place holder for state change animation.";
    scene.remove(current_object);
    await sleep(3000);
    loadModel(currentModelState);

    document.getElementById("narrative").style.display = "block";
    // Display proper narrative based on currentModelState variable
    switch(currentModelState) {
        case 1:
            document.getElementById("narrative").textContent = model1Text;
            break;
        case 2:
            document.getElementById("narrative").textContent = model2Text;
            break;
        case 3:
            document.getElementById("narrative").textContent = model3Text;
            break;
        default:
            // Something went wrong with value of currentModelState variable
            break;
    }

    // Display fact buttons after state-change animation completes.
    document.getElementById("fact-one").style.display = "block";
    document.getElementById("fact-two").style.display = "block";
    document.getElementById("fact-three").style.display = "block";
})

/**
 * arPlace Function
 * 
 * Places the Psyche asteroid model on the screen at the reticle location.
 */
function arPlace(){
    if(reticle.visible){
        current_object.position.setFromMatrixPosition(reticle.matrix);
        current_object.visible = true;
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
 * loadSatellite Function
 * 
 * Loads the satellite guide onto the screen.
 */
function loadSatellite(){
    document.getElementById("satellite").width = "60";
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
 * @param {number} model - Number (1-3) representing which model to load.
 */
function loadModel(model){
    new RGBELoader()
    .setDataType(THREE.UnsignedByteType)
    .setPath('assets/')
    .load('photo_studio_01_1k.hdr',function(texture){

        //create environment property of scene, involves lighting of object. 
        //https://threejs.org/docs/#api/en/scenes/Scene
        var envmap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.enviroment = envmap;
        texture.dispose();
        pmremGenerator.dispose();
        render();

        //load glb file and add it to scene
        var loader = new GLTFLoader().setPath('assets/');
        loader.load(model+".glb",function(glb){
            current_object = glb.scene;
            scene.add(current_object);

            arPlace();

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
    container = document.createElement( 'div' );
    document.getElementById("container").appendChild( container );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.001, 200 );

    const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
    light.position.set( 0.5, 1, 0.25 );
    scene.add( light );

    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.xr.enabled = true;
    container.appendChild( renderer.domElement );

    pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader()

    controls = new OrbitControls(camera,renderer.domElement);
    controls.addEventListener('change',render);
    controls.minDistance=2;
    controls.maxDistance=10;
    controls.target.set(0,0,-0.2);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    let options = {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
    }

    options.domOverlay = {root: document.getElementById('content')};

    document.body.appendChild(ARButton.createButton(renderer,options));

    reticle = new THREE.Mesh(
        new THREE.RingGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
        new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add( reticle );


    window.addEventListener( 'resize', onWindowResize );

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

    },false)

    
}

let touchDown, touchX, touchY, deltaX, deltaY;

/**
 * rotateObject Function
 */
function rotateObject(){
    if(current_object && reticle.visible){
        current_object.rotation.y+= deltaX/100;
    }
}

/**
 * onWindowResize Function
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

/**
 * setSpaceEnvironment Function
 * 
 * Creates skybox and sets as the space environment scene background.
 * @param {*} scene - three.js Scene object.  Defined in loadModel Function.
 */
function setSpaceEnvironment(scene){
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
    renderer.setAnimationLoop( render );
    requestAnimationFrame(animate);
    controls.update();
}

/**
 * render Function
 * @param {*} timestamp 
 * @param {*} frame 
 */
function render( timestamp, frame ) {
    if ( frame ) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if ( hitTestSourceRequested === false ) {
            session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {

                session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {

                    hitTestSource = source;

                } );

            } );

            session.addEventListener( 'end', function () {
                hitTestSourceRequested = false;
                hitTestSource = null;

                reticle.visible = false;

                var box = new THREE.Box3();
                box.setFromObject(current_object);
                box.center(controls.target);

                document.getElementById("place-button").style.display="none";
            } );

            hitTestSourceRequested = true;
        }

        if ( hitTestSource ) {
            const hitTestResults = frame.getHitTestResults( hitTestSource );

            if ( hitTestResults.length ) {
                const hit = hitTestResults[ 0 ];

                document.getElementById("place-button").style.display="block";

                reticle.visible = true;
                reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );
            } else {
                reticle.visible = false;
                document.getElementById("place-button").style.display="none";
            }
        }
    }

    renderer.render( scene, camera );
}
