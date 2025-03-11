/**
 * Main application script - Custom controls for Indie City
 */

// Initialize Meshopt decoder before any model loading


// Global variables
let scene; // Declare scene globally




function initMeshoptDecoder() {
    return new Promise((resolve) => {
        // Import the decoder
        THREE.GLTFLoader.prototype.setMeshoptDecoder = function(decoder) {
            this.meshoptDecoder = decoder;
        };

        // Load the Meshopt decoder
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/meshoptimizer@0.18.1/meshopt_decoder.js';
        script.onload = function() {
            // Initialize the decoder
            THREE.GLTFLoader.prototype.setMeshoptDecoder(MeshoptDecoder);
            console.log("Meshopt decoder initialized");
            resolve();
        };
        document.head.appendChild(script);
    });
}


// Global variables for character movement
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let rotateLeft = false;
let rotateRight = false;
let character; // Make character global
let camera; // Make camera global
let pinchStartDistance = 0;

// Global variable to track camera distance
let cameraDistance = 10; // Default distance

// Global loader setup
const Loaders = (function() {
    // Initialize the GLTFLoader with Meshopt
    function createGLTFLoader() {
        const gltfLoader = new THREE.GLTFLoader();
        
        // Set up Meshopt decoder
        if (typeof MeshoptDecoder !== 'undefined') {
            gltfLoader.setMeshoptDecoder(MeshoptDecoder);
            console.log("Meshopt decoder set in GLTFLoader");
        } else {
            console.warn("MeshoptDecoder not available");
        }
        
        return gltfLoader;
    }
    
    // Create a singleton instance
    const gltfLoader = createGLTFLoader();
    
    return {
        getGLTFLoader: function() {
            return gltfLoader;
        }
    };
})();

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the Meshopt decoder first
    initMeshoptDecoder().then(() => {
        // DOM elements
        const welcomePanel = document.getElementById('welcome-panel');
        const startBtn = document.getElementById('start-btn');
        const loadCityBtn = document.getElementById('load-city-btn');
        
        // Set up event listeners for the welcome screen buttons
        if (startBtn) {
            startBtn.addEventListener('click', function() {
                welcomePanel.style.display = 'none';
                initCityScene();
            });
        }
        
        if (loadCityBtn) {
            loadCityBtn.addEventListener('click', function() {
                welcomePanel.style.display = 'none';
                initCityScene();
            });
        }
    });
});

