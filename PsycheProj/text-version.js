import * as THREE from 'three';
import {OrbitControls} from '../jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';

let camera, scene;
let mixer;
const modelViewAreas = [];

var geometry = new THREE.CubeGeometry(1,1,1);
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube = new THREE.Mesh( geometry, material );


class ModelViewArea{
    scene;
    camera;
    renderer;

    constructor(){
        // Instantiate scene, camera, and renderer
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, (window.innerWidth / window.innerHeight), 0.001, 200);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        // Setup renderer
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = false;

        addLightingTo(this.scene);
    }
}

function init(){
    console.log("init()");

    // Setup Model View Area 1
    const modelViewArea1 = new ModelViewArea();
    modelViewAreas[0] = modelViewArea1;
    $('#model-1').append(modelViewArea1.renderer.domElement);
    render(modelViewArea1);

    // Proof of concept - cube works in android but not iPhone
    modelViewArea1.scene.add( cube );
    modelViewArea1.camera.position.z = 5;

    // Model View Area 2


    // Model View Area 3



    // Model View Area 4



    // Model View Area 5


}

init();

/**
 * This function adds lighting to the scene.
 * 
 * @param {*} scene - The scene object to add lighting to
 */
function addLightingTo(scene){
    // Create light sources
    const directionalLight = new THREE.DirectionalLight(0x404040, 1);
    const hemisphereLight = new THREE.HemisphereLight(0xf6e86d, 0x404040, 1);
    const spotLight = new THREE.SpotLight(0xf6e86d, 1, 10, Math.PI/2);

    // Add lights to scene
    scene.add(hemisphereLight);
    scene.add(directionalLight);
    scene.add(spotLight);
}

function render(){

    // Gets change in position for model and updates, allowing for animations.
    /*
    const delta = clock.getDelta();
    mixer.update(delta)
    */

    cube.rotation.x += 0.001;
    cube.rotation.y += 0.001;

    requestAnimationFrame(render);
    modelViewAreas[0].renderer.render( modelViewAreas[0].scene, modelViewAreas[0].camera );
}
render();

