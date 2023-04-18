$("#text-only-button").click(async function(){
    window.location.replace("text-version.html");
})

$("#download-xrviewer-button").click(async function(){
    window.location.href = 'https://apps.apple.com/us/app/webxr-viewer/id1295998056';
})

$('#copy-link-button').click(function() {
    // Copy current URL to clickboard
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);

    // Shows user that the text has been copied
    $('#copy-link-button').text("COPIED!");
    $('#copy-link-button').css('background-color', 'green');

    // Change text back
    setTimeout(function() {
        $('#copy-link-button').text('Click Here to Copy URL');
        $('#copy-link-button').css('background-color', 'var(--light-blue)');
    }, 1500);  
}); 