// Initialize the city scene
function initCityScene() {
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // Initialize the city
    City.initCity(scene);
    
    // Add buildings
    City.addBuildings(scene, STARTUP_DATA.startups);
    
    // Create a simple character using Three.js geometries
    character = createCharacter();
    scene.add(character);
    
    // Set up third-person camera
    camera.position.set(0, 3, 10); // Adjust height and distance as needed
    
    // Update camera position after character is added
    updateCameraPosition();
    
    // Check for URL parameters to position the character
    const urlPosition = parseUrlParams();
    if (urlPosition) {
        positionCharacterAt(urlPosition);
    }
    
    // Character movement variables
    const characterSpeed = 0.2;
    const rotationSpeed = 0.1;
    
    // Reset movement flags
    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;
    rotateLeft = false;
    rotateRight = false;
    
    // Show controls panel
    const controlsPanel = document.getElementById('controls-panel');
    if (controlsPanel) {
        controlsPanel.style.display = 'block';
        controlsPanel.classList.remove('hidden');
        
        // Position in top right
        controlsPanel.style.top = '10px';
        controlsPanel.style.right = '10px';
        controlsPanel.style.left = 'auto';
        controlsPanel.style.transform = 'none';
        
        // Update controls text based on device
        const controlsText = controlsPanel.querySelectorAll('p');
        if (isMobileDevice()) {
            if (controlsText.length >= 3) {
                controlsText[0].textContent = 'Arrow Buttons - Move';
                controlsText[1].textContent = 'Rotation Buttons - Turn';
                controlsText[2].textContent = 'Pinch - Zoom In/Out';
            }
        } else {
            if (controlsText.length >= 3) {
                controlsText[0].textContent = 'WASD (Arrow Keys) - Move Character';
                controlsText[1].textContent = 'Q/E - Rotate Character';
                controlsText[2].textContent = 'Mouse Wheel (Z/X keys) - Zoom In/Out'
            }
        }
    }
    
    // Setup sharing functionality
    setupSharing();
    
    // Add keyboard controls
    document.addEventListener('keydown', function(event) {
        switch (event.key) {
            case 'w': case 'W': case 'ArrowUp':
                moveForward = true;
                break;
            case 's': case 'S': case 'ArrowDown':
                moveBackward = true;
                break;
            case 'a': case 'A': case 'ArrowLeft':
                moveLeft = true;
                break;
            case 'd': case 'D': case 'ArrowRight':
                moveRight = true;
                break;
            case 'q': case 'Q':
                rotateLeft = true;
                break;
            case 'e': case 'E':
                rotateRight = true;
                break;
            case 'z': case 'Z': // Zoom in
                zoomCamera(1); // Adjust zoom factor as needed
                break;
            case 'x': case 'X': // Zoom out
                zoomCamera(-1); // Adjust zoom factor as needed
                break;
        }
    });
    
    document.addEventListener('keyup', function(event) {
        switch (event.key) {
            case 'w': case 'W': case 'ArrowUp':
                moveForward = false;
                break;
            case 's': case 'S': case 'ArrowDown':
                moveBackward = false;
                break;
            case 'a': case 'A': case 'ArrowLeft':
                moveLeft = false;
                break;
            case 'd': case 'D': case 'ArrowRight':
                moveRight = false;
                break;
            case 'q': case 'Q':
                rotateLeft = false;
                break;
            case 'e': case 'E':
                rotateRight = false;
                break;
        }
    });
    
    // Add wheel event for zooming
    document.addEventListener('wheel', function(e) {
        e.preventDefault();
        
        // Update the camera distance based on wheel movement
        const zoomSpeed = 0.1;
        cameraDistance += e.deltaY * zoomSpeed * 0.01;
        
        // Limit zoom
        if (cameraDistance < 5) cameraDistance = 5;
        if (cameraDistance > 20) cameraDistance = 20;
        
        // Update camera position immediately
        updateCameraPosition();
    }, { passive: false });
    
    // Add click handler for building labels
    window.addEventListener('click', function(event) {
        // Create a new raycaster for each click
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        // Calculate mouse position in normalized device coordinates
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Update the raycaster
        raycaster.setFromCamera(mouse, camera);
        
        // Get all objects intersecting the ray
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        // Check for intersections
        if (intersects.length > 0) {
            const object = intersects[0].object;
            if (object.userData && object.userData.url) {
                window.open(object.userData.url, '_blank');
            }
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Animation function
    function animate() {
        requestAnimationFrame(animate);
        
        // Update character position based on keyboard input
        if (moveForward) {
            character.translateZ(-characterSpeed);
        }
        if (moveBackward) {
            character.translateZ(characterSpeed);
        }
        if (moveLeft) {
            character.translateX(-characterSpeed);
        }
        if (moveRight) {
            character.translateX(characterSpeed);
        }
        
        // Apply rotation with debugging
        if (rotateLeft) {
            character.rotation.y += rotationSpeed; // Rotate left
        }
        if (rotateRight) {
            character.rotation.y -= rotationSpeed; // Rotate right
        }
        
        // Update camera position to follow character
        updateCameraPosition();
        
        renderer.render(scene, camera);
    }
    
    // Add mobile controls
    addMobileControls();
    
    // Start animation
    animate();
    
    character.visible = false; // Hide the character model
}

// Add touch controls for mobile devices
function addMobileControls() {
    // Create a container for mobile controls
    const mobileControls = document.createElement('div');
    mobileControls.id = 'mobile-controls';
    mobileControls.style.position = 'absolute';
    mobileControls.style.bottom = '20px';
    mobileControls.style.left = '50%';
    mobileControls.style.transform = 'translateX(-50%)';
    mobileControls.style.display = 'flex';
    mobileControls.style.flexDirection = 'column';
    mobileControls.style.alignItems = 'center';
    mobileControls.style.zIndex = '1000';
    
    // Create movement controls (top row)
    const movementRow = document.createElement('div');
    movementRow.style.display = 'flex';
    movementRow.style.marginBottom = '10px';
    
    // Forward button
    const forwardBtn = createMobileButton('↑');
    forwardBtn.addEventListener('touchstart', () => { moveForward = true; });
    forwardBtn.addEventListener('touchend', () => { moveForward = false; });
    
    // Movement row layout
    const leftBtn = createMobileButton('←');
    leftBtn.addEventListener('touchstart', () => { moveLeft = true; });
    leftBtn.addEventListener('touchend', () => { moveLeft = false; });
    
    const backBtn = createMobileButton('↓');
    backBtn.addEventListener('touchstart', () => { moveBackward = true; });
    backBtn.addEventListener('touchend', () => { moveBackward = false; });
    
    const rightBtn = createMobileButton('→');
    rightBtn.addEventListener('touchstart', () => { moveRight = true; });
    rightBtn.addEventListener('touchend', () => { moveRight = false; });
    
    movementRow.appendChild(leftBtn);
    movementRow.appendChild(document.createElement('div')).appendChild(forwardBtn);
    movementRow.appendChild(document.createElement('div')).appendChild(backBtn);
    movementRow.appendChild(rightBtn);
    
    // Create rotation controls (bottom row)
    const rotationRow = document.createElement('div');
    rotationRow.style.display = 'flex';
    
    // Rotate left button
    const rotateLeftBtn = createMobileButton('↺');
    rotateLeftBtn.addEventListener('touchstart', () => { rotateLeft = true; });
    rotateLeftBtn.addEventListener('touchend', () => { rotateLeft = false; });
    
    // Rotate right button
    const rotateRightBtn = createMobileButton('↻');
    rotateRightBtn.addEventListener('touchstart', () => { rotateRight = true; });
    rotateRightBtn.addEventListener('touchend', () => { rotateRight = false; });
    
    rotationRow.appendChild(rotateLeftBtn);
    rotationRow.appendChild(rotateRightBtn);
    
    // Add rows to container
    mobileControls.appendChild(movementRow);
    mobileControls.appendChild(rotationRow);
    
    // Add to document
    document.body.appendChild(mobileControls);
    
    // Only show on mobile devices
    if (!isMobileDevice()) {
        mobileControls.style.display = 'none';
    }
}

// Helper function to create a mobile control button
function createMobileButton(text) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.width = '60px';
    button.style.height = '60px';
    button.style.margin = '5px';
    button.style.fontSize = '24px';
    button.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
    button.style.border = '2px solid #333';
    button.style.borderRadius = '50%';
    button.style.display = 'flex';
    button.style.justifyContent = 'center';
    button.style.alignItems = 'center';
    button.style.cursor = 'pointer';
    button.style.userSelect = 'none';
    button.style.touchAction = 'manipulation'; // Prevent double-tap zoom
    
    return button;
}

// Detect if user is on a mobile device
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.innerWidth <= 800);
}

