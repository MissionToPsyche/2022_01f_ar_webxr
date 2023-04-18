let menuDisp = false;

/**
 * Open menu click.
 */
$("#menu-button").click(function toggleMenu() {

    if(menuDisp){
        $("#menu").css({"opacity":"0","pointer-events": "none"});
        menuDisp = !menuDisp;
    }
    else{
        $("#menu").css({"opacity":"1","pointer-events": "auto"});
        menuDisp = !menuDisp;
    }
    
});

/**
 * Music settings button click.
 * 
 * Mutes/Unmutes the ambient music.
 */
$("#music-settings").click(function() {
        let myAudio = document.getElementById("music");
        myAudio.muted=!myAudio.muted;
})

/**
 * This code makes the menu disappear when the user clicks outside of the menu
 */
$(document).mouseup(function(e){
    let menu = $('#menu');
    let menuButton = $('#menu-button')
    if (!menu.is(e.target) 
    && menu.has(e.target).length === 0)
    {
        if(menuDisp){
            $("#menu").css({"opacity":"0"});
            if(!menuButton.is(e.target)){
                menuDisp = !menuDisp;
            }
        }

    }
});