/**
 * User module for handling user data and movement
 */
const User = (function() {
    // User data structure
    let userData = {
        cityId: null,
        startups: []
    };
    
    // Add a new startup
    function addStartup(startupData) {
        userData.startups.push(startupData);
        Storage.saveUserData(userData);
        return userData;
    }
    
    // Initialize user data
    function initUserData() {
        // Try to load existing data
        const savedData = Storage.loadUserData();
        
        if (savedData) {
            userData = savedData;
        } else {
            // Create new user data with city ID
            userData.cityId = Storage.generateCityId();
            Storage.saveUserData(userData);
        }
        
        return userData;
    }
    
    // Set up first-person controls
    function setupControls(camera, domElement) {
        const controls = new THREE.PointerLockControls(camera, domElement);
        
        // Initial position
        camera.position.set(0, 1.7, 25); // Start at the edge of the city
        
        // Set up keyboard controls
        const keyboard = {};
        const moveSpeed = 0.25;
        
        document.addEventListener('keydown', (event) => {
            keyboard[event.code] = true;
        });
        
        document.addEventListener('keyup', (event) => {
            keyboard[event.code] = false;
            
            // ESC key to toggle controls panel
            if (event.code === 'Escape') {
                const controlsPanel = document.getElementById('controls-panel');
                controlsPanel.classList.toggle('hidden');
            }
        });
        
        // Movement update function
        function updateMovement() {
            if (controls.isLocked) {
                const direction = new THREE.Vector3();
                const frontVector = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
                const sideVector = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
                
                // Forward/backward
                if (keyboard['KeyW']) direction.add(frontVector);
                if (keyboard['KeyS']) direction.sub(frontVector);
                
                // Left/right
                if (keyboard['KeyA']) direction.sub(sideVector);
                if (keyboard['KeyD']) direction.add(sideVector);
                
                // Normalize and apply movement
                if (direction.length() > 0) {
                    direction.normalize();
                    camera.position.addScaledVector(direction, moveSpeed);
                    
                    // Keep within city bounds
                    const cityBounds = 25;
                    camera.position.x = Math.max(-cityBounds, Math.min(cityBounds, camera.position.x));
                    camera.position.z = Math.max(-cityBounds, Math.min(cityBounds, camera.position.z));
                    
                    // Keep at constant height
                    camera.position.y = 1.7;
                }
            }
            
            requestAnimationFrame(updateMovement);
        }
        
        // Start movement loop
        updateMovement();
        
        return controls;
    }
    
    return {
        addStartup,
        initUserData,
        setupControls
    };
})(); 