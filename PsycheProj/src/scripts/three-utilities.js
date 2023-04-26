import * as THREE from 'three';
import {OrbitControls} from '../scripts/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';

/**
 * setSpaceEnvironment Function
 * 
 * Creates a skybox and sets it as the background of the three.js scene object.
 * @param {*} scene - three.js scene object to set the background of
 * @param {*} path - the filepath that contains the images to make the skybox from
 *                   (images must be .png and must be named 'xpos', 'xneg', 'ypos', 'yneg', 'zpos', 'zneg')
 */
function setSpaceEnvironment(scene, path) {
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
 * addLightingTo function
 * 
 * Adds lighting to the three.js scene object.
 * @param {*} scene - The three.js scene object to add lighting to
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
 * textureAllMeshes Function
 * 
 * Applies a texture to all Meshes in a glb.scene.
 * @param {*} scene - glb scene for which a texture will be applied to all meshes
 */
function textureAllMeshes(scene){

    // Load texture file
    var textureLoader = new THREE.TextureLoader().setPath('../../assets/');
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

export default{
    setSpaceEnvironment,
    addLightingTo,
    textureAllMeshes,
};