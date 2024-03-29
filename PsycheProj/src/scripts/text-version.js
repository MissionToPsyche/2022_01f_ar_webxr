import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import utilities from './three-utilities.js';

let modelViewAreas = [];
const clock = new THREE.Clock();

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
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            pixelRatio: window.devicePixelRatio
        });

        // Setup camera - makes 3D model visible
        this.camera.position.z = 1.5;
        this.camera.position.y = 0.5;
        this.camera.rotation.x = -.25;

        // Setup renderer
        this.renderer.setSize(window.innerWidth / 2, window.innerHeight / 2);
        this.renderer.xr.enabled = false;

        utilities.addLightingTo(this.scene);
    }
}

/**
 * Main logic of text-version
 */
function init(){

    // Convert .glb files to ModelViewArea objects and fill modelViewAreas array
    let path = '../../assets/models/';
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
                    }
                });
            }
            else{
                // ModelViewArea object is not observed, set isObserved = false
                modelViewAreas.forEach(mva => {
                    if(mva.elementID === entry.target.id){
                        mva.isObserved = false;
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
 * Takes a .glb file and returns a ModelViewArea object
 * @param {*} glbFilePath - the filepath of the .glb file to get a ModelViewArea from
 * @returns ModelViewArea object based on .glb file
 */
function getModelViewAreaFrom(glbFilePath){

    const loader = new GLTFLoader();

    let modelViewArea = new ModelViewArea();

    // Get scene and animations from the glb file
    loader.load(glbFilePath, function(glb){

        utilities.textureAllMeshes(glb.scene);
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
 *  Render loop that shows and updates models and animations
 */
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