// Add pinch-to-zoom for mobile
document.addEventListener('touchstart', function(e) {
    if (e.touches.length === 2) {
        pinchStartDistance = getPinchDistance(e);
    }
}, { passive: false });

document.addEventListener('touchmove', function(e) {
    if (e.touches.length === 2) {
        e.preventDefault();
        
        const currentDistance = getPinchDistance(e);
        const pinchDelta = currentDistance - pinchStartDistance;
        
        // Adjust camera distance from character
        const zoomSpeed = 0.02;
        const cameraOffset = camera.position.clone().sub(character.position);
        const distance = cameraOffset.length();
        
        // Calculate new distance
        let newDistance = distance - pinchDelta * zoomSpeed;
        
        // Limit zoom
        if (newDistance < 5) newDistance = 5;
        if (newDistance > 20) newDistance = 20;
        
        // Apply new distance
        cameraOffset.normalize().multiplyScalar(newDistance);
        camera.position.copy(character.position).add(cameraOffset);
        
        // Update camera lookAt
        camera.lookAt(character.position);
        
        pinchStartDistance = currentDistance;
    }
}, { passive: false });

// Helper function to calculate distance between two touch points
function getPinchDistance(e) {
    return Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
    );
}

// Add sharing functionality
function setupSharing() {
    const shareBtn = document.getElementById('share-btn');
    const sharePanel = document.getElementById('share-panel');
    const shareUrl = document.getElementById('share-url');
    const copyUrlBtn = document.getElementById('copy-url-btn');
    const closeShareBtn = document.getElementById('close-share-btn');
    
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            // Generate a shareable URL
            const url = generateShareableUrl();
            
            // Display the URL in the share panel
            if (shareUrl) {
                shareUrl.value = url;
            }
            
            // Show the share panel
            if (sharePanel) {
                sharePanel.style.display = 'block';
            }
        });
    }
    
    if (copyUrlBtn) {
        copyUrlBtn.addEventListener('click', function() {
            // Copy the URL to clipboard
            shareUrl.select();
            document.execCommand('copy');
            
            // Change button text temporarily
            const originalText = copyUrlBtn.textContent;
            copyUrlBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyUrlBtn.textContent = originalText;
            }, 2000);
        });
    }
    
    if (closeShareBtn) {
        closeShareBtn.addEventListener('click', function() {
            // Hide the share panel
            if (sharePanel) {
                sharePanel.style.display = 'none';
            }
        });
    }
}

