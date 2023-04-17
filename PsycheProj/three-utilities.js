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

export default{
    setSpaceEnvironment
};