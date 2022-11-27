import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import {OrbitControls } from '../jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/addons/loaders/RGBELoader.js';
import { LinearToneMapping } from 'three';

let container;
let camera, scene, renderer;
let reticle,pmremGenerator, current_object,controls;
let hitTestSource = null;
let hitTestSourceRequested = false;

init();
animate();

$(".state-change").click(function(){
    if(current_object!=null){
        scene.remove(current_object)
    }
    loadModel($(this).attr("id"));
});

$("#music-settings").click(function(){
    let myAudio = document.getElementById("music");
    myAudio.muted=!myAudio.muted;
})

$("#ARButton").click(function(){
    if(current_object){
        current_object.visible = false;
    }
    setSpaceEnvironment(scene);
    document.getElementById("intro-header").style.display='none';
    loadModel(1);
});

$("#place-button").click(function(){
    arPlace();
    document.getElementById("educ-content").style.display="block";
    document.getElementById("fact-one").style.display="block";
    document.getElementById("fact-two").style.display="block";
    document.getElementById("fact-three").style.display="block";
    const buts = document.querySelectorAll('.state-change');
    buts.forEach(but=>{
        but.style.display='inline';
    })
});

$("#fact-one").click(function(){
    document.getElementById("educ-content").innerHTML = "Sagittis purus sit amet volutpat consequat mauris nunc congue nisi. Gravida quis blandit turpis cursus. Egestas fringilla phasellus faucibus scelerisque eleifend. Aliquam ut porttitor leo a diam sollicitudin tempor. Sit amet cursus sit amet dictum sit amet justo."
})

$("#fact-two").click(function(){
    document.getElementById("educ-content").innerHTML = "Luctus accumsan tortor posuere ac ut. Sit amet aliquam id diam. Ultrices tincidunt arcu non sodales neque sodales ut etiam. Sit amet nisl suscipit adipiscing. Vel pharetra vel turpis nunc eget lorem dolor sed viverra. Iaculis urna id volutpat lacus."
})

$("#fact-three").click(function(){
    document.getElementById("educ-content").innerHTML = "Mauris cursus mattis molestie a iaculis at. Nulla facilisi nullam vehicula ipsum a arcu. Posuere morbi leo urna molestie at elementum eu. Egestas diam in arcu cursus euismod quis viverra nibh. Viverra nam libero justo laoreet sit amet cursus."
})

function arPlace(){
    if(reticle.visible){
        current_object.position.setFromMatrixPosition(reticle.matrix);
        current_object.visible = true;
    }
};

document.getElementById("menu-icon").onclick = function openNav() {
    document.getElementById("mySidenav").style.width = "250px";
}

document.getElementById("close-menu").onclick = function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
}

function loadModel(model){
    new RGBELoader()
    .setDataType(THREE.UnsignedByteType)
    .setPath('assets/')
    .load('photo_studio_01_1k.hdr',function(texture){
        var envmap = pmremGenerator.fromEquirectangular(texture).texture;

        scene.enviroment = envmap;
        texture.dispose();
        pmremGenerator.dispose();
        render();

        var loader = new GLTFLoader().setPath('assets/');
        loader.load(model+".glb",function(glb){
            current_object = glb.scene;
            scene.add(current_object);

            arPlace();

            var box = new THREE.Box3();
            box.setFromObject(current_object);
            box.center(controls.target);

            controls.update();
            render();
        })
    })
}

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

function rotateObject(){
    if(current_object && reticle.visible){
        current_object.rotation.y+= deltaX/100;
    }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

// Creates skybox and sets as background 
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

function animate() {

    renderer.setAnimationLoop( render );
    requestAnimationFrame(animate);
    controls.update();

}

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
