import * as THREE from 'three';
import {OrbitControls} from '../jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';

let camera, scene;
let mixer;
let modelViewAreas = [];
const clock = new THREE.Clock();

var geometry = new THREE.CubeGeometry(1,1,1);
var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
var cube = new THREE.Mesh( geometry, material );

/**
 * This ModelViewArea class represents a 3D viewing area
 */
class ModelViewArea{
    glb;
    scene;
    camera;
    renderer;
    animations = [];
    mixer;
    elementID;
    isObserved = false;

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

/**
 * Main logic of text-version
 */
function init(){

    // Convert .glb files to ModelViewArea objects and fill modelViewAreas array
    let path = '/assets/models/';
    let format = '.glb';
    let filePath, modelNumber;

    for (let i = 0; i < 5; i++) {

        modelNumber = i + 1;
        filePath = path + modelNumber + format;
        
        modelViewAreas[i] = getModelViewAreaFrom(filePath);

        // Creates a <canvas> inside of the div with the elementID = model-(i-1)
        $("#model-" + modelNumber).append(modelViewAreas[i].renderer.domElement);

        // Save the elementID for later
        modelViewAreas[i].elementID = "model-" + modelNumber;
    }

    
    
    // Maybe this code could be more efficient??

    // Creates a system of observers that set the isObserved Boolean 
    // depending on if the ModelViewArea is in view or not.
    const observer = new IntersectionObserver( entries => {
        entries.forEach(entry => {
            if(entry.isIntersecting){
                // ModelViewArea object is observed, set isObserved = true
                modelViewAreas.forEach(mva => {
                    if(mva.elementID === entry.target.id){
                        mva.isObserved = true;
                        console.log("visible", entry.target.id, mva);
                    }
                });
            }
            else{
                // ModelViewArea object is not observed, set isObserved = false
                modelViewAreas.forEach(mva => {
                    if(mva.elementID === entry.target.id){
                        mva.isObserved = false;
                        console.log("not visible", mva);
                    }
                });
            }
        })
    })

    const divsToWatch = document.querySelectorAll('.model-view-area');
    divsToWatch.forEach(div => {
        observer.observe(div);
    })
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

    // Get scene and animations from the glb file
    loader.load(glbFilePath, function(glb){

        
        textureAllMeshes(glb.scene);
        //modelViewArea.glb = glb;
        modelViewArea.mixer = new THREE.AnimationMixer(glb.scene);

        // Start Animations
        glb.animations.forEach(animation =>{
            modelViewArea.mixer.clipAction(animation).play();
        });

        modelViewArea.animations = glb.animations;

        modelViewArea.scene.add(glb.scene);  
    });

    return modelViewArea;
}

/**
 * Applies a texture to all Meshes in a glb.scene.
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

    if(modelViewAreas.length == 0){
        return;
    }

    requestAnimationFrame(render);

    modelViewAreas.forEach( mva =>{

        // Only render if the ModelViewArea object is being observed
        if(mva.isObserved){

            mva.renderer.setAnimationLoop(render);

            // Render first!
            mva.renderer.render( mva.scene, mva.camera );
        
            // Then animate.
            const delta = clock.getDelta();
            mva.mixer.update(delta);

        }
    })
}
render();