// Generate a shareable URL based on the current state
function generateShareableUrl() {
    // Get the base URL
    const baseUrl = window.location.href.split('?')[0];
    
    // Create a URL with the current character position
    let url = new URL(baseUrl);
    
    if (character) {
        // Add character position parameters
        url.searchParams.append('x', character.position.x.toFixed(2));
        url.searchParams.append('y', character.position.y.toFixed(2));
        url.searchParams.append('z', character.position.z.toFixed(2));
        url.searchParams.append('r', character.rotation.y.toFixed(2));
    }
    
    return url.toString();
}

// Parse URL parameters to load a specific view
function parseUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    console.log("URL params:", Object.fromEntries(urlParams));
    
    // Check for hash-based owner parameter (e.g., #leonagano)
    const hashValue = window.location.hash.substring(1); // Remove the # character
    if (hashValue && hashValue.length > 0) {
        console.log("Found owner in hash:", hashValue);
        const position = City.getOwnerPosition(hashValue);
        console.log("Owner position from hash:", position);
        if (position) {
            return {
                x: position.x,
                y: 1,
                z: position.z,
                rotation: position.rotation || 0,
                lookAt: true
            };
        }
    }
    
    // Check if there's an owner parameter
    if (urlParams.has('owner')) {
        const ownerName = urlParams.get('owner');
        console.log("Found owner in query params:", ownerName);
        const position = City.getOwnerPosition(ownerName);
        console.log("Owner position:", position);
        if (position) {
            return {
                x: position.x,
                y: 1,
                z: position.z,
                rotation: position.rotation || 0,
                lookAt: true
            };
        }
    }
    
    // Check if there's an owner in the URL path (e.g., /leonagano)
    const pathParts = window.location.pathname.split('/');
    const ownerName = pathParts[pathParts.length - 1]; // Get the last part of the path
    
    if (ownerName && ownerName.length > 0 && ownerName !== 'index.html') {
        // Find startups by this owner
        const ownerStartups = STARTUP_DATA.startups.filter(s => 
            s.owner && s.owner.toLowerCase() === ownerName.toLowerCase());
        
        if (ownerStartups.length > 0) {
            // Find the position of this owner's first startup in the city
            const position = City.getOwnerPosition(ownerName);
            if (position) {
                return {
                    x: position.x,
                    y: 1,
                    z: position.z,
                    rotation: position.rotation || 0,
                    lookAt: true
                };
            }
        }
    }
    
    // Check if there are position parameters
    if (urlParams.has('x') && urlParams.has('z')) {
        // Store the parameters to use after scene initialization
        return {
            x: parseFloat(urlParams.get('x')),
            y: parseFloat(urlParams.get('y') || '1'),
            z: parseFloat(urlParams.get('z')),
            rotation: parseFloat(urlParams.get('r') || '0')
        };
    }
    
    // Check if there's a startup name parameter
    if (urlParams.has('startup')) {
        const startupName = urlParams.get('startup');
        // Find the startup in the data
        const startup = STARTUP_DATA.startups.find(s => 
            s.name.toLowerCase() === startupName.toLowerCase());
        
        if (startup) {
            // Find the position of this startup in the city
            const position = City.getStartupPosition(startup.name);
            if (position) {
                return {
                    x: position.x,
                    y: 1,
                    z: position.z,
                    rotation: position.rotation || 0,
                    lookAt: true
                };
            }
        }
    }
    
    return null;
}

// Position character at specific coordinates
function positionCharacterAt(position) {
    if (!character || !position) return;
    
    // Set character position
    character.position.set(position.x, position.y, position.z);
    
    // Set character rotation if specified
    if (position.rotation !== undefined) {
        character.rotation.y = position.rotation;
    }
    
    // Update camera to follow character
    const cameraOffset = new THREE.Vector3(0, 5, 10);
    cameraOffset.applyQuaternion(character.quaternion);
    camera.position.copy(character.position).add(cameraOffset);
    
    // Look at a specific point if requested
    if (position.lookAt) {
        camera.lookAt(position.x, position.y, position.z);
    } else {
        camera.lookAt(character.position);
    }
}

// Function to update camera position for first-person view
function updateCameraPosition() {
    if (!character) return; // Ensure character is defined
    const eyeHeight = 0.7; // Height of the character's eyes
    
    // Create a direction vector pointing forward from the character
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(character.quaternion);
    
    // Position camera at eye level
    const cameraOffset = new THREE.Vector3(0, eyeHeight, 0);
    camera.position.copy(character.position).add(cameraOffset);
    
    // Look in the direction the character is facing
    camera.lookAt(camera.position.clone().add(direction));
}

