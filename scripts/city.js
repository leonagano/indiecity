/**
 * City module for creating and managing the 3D city
 */
const City = (function() {
    // City configuration
    const CITY_SIZE = 50;
    const PLOT_SIZE = 6; // Slightly smaller plots
    const ROAD_WIDTH = 2;
    
    // Define building plots in clusters around central areas with better spacing
    const PLOTS = [
        // Cluster 1 - Northwest district (around a central plaza)
        { x: -18, z: -18, rotation: Math.PI/4 },    // Corner plot
        { x: -18, z: -8, rotation: 0 },             // South facing, moved further out
        { x: -8, z: -18, rotation: Math.PI/2 },     // West facing, moved further out
        
        // Cluster 2 - Northeast district (around a park)
        { x: 18, z: -18, rotation: -Math.PI/4 },    // Corner plot
        { x: 18, z: -8, rotation: 0 },              // South facing, moved further out
        { x: 8, z: -18, rotation: -Math.PI/2 },     // East facing, moved further out
        
        // Cluster 3 - Southwest district (business district)
        { x: -18, z: 18, rotation: 3*Math.PI/4 },   // Corner plot
        { x: -18, z: 8, rotation: Math.PI },        // North facing, moved further out
        { x: -8, z: 18, rotation: Math.PI/2 },      // West facing, moved further out
        
        // Cluster 4 - Southeast district (financial district - for skyscraper)
        { x: 18, z: 18, rotation: -3*Math.PI/4 },   // Corner plot - for skyscraper
        { x: 18, z: 8, rotation: Math.PI },         // North facing, moved further out
        { x: 8, z: 18, rotation: -Math.PI/2 }       // East facing, moved further out
    ];
    
    // Add this at the top of your city.js file
    const textureLoader = new THREE.TextureLoader();
    const roadTextureLoader = new THREE.TextureLoader();
    const skyboxLoader = new THREE.CubeTextureLoader();

    // Load textures
    const grassColorTexture = textureLoader.load('textures/grass/Grass002_4K_Color.jpg');
    const grassNormalTexture = textureLoader.load('textures/grass/Grass002_4K_NormalDX.jpg'); // or NormalGL based on your preference
    const grassRoughnessTexture = textureLoader.load('textures/grass/Grass002_4K_Roughness.jpg');
    const grassAOTexture = textureLoader.load('textures/grass/Grass002_4K_AmbientOcclusion.jpg'); // Optional
    const grassDisplacementTexture = textureLoader.load('textures/grass/Grass002_4K_Displacement.jpg'); // Optional
    
    // Load road textures
    const roadColorTexture = roadTextureLoader.load('textures/asphalt/Asphalt019_4K_Color.jpg');
    const roadNormalTexture = roadTextureLoader.load('textures/asphalt/Asphalt019_4K_NormalDX.jpg'); // or NormalGL based on your preference
    const roadRoughnessTexture = roadTextureLoader.load('textures/asphalt/Asphalt019_4K_Roughness.jpg');
    const roadDisplacementTexture = textureLoader.load('textures/asphalt/Asphalt019_4K_Displacement.jpg'); // Optional
    
    // Set texture properties (optional)
    grassColorTexture.wrapS = THREE.RepeatWrapping;
    grassColorTexture.wrapT = THREE.RepeatWrapping;
    grassColorTexture.repeat.set(10, 10); // Adjust the repeat values as needed

    grassNormalTexture.wrapS = THREE.RepeatWrapping;
    grassNormalTexture.wrapT = THREE.RepeatWrapping;
    grassNormalTexture.repeat.set(10, 10); // Adjust the repeat values as needed

    grassRoughnessTexture.wrapS = THREE.RepeatWrapping;
    grassRoughnessTexture.wrapT = THREE.RepeatWrapping;
    grassRoughnessTexture.repeat.set(10, 10); // Adjust the repeat values as needed

    // Optional: Set up ambient occlusion and displacement if needed
    grassAOTexture.wrapS = THREE.RepeatWrapping;
    grassAOTexture.wrapT = THREE.RepeatWrapping;
    grassAOTexture.repeat.set(10, 10); // Adjust the repeat values as needed

    grassDisplacementTexture.wrapS = THREE.RepeatWrapping;
    grassDisplacementTexture.wrapT = THREE.RepeatWrapping;
    grassDisplacementTexture.repeat.set(10, 10); // Adjust the repeat values as needed

    // Set texture properties (optional)
    roadColorTexture.wrapS = THREE.RepeatWrapping;
    roadColorTexture.wrapT = THREE.RepeatWrapping;
    roadColorTexture.repeat.set(10, 10); // Adjust the repeat values as needed

    roadNormalTexture.wrapS = THREE.RepeatWrapping;
    roadNormalTexture.wrapT = THREE.RepeatWrapping;
    roadNormalTexture.repeat.set(10, 10); // Adjust the repeat values as needed

    roadRoughnessTexture.wrapS = THREE.RepeatWrapping;
    roadRoughnessTexture.wrapT = THREE.RepeatWrapping;
    roadRoughnessTexture.repeat.set(10, 10); // Adjust the repeat values as needed

    roadDisplacementTexture.wrapS = THREE.RepeatWrapping;
    roadDisplacementTexture.wrapT = THREE.RepeatWrapping;
    roadDisplacementTexture.repeat.set(10, 10); // Adjust the repeat values as needed

    // Initialize the city
    function initCity(scene) {
        scene.background = new THREE.Color(0x87CEEB);
        
        createGround(scene);
        createGradientSky(scene);
        createCentralPlazas(scene);
        
        // Add random trees
        addRandomTrees(scene, 20); // Adjust the number of trees as needed
        
        addLighting(scene);
        
        // Note: Paths will be created after buildings are placed
    }
    
    // Create the ground
    function createGround(scene) {
        const groundGeometry = new THREE.PlaneGeometry(CITY_SIZE, CITY_SIZE);
        
        // Create a material with the grass texture
        const groundMaterial = new THREE.MeshStandardMaterial({ 
            map: grassColorTexture,
            // Use only the color texture to avoid errors with other texture maps
            // normalMap: grassNormalTexture,
            // roughnessMap: grassRoughnessTexture,
            // aoMap: grassAOTexture,
            // displacementMap: grassDisplacementTexture,
            side: THREE.DoubleSide
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = Math.PI / 2;
        ground.position.y = 0;
        scene.add(ground);
    }
    
    // Create central plazas/parks instead of a road grid
    function createCentralPlazas(scene) {
        // Create plaza materials
        const plazaMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xd3d3d3, // Light gray for plazas
            side: THREE.DoubleSide
        });
        
        const parkMaterial = new THREE.MeshStandardMaterial({ 
            map: grassColorTexture,
            color: 0x88cc88, // Slightly different green for parks
            side: THREE.DoubleSide
        });
        
        // Create four central plazas/parks
        const plazaPositions = [
            { x: -12, z: -12, type: 'plaza' }, // Northwest
            { x: 12, z: -12, type: 'park' },   // Northeast
            { x: -12, z: 12, type: 'park' },   // Southwest
            { x: 12, z: 12, type: 'plaza' }    // Southeast
        ];
        
        plazaPositions.forEach(pos => {
            const plazaGeometry = new THREE.CircleGeometry(5, 32);
            const material = pos.type === 'plaza' ? plazaMaterial : parkMaterial;
            const plaza = new THREE.Mesh(plazaGeometry, material);
            plaza.rotation.x = -Math.PI / 2;
            plaza.position.set(pos.x, 0.05, pos.z);
            scene.add(plaza);
            
            // Add decorative elements to plazas/parks
            if (pos.type === 'plaza') {
                // Add a fountain or statue in the center
                const fountainGeometry = new THREE.CylinderGeometry(1, 1.5, 0.5, 32);
                const fountainMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
                const fountain = new THREE.Mesh(fountainGeometry, fountainMaterial);
                fountain.position.set(pos.x, 0.25, pos.z);
                scene.add(fountain);
                
                // Add a water surface
                const waterGeometry = new THREE.CircleGeometry(0.8, 32);
                const waterMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0x3498db,
                    transparent: true,
                    opacity: 0.8
                });
                const water = new THREE.Mesh(waterGeometry, waterMaterial);
                water.rotation.x = -Math.PI / 2;
                water.position.set(pos.x, 0.51, pos.z);
                scene.add(water);
            } else {
                // Add trees to parks
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2;
                    const radius = 3;
                    const treeX = pos.x + Math.cos(angle) * radius;
                    const treeZ = pos.z + Math.sin(angle) * radius;
                    //createTree(scene, treeX, treeZ);
                }
            }
        });
    }
    
    // Create walking paths connecting the plazas
    function createWalkingPaths(scene) {
        // Create path material
        const pathMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xbcaaa4, // Tan/brown for walking paths
            side: THREE.DoubleSide
        });
        
        // Create paths between plazas
        const pathConnections = [
            // Horizontal paths
            { start: { x: -12, z: -12 }, end: { x: 12, z: -12 } },
            { start: { x: -12, z: 12 }, end: { x: 12, z: 12 } },
            // Vertical paths
            { start: { x: -12, z: -12 }, end: { x: -12, z: 12 } },
            { start: { x: 12, z: -12 }, end: { x: 12, z: 12 } },
            // Diagonal path
            { start: { x: -12, z: -12 }, end: { x: 12, z: 12 } }
        ];
        
        pathConnections.forEach(connection => {
            const start = connection.start;
            const end = connection.end;
            
            // Calculate path length and angle
            const dx = end.x - start.x;
            const dz = end.z - start.z;
            const length = Math.sqrt(dx * dx + dz * dz);
            const angle = Math.atan2(dz, dx);
            
            // Create path
            const pathGeometry = new THREE.PlaneGeometry(length, 1.5);
            const path = new THREE.Mesh(pathGeometry, pathMaterial);
            
            // Position and rotate path
            path.rotation.x = -Math.PI / 2;
            path.rotation.z = -angle;
            path.position.set(
                start.x + dx/2,
                0.06,
                start.z + dz/2
            );
            
            scene.add(path);
        });
    }
    
    // Add trees to the city
    function addTrees(scene) {
        // Add fewer trees around the perimeter - increase spacing
        /*
        for (let i = -CITY_SIZE/2 + 10; i < CITY_SIZE/2; i += 10) {
            // Only add trees at certain positions
            if (i % 20 === 0) {
                createTree(scene, i, -CITY_SIZE/2 + 5);
                createTree(scene, i, CITY_SIZE/2 - 5);
                createTree(scene, -CITY_SIZE/2 + 5, i);
                createTree(scene, CITY_SIZE/2 - 5, i);
            }
        }
        */
        // Add just a few random trees (reduced from 20 to 8)
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * CITY_SIZE - CITY_SIZE/2;
            const z = Math.random() * CITY_SIZE - CITY_SIZE/2;
            
            // Check if position is not on a road or plot
            if (!isPositionOccupied(x, z)) {
                createTree(scene, x, z);
            }
        }
    }
    
    // Create a tree
    function createTree(scene, x, z) {
        // Use the global GLTFLoader instance
        const treeLoader = Loaders.getGLTFLoader();
        
        // Now load the tree model with the properly configured loader
        treeLoader.load('models/maple_tree.glb', (gltf) => {
            const tree = gltf.scene;
            
            // Scale the tree appropriately - make it much smaller
            tree.scale.set(0.02, 0.02, 0.02); // Reduced scale by 10x
            
            // Position the tree
            tree.position.set(x, 0, z);
            
            // Add some random rotation for variety
            tree.rotation.y = Math.random() * Math.PI * 2;
            
            // Add the tree to the scene
            scene.add(tree);
        }, 
        undefined, 
        (error) => {
            console.error('Error loading tree model:', error);
            createSimpleTree(scene, x, z);
        });
    }
    
    // Create a simple tree as fallback
    function createSimpleTree(scene, x, z) {
        // Tree trunk
        const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
        const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        
        trunk.position.set(x, 0.5, z);
        scene.add(trunk);
        
        // Tree foliage
        const foliageGeometry = new THREE.ConeGeometry(1, 2, 8);
        const foliageMaterial = new THREE.MeshPhongMaterial({ color: 0x2ecc71 });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        
        foliage.position.set(x, 2, z);
        scene.add(foliage);
    }
    
    // Add lighting to the scene
    function addLighting(scene) {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Soft white light
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Bright white light
        directionalLight.position.set(10, 10, 10).normalize();
        scene.add(directionalLight);
    }
    
    // Create a street light
    function createStreetLight(scene, x, z) {
        // Light pole
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
        const poleMaterial = new THREE.MeshPhongMaterial({ color: 0x95a5a6 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        
        pole.position.set(x, 1.5, z);
        scene.add(pole);
        
        // Light fixture
        const fixtureGeometry = new THREE.SphereGeometry(0.2, 16, 16);
        const fixtureMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xf1c40f,
            emissive: 0xf1c40f,
            emissiveIntensity: 0.5
        });
        const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
        
        fixture.position.set(x, 3, z);
        scene.add(fixture);
        
        // Point light
        const light = new THREE.PointLight(0xf1c40f, 0.5, 10);
        light.position.set(x, 3, z);
        scene.add(light);
    }
    
    // Add skybox to the scene
    function addSkybox(scene) {
        const skyboxGeometry = new THREE.BoxGeometry(1000, 1000, 1000);
        const skyboxMaterials = [
            new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }), // right
            new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }), // left
            new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }), // top
            new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }), // bottom
            new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }), // front
            new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide })  // back
        ];
        
        const skybox = new THREE.Mesh(skyboxGeometry, skyboxMaterials);
        scene.add(skybox);
    }
    
    // Check if a position is occupied (on a road or plot)
    function isPositionOccupied(x, z) {
        // Define the road positions
        const roadPositions = [-20, -10, 0, 10, 20];
        
        // Check if on a road more precisely
        // Check vertical roads (x-axis)
        for (const roadX of roadPositions) {
            if (Math.abs(x - roadX) < ROAD_WIDTH/2 + 0.5) { // Add a small buffer
                return true;
            }
        }
        
        // Check horizontal roads (z-axis)
        for (const roadZ of roadPositions) {
            if (Math.abs(z - roadZ) < ROAD_WIDTH/2 + 0.5) { // Add a small buffer
                return true;
            }
        }
        
        // Check if on a plot
        for (const plot of PLOTS) {
            if (Math.abs(x - plot.x) < PLOT_SIZE/2 && Math.abs(z - plot.z) < PLOT_SIZE/2) {
                return true;
            }
        }
        
        return false;
    }
    
    // Create a procedural sky with gradient and sun
    function createGradientSky(scene) {
        // Create a large sphere for the sky dome
        const skyGeometry = new THREE.SphereGeometry(400, 32, 32);
        
        // Create a shader material for the sky with gradient
        const vertexShader = `
            varying vec3 vWorldPosition;
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            varying vec3 vWorldPosition;
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `;
        
        const uniforms = {
            topColor: { value: new THREE.Color(0x0077ff) },  // Sky blue
            bottomColor: { value: new THREE.Color(0xffffff) }, // White/light blue
            offset: { value: 33 },
            exponent: { value: 0.6 }
        };
        
        const skyMaterial = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: uniforms,
            side: THREE.BackSide
        });
        
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        scene.add(sky);
        
        // Add a sun (simple glowing sphere)
        const sunGeometry = new THREE.SphereGeometry(10, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff80,
            transparent: true,
            opacity: 0.8
        });
        
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(100, 100, -100); // Position the sun
        scene.add(sun);
        
        // Add a glow effect around the sun
        const sunGlowGeometry = new THREE.SphereGeometry(15, 32, 32);
        const sunGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.3
        });
        
        const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
        sunGlow.position.copy(sun.position);
        scene.add(sunGlow);
        
        // Add directional light to simulate sunlight
        const sunLight = new THREE.DirectionalLight(0xffffcc, 1);
        sunLight.position.copy(sun.position);
        scene.add(sunLight);
        
        // Add ambient light for overall scene brightness
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);
        
        // Add a subtle hemisphere light for more natural lighting
        const hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
        scene.add(hemiLight);
    }
    
    // Add buildings to the city
    function addBuildings(scene, startups) {
        // Group startups by owner
        const startupsByOwner = {};
        
        startups.forEach(startup => {
            const owner = startup.owner || 'unknown';
            if (!startupsByOwner[owner]) {
                startupsByOwner[owner] = [];
            }
            startupsByOwner[owner].push(startup);
        });
        
        // Sort each owner's startups by MRR (descending)
        Object.keys(startupsByOwner).forEach(owner => {
            startupsByOwner[owner].sort((a, b) => (b.mrr || 0) - (a.mrr || 0));
        });
        
        // Define district positions for each owner
        const ownerDistricts = {
            // Northwest district
            'district1': {
                center: { x: -15, z: -15 },
                plots: [
                    { x: -18, z: -18, rotation: Math.PI/4 },
                    { x: -18, z: -12, rotation: 0 },
                    { x: -12, z: -18, rotation: Math.PI/2 }
                ]
            },
            // Northeast district
            'district2': {
                center: { x: 15, z: -15 },
                plots: [
                    { x: 18, z: -18, rotation: -Math.PI/4 },
                    { x: 18, z: -12, rotation: 0 },
                    { x: 12, z: -18, rotation: -Math.PI/2 }
                ]
            },
            // Southwest district
            'district3': {
                center: { x: -15, z: 15 },
                plots: [
                    { x: -18, z: 18, rotation: 3*Math.PI/4 },
                    { x: -18, z: 12, rotation: Math.PI },
                    { x: -12, z: 18, rotation: Math.PI/2 }
                ]
            },
            // Southeast district
            'district4': {
                center: { x: 15, z: 15 },
                plots: [
                    { x: 18, z: 18, rotation: -3*Math.PI/4 },
                    { x: 18, z: 12, rotation: Math.PI },
                    { x: 12, z: 18, rotation: -Math.PI/2 }
                ]
            }
        };
        
        // Assign districts to owners
        const owners = Object.keys(startupsByOwner);
        const districts = Object.keys(ownerDistricts);
        
        // Place buildings for each owner in their district
        owners.forEach((owner, ownerIndex) => {
            const districtKey = districts[ownerIndex % districts.length];
            const district = ownerDistricts[districtKey];
            const ownerStartups = startupsByOwner[owner];
            
            // Place each startup in the owner's district
            ownerStartups.forEach((startup, startupIndex) => {
                // Use plot if available, otherwise create a new one
                let plot;
                
                if (startupIndex < district.plots.length) {
                    // Use predefined plot
                    plot = district.plots[startupIndex];
                } else {
                    // Create a new plot in the district
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 5 + Math.random() * 5;
                    plot = {
                        x: district.center.x + Math.cos(angle) * distance,
                        z: district.center.z + Math.sin(angle) * distance,
                        rotation: angle + Math.PI // Face toward district center
                    };
                }
                
                // Create building
                Building.createBuilding(scene, startup, plot);
            });
        });
        
        // Then create walking paths connecting the central areas
        createWalkingPaths(scene);
    }
    
    // Function to add random trees to the scene
    function addRandomTrees(scene, numberOfTrees) {
        for (let i = 0; i < numberOfTrees; i++) {
            // Generate random positions within the city bounds
            const x = Math.random() * CITY_SIZE - CITY_SIZE / 2;
            const z = Math.random() * CITY_SIZE - CITY_SIZE / 2;

            // Create a tree at this position
            createTree(scene, x, z);
        }
    }
    
    return {
        initCity,
        addBuildings,
        PLOTS,
        getStartupPosition: function(startupName) {
            // Find the startup in the data
            const startup = STARTUP_DATA.startups.find(s => s.name === startupName);
            if (!startup) return null;
            
            // Find the plot for this startup
            for (let i = 0; i < this.PLOTS.length; i++) {
                const plot = this.PLOTS[i];
                // Simple matching logic - just return the first plot for now
                // We'll improve this later
                return {
                    x: plot.x,
                    z: plot.z,
                    rotation: plot.rotation
                };
            }
            return null;
        },
        getOwnerPosition: function(ownerName) {
            // Find any startup by this owner
            const ownerStartups = STARTUP_DATA.startups.filter(s => 
                s.owner && s.owner.toLowerCase() === ownerName.toLowerCase());
            
            if (ownerStartups.length > 0) {
                // Use the first startup's position
                const firstStartup = ownerStartups[0];
                
                // Find the plot for this startup
                for (let i = 0; i < this.PLOTS.length; i++) {
                    const plot = this.PLOTS[i];
                    // Simple matching logic - just return the first plot for now
                    return {
                        x: plot.x,
                        z: plot.z,
                        rotation: plot.rotation
                    };
                }
            }
            
            return null;
        }
    };
})(); 