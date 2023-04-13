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

/**
 * This ModelViewArea class represents a 3D viewing area
 */
class ModelViewArea{
    scene;
    camera;
    renderer;
    mixer;

    constructor(){
        // Instantiate scene, camera, and renderer
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(70, (window.innerWidth / window.innerHeight), 0.001, 200);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

        // Setup camera - makes 3D model visible
        this.camera.position.z = 1.5;

        // Setup renderer
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = false;

        addLightingTo(this.scene);
    }
}

function init(){

    // Convert .glb files to ModelViewArea objects and fill modelViewAreas array
    let path = '/assets/models/';
    let format = '.glb';

    for (let i = 0; i < 5; i++) {
        let filePath = path + (i + 1) + format;
        modelViewAreas[i] = getModelViewAreaFrom(filePath);
    }

    // Setup Model View Area 1
    $('#model-1').append(modelViewAreas[0].renderer.domElement);
    //modelViewAreas[0].renderer.domElement = document.getElementById("model-1");
    

    // Model View Area 2


    // Model View Area 3



    // Model View Area 4



    // Model View Area 5


}

init();

/**
 * Adds lighting to the scene.
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

/**
 * Takes a .glb file and returns a ModelViewArea object
 * @param {*} glbFilePath - the filepath of the .glb file to get a ModelViewArea from
 * @returns ModelViewArea object based on .glb file
 */
function getModelViewAreaFrom(glbFilePath){

    const loader = new GLTFLoader();

    let modelViewArea = new ModelViewArea();

    // Get the scene from the glb file
    loader.load(glbFilePath, function(glb){

        textureAllMeshes(glb.scene);

        // Add the scene to the ModelViewArea object
        modelViewArea.scene.add(glb.scene);
    })

    return modelViewArea;
}

/**
 * Applies a texture to all Meshes in a scene.
 * @param {*} scene - scene for which a texture will be applied to all meshes
 */
function textureAllMeshes(scene){

    // Load texture file
    var textureLoader = new THREE.TextureLoader().setPath('assets/');
    var texture = textureLoader.load("pixel-rocks.png");
    texture.flipY = false;

    // Find the meshes in the scene and texture them
    scene.traverse ( ( o ) => {
        if ( o.isMesh ) {
            o.material.map = texture;
            o.material.bumpMap = texture;
            o.material.roughnessMap = texture;

            // Affects how intense the shading is based on the texture
            o.material.bumpScale = 0.1;
        }
    });
}

function render(){

    // Gets change in position for model and updates, allowing for animations.
    /*
    const delta = clock.getDelta();
    mixer.update(delta)
    */

    requestAnimationFrame(render);
    modelViewAreas[0].renderer.render( modelViewAreas[0].scene, modelViewAreas[0].camera );
}
render();