// Function to zoom the camera
function zoomCamera(direction) {
    console.log("Zooming:", direction);
    
    // Update the camera distance
    const zoomSpeed = 1;
    cameraDistance += direction * -zoomSpeed; // Negative because smaller Z = closer
    
    // Limit zoom
    if (cameraDistance < 3) cameraDistance = 3; // Minimum distance
    if (cameraDistance > 20) cameraDistance = 20; // Maximum distance
    
    console.log("New camera distance:", cameraDistance);
    
    // Update camera position immediately
    updateCameraPosition(); // Ensure camera position is updated after zoom
}

// Create a simple character using Three.js geometries
function createCharacter() {
    const characterGroup = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 32);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0x3498db });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.75; // Position the body above the ground
    characterGroup.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.4, 32, 32);
    const headMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc99 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.5; // Position the head above the body
    characterGroup.add(head);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 32);
    const armMaterial = new THREE.MeshBasicMaterial({ color: 0x3498db });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 0.75, 0); // Position left arm
    leftArm.rotation.z = Math.PI / 4; // Rotate to the side
    characterGroup.add(leftArm);
    
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 0.75, 0); // Position right arm
    rightArm.rotation.z = -Math.PI / 4; // Rotate to the side
    characterGroup.add(rightArm);

    // Legs
    const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 32);
    const legMaterial = new THREE.MeshBasicMaterial({ color: 0x3498db });
    
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.2, 0, 0); // Position left leg
    characterGroup.add(leftLeg);
    
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.2, 0, 0); // Position right leg
    characterGroup.add(rightLeg);

    // Set the character's position
    characterGroup.position.set(0, 1, 0); // Position at ground level

    return characterGroup;
}

// Add this at the beginning of your initCityScene function
function patchGLTFLoader() {
    // Override the loadBufferView method to skip Meshopt compression check
    THREE.GLTFLoader.prototype.parse = function() {
        const originalParse = THREE.GLTFLoader.prototype.parse;
        return function(data, path, onLoad, onError) {
            // Check if data contains Meshopt compression
            if (data && typeof data === 'object' && data.json) {
                const json = JSON.parse(data.json);
                if (json.extensionsUsed && json.extensionsUsed.includes('KHR_mesh_quantization')) {
                    console.warn('Skipping Meshopt compression check');
                    // Use fallback buildings instead
                    onError(new Error('Meshopt compression not supported'));
                    return;
                }
            }
            
            return originalParse.call(this, data, path, onLoad, onError);
        };
    }();
}

patchGLTFLoader();

// Function to get URL parameters
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}


// Initialize the city and check for username in the URL
function init() {
    // Initialize the scene
    scene = new THREE.Scene(); // Initialize the scene here

    // Check if we have a redirected username from sessionStorage
    const username = window.redirectUsername || '';
    
    // Initialize the city
    City.initCity(scene);
    
    // If we have a username, center the map on their properties
    if (username && username.length > 0) {
        console.log(`Centering map on user: ${username}`);
        centerMapOnUser(username);
    }
}

// Function to center the map on the user's properties
function centerMapOnUser(username) {
    console.log(`Attempting to center map on user: ${username}`); // Debug log
    const userPosition = City.getOwnerPosition(username);
    
    if (userPosition) {
        console.log(`Found position for user ${username}:`, userPosition); // Debug log
        
        // Position the character at the user's location
        if (character) {
            character.position.set(userPosition.x, 1, userPosition.z);
            if (userPosition.rotation !== undefined) {
                character.rotation.y = userPosition.rotation;
            }
        }
        
        // Center the camera on the user's properties
        camera.position.set(userPosition.x - 50, 5, userPosition.z + 10);
        camera.lookAt(userPosition.x, 0, userPosition.z);
    } else {
        console.warn(`No properties found for user: ${username}`); // Debug log
    }
}

// Call the init function when the page loads
window.onload = init;

// In your main.js file, add this function
function checkForHashRedirect() {
    // Check if we have a hash in the URL
    if (window.location.hash) {
        const username = window.location.hash.substring(1); // Remove the # character
        console.log(`Found username in hash: ${username}`);
        
        // Center the map on the user's properties
        if (username && username.length > 0) {
            centerMapOnUser(username);
        }
    }
}

// Call this function when the page loads
window.addEventListener('DOMContentLoaded', checkForHashRedirect); 