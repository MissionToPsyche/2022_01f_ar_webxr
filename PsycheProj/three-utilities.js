import * as THREE from 'three';
import {OrbitControls} from '../jsm/controls/OrbitControls.js';
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
 * Adds lighting to the scene.
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

export default{
    setSpaceEnvironment,
    addLightingTo,
};