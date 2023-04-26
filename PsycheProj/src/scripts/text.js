// Narrative (const) text variables.
const introText = "Welcome to the 16-Psyche AR Experience!  Here you'll learn all about NASA's Psyche asteroid exploration mission!" +
    "  We'll teach you about the leading hypothesis of Psyche's creation as well as neat factoids about the mission.";

const greeting = "Hello explorer!  When you're ready, look around and click the blue Place button when the reticle is in the center of your screen.";

const greetingNonAR = "Hello explorer! When you're ready, click the blue Place button to view the first stage of the Psyche formation hypothesis."

const modelDescriptions = [
    // Model 1 Description
    "Stage 1: Formation of planetesimal",

    // State Change 1 Description - String Array indicates it will use multiple speech boxes.
    ["As small particles of things such as ice and dust combine, they form larger particles. Eventually these particles combine through different",
    "processes to form an object large enough to be classified as a planetesimal."],

    // Model 2 Description - String Array indicates it will use multiple speech boxes.
    "Stage 2: Planetesimal",

    // State Change 2 Description
    ["Objects are colliding with the planetesimal. These collisions cause the surface layer of the planetesimal to become worn away. After many ",
    "of these collisions, the surface no longer remains intact and the core of the planetesimal is exposed. Though there may possibly be some ",
    "remnants of the surface layer and other material remaining, what is left after these collisions is mainly core material of the planetesimal."],

    // Model 3 Description
    "Stage 3: Core/Current asteroid"
];

const facts = [
    // Model 1 Educational Information
    [
        // Model 1 - Asteroid Button - String Array indicates it will use multiple speech boxes.
        ["Planetesimals are one of the building blocks of planets. The hypothesis that Psyche could potentially be leftover core material from a",
        "planetesimal could lead scientists to be able to investigate questions about Earth's core, including how it was formed."],

        // Model 1 - Question Button
        "How might Psyche have formed?",

        // Model 1 - Spacecraft Button - String Array indicates it will use multiple speech boxes.
        ["The spacecraft is equipped with two Multispectral Imagers. These high resolution cameras will capture images of the asteroid's surface at",
        "different wavelengths of light. This, along with pictures of the topography of Psyche, will allow scientists to study features that provide",
        "clues to Psyche's history."]
    ],

    // Model 2 Educational Information
    [
        // Model 2 - Asteroid Button - String Array indicates it will use multiple speech boxes.
        ["Scientists think Psyche may consist largely of metal from the core of a planetesimal, one of the building blocks of the rocky planets in our",
        "solar system (Mercury, Venus, Earth and Mars). Psyche is most likely a survivor of multiple violent hit-and-run collisions with other material,",
        "common when the solar system was forming."],

        // Model 2 - Question Button
        "How will it be determined if Psyche is core material of a planetesimal?",
        
        // Model 2 - Spacecraft Button - String Array indicates it will use multiple speech boxes.
        ["All of the instruments on the spacecraft will provide clues but, in particular, the magnetometer will look for evidence of an ancient",
        "magnetic field: if Psyche has a significant magnetic field still in its solid body, it was once a core that produced its own dynamo."]
    ],

    // Model 3 Educational Information
    [
        // Model 3 - Asteroid Button - String Array indicates it will use multiple speech boxes.
        ["After numerous collisions, it is hypothesized that the potential planetesimal would have its rocky mantle stripped away and leave behind the",
        "core material. This core material could potentially be what makes up the current asteroid Psyche."],

        // Model 3 - Question Button
        "What is it that planetary cores are made of?",

        // Model 3 - Spacecraft Button - String Array indicates it will use multiple speech boxes.
        ["The spacecraft contains a Gamma Ray and Neutron Spectrometer that will detect, measure, and map Psyche's elemental composition.  These measurements",
        "will be able to give scientists a better idea of what exactly it is that potentially makes up the inner cores of planets."]
    ]
];

export default { greeting, greetingNonAR, modelDescriptions, facts };