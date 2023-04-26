class ARButton {

	static createButton( renderer, sessionInit = {} ) {

		const button = document.createElement( 'button' );

		function showStartAR( /*device*/ ) {

			let currentSession = null;

			function onSessionStarted( session ) {

				renderer.xr.setReferenceSpaceType( 'local' );
				renderer.xr.setSession( session );
				
				currentSession = session;
			}
			
			button.style.display = '';

			button.style.cursor = 'pointer';
			button.style.left = 'calc(50% - 50px)';
			button.style.width = '100px';

			button.textContent = 'START AR';

			button.onmouseenter = function () {
				button.style.opacity = '1.0';
			};

			button.onmouseleave = function () {
				button.style.opacity = '0.5';
			};

			// ARButton Click Event
			button.onclick = function () {

				if ( currentSession === null ) {

					navigator.xr.requestSession( 'immersive-ar', sessionInit )
						.then( onSessionStarted )
						.catch( error =>{
							console.log(error);
							
							showWebXRNotSupported()
						} );

				} else {
					currentSession.end();
				}

			};

		}

		// Shows page to handle hardware / software combinations that don't support WebXR
		function showWebXRNotSupported(){

			window.location.replace("webxr-not-supported.html");

		}


		function stylizeElement( element ) {

			element.style.position = 'absolute';
			element.style.bottom = '20px';
			element.style.padding = '12px 6px';
			element.style.border = '1px solid #fff';
			element.style.borderRadius = '4px';
			element.style.background = 'rgba(0,0,0,1)';
			element.style.color = '#fff';
			element.style.font = 'normal 13px sans-serif';
			element.style.textAlign = 'center';
			element.style.opacity = '1';
			element.style.outline = 'none';
			element.style.boxShadow = "2px 2px 4px rgba(0, 0, 0, 0.3)";
			element.style.zIndex = '999';

		}

		if ( 'xr' in navigator ) {

			button.id = 'ARButton';
			button.style.display = 'none';

			stylizeElement( button );

			const immersiveOK = navigator.xr.isSessionSupported("immersive-ar");

			if (immersiveOK) {
				showStartAR();

			} else {
				showWebXRNotSupported();
			}

			return button;

		} else {
            //alert("test")
			showWebXRNotSupported();
		}
	}
}

export { ARButton };