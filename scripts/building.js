/**
 * Building module for generating 3D buildings
 */
const Building = (function() {
    // Store loaded models
    const loadedModels = {};
    const modelLoader = new THREE.GLTFLoader();
    
    // MRR tiers and corresponding building types
    const MRR_TIERS = [
        { max: 0, type: 'startup', name: 'Startup Office', model: 'models/startup_office.glb' },
        { max: 100, type: 'small', name: 'Small Business', model: 'models/small_business.glb' },
        { max: 1000, type: 'medium', name: 'Medium Business', model: 'models/medium_business.glb' },
        { max: 10000, type: 'large', name: 'Corporate Office', model: 'models/corporate_office.glb' },
        { max: 100000, type: 'tower', name: 'Business Tower', model: 'models/business_tower.glb' },
        { max: Infinity, type: 'skyscraper', name: 'Skyscraper', model: 'models/skyscraper.glb' }
    ];
    
    // Building designs based on MRR tier (for sizing and positioning)
    const TIER_DESIGNS = {
        'startup': {
            height: 2,
            width: 2,
            depth: 2,
            color: 0x3498db,
            scale: 0.4
        },
        'small': {
            height: 1,
            width: 2.5,
            depth: 2.5,
            color: 0x2ecc71,
            scale: 3.0
        },
        'medium': {
            height: 5,
            width: 3,
            depth: 3,
            color: 0xf1c40f,
            scale: 15.0
        },
        'large': {
            height: 5,
            width: 3,
            depth: 3,
            color: 0xe74c3c,
            scale: 15.0
        },
        'tower': {
            height: 12,
            width: 5,
            depth: 5,
            color: 0x9b59b6,
            scale: 1.6
        },
        'skyscraper': {
            height: 20,
            width: 6,
            depth: 6,
            color: 0x1abc9c,
            scale: 0.15
        }
    };
    
    // Preload all building models
    function preloadModels(callback) {
        let modelsToLoad = MRR_TIERS.length;
        let modelsLoaded = 0;
        
        // Use the global GLTFLoader instance
        const modelLoader = Loaders.getGLTFLoader();
        
        MRR_TIERS.forEach(tier => {
            // Add error handling for model loading
            modelLoader.load(
                tier.model,
                (gltf) => {
                    // Store the loaded model
                    loadedModels[tier.type] = gltf.scene;
                    modelsLoaded++;
                    
                    if (modelsLoaded === modelsToLoad) {
                        console.log("All building models loaded");
                        if (callback) callback();
                    }
                },
                (xhr) => {
                    console.log(`${tier.type} model: ${(xhr.loaded / xhr.total) * 100}% loaded`);
                },
                (error) => {
                    console.error(`Error loading model: ${tier.model}`, error);
                    // Count as loaded even if there's an error, to avoid hanging
                    modelsLoaded++;
                    
                    // Create a fallback cube model
                    const geometry = new THREE.BoxGeometry(1, 1, 1);
                    const material = new THREE.MeshPhongMaterial({ color: TIER_DESIGNS[tier.type].color });
                    const cube = new THREE.Scene();
                    cube.add(new THREE.Mesh(geometry, material));
                    loadedModels[tier.type] = cube;
                    
                    if (modelsLoaded === modelsToLoad) {
                        console.log("All building models loaded (some with fallbacks)");
                        if (callback) callback();
                    }
                }
            );
        });
    }
    
    // Create a building based on startup data
    function createBuilding(scene, startupData, position) {
        // Determine MRR tier
        const mrr = startupData.mrr || 0;
        let tier = MRR_TIERS.find(tier => mrr <= tier.max);
        
        // Get building design based on tier
        const design = TIER_DESIGNS[tier.type];
        
        // Check the status of the startup
        if (startupData.status === 'failed') {
            // Load ruins model instead of the regular building
            const ruinsLoader = Loaders.getGLTFLoader();
            ruinsLoader.load('models/ruins.glb', (gltf) => {
                const ruins = gltf.scene;
                ruins.scale.set(0.5, 0.5, 0.5); // Scale down the ruins
                ruins.position.set(position.x, 0, position.z);
                scene.add(ruins);
                
                // Create a sign on top of the ruins
                const signData = {
                    name: startupData.name, // Include the project name
                    website: "#", // Placeholder, can be adjusted
                    mrr: "Failed", // No MRR for failed startups
                    visibility: "public",
                    owner: "unknown",
                    status: "failed"
                };
                
                // Position the sign on top of the ruins
                const signHeight = 1; // Adjust height as needed
                addBuildingLabel(scene, signData, {
                    x: position.x,
                    y: signHeight, // Position the sign above the ruins
                    z: position.z
                });
            }, undefined, (error) => {
                console.error(`Error loading ruins model: ${error}`);
            });
        } else {
            // Create the building using the 3D model
            createBuildingFromModel(scene, tier.type, design, position, (building) => {
                // Add building label with full startup data and tier name
                const labelData = {
                    ...startupData,
                    mrr: startupData.mrr ? `${startupData.mrr}` : "Pre-revenue"
                };
                
                // Set labelOffset based on building type
                let labelOffset;
                if (tier.type === 'startup' || tier.type === 'small') {
                    labelOffset = 1; // Closer for startup and small buildings
                } else {
                    labelOffset = 3; // Further for larger buildings
                }
                
                // Position label in front of the building based on rotation
                let labelX = position.x;
                let labelZ = position.z;
                
                // Adjust label position based on building rotation
                if (position.rotation !== undefined) {
                    // Rotate the building to face the road
                    building.rotation.y = position.rotation;
                    
                    // Position label in front of the building
                    labelX += Math.sin(position.rotation) * labelOffset;
                    labelZ += Math.cos(position.rotation) * labelOffset;
                }
                
                // Set the height for the sign to be at ground level
                const signHeight = 0.1; // Slightly above ground level
                
                // Position the label on the floor in front of the building
                addBuildingLabel(scene, labelData, {
                    x: labelX,
                    y: signHeight, // Position the sign just above the ground
                    z: labelZ
                });
                
                // If the status is "onsale", add the for sale sign
                if (startupData.status === 'onsale') {
                    const signLoader = Loaders.getGLTFLoader();
                    signLoader.load('models/for_sale_sign.glb', (gltf) => {
                        const sign = gltf.scene;
                        sign.position.set(position.x, 1, position.z + 2); // Adjust position as needed
                        
                        // Set the scale to make the sign smaller
                        sign.scale.set(0.003, 0.003, 0.003); // Adjust these values as needed for size
                        
                        // Rotate the sign 90 degrees counterclockwise (π/2 radians)
                        sign.rotation.y = Math.PI / 2; // 90 degrees in radians
                        
                        scene.add(sign);
                    }, undefined, (error) => {
                        console.error(`Error loading for sale sign model: ${error}`);
                    });
                }
            });
        }
    }
    
    // Create building from loaded 3D model
    function createBuildingFromModel(scene, tierType, design, position, callback) {
        // Check if model is already loaded
        if (loadedModels[tierType]) {
            const model = loadedModels[tierType].clone();
            
            // Scale the model
            model.scale.set(design.scale, design.scale, design.scale);
            
            // Center the model on its plot
            centerModelOnPlot(model);
            
            // Position the model at the plot location
            model.position.set(position.x, 0, position.z);
            
            // Add to scene
            scene.add(model);
            
            if (callback) callback(model);
            return model;
        } else {
            // Load the model if not already loaded
            const tierData = MRR_TIERS.find(t => t.type === tierType);
            
            // Use the global GLTFLoader instance with Meshopt support
            const modelLoader = Loaders.getGLTFLoader();
            
            modelLoader.load(tierData.model, (gltf) => {
                const model = gltf.scene;
                
                // Store for future use
                loadedModels[tierType] = model.clone();
                
                // Scale the model
                model.scale.set(design.scale, design.scale, design.scale);
                
                // Center the model on its plot
                centerModelOnPlot(model);
                
                // Position the model at the plot location
                model.position.set(position.x, 0, position.z);
                
                // Add to scene
                scene.add(model);
                
                if (callback) callback(model);
            }, undefined, (error) => {
                console.error(`Error loading model: ${tierData.model}`, error);
                // Fallback to procedural building if model fails to load
                const fallbackBuilding = createFallbackBuilding(tierType, design, position);
                scene.add(fallbackBuilding);
                
                if (callback) callback(fallbackBuilding);
            });
        }
    }
    
    // Center a model on its plot
    function centerModelOnPlot(model) {
        // Calculate the bounding box of the model
        const boundingBox = new THREE.Box3().setFromObject(model);
        const center = boundingBox.getCenter(new THREE.Vector3());
        
        // Adjust the model position to center it on the plot
        model.position.x -= center.x;
        model.position.z -= center.z;
        
        // Keep the bottom of the model at ground level
        const height = boundingBox.max.y - boundingBox.min.y;
        model.position.y -= boundingBox.min.y;
    }
    
    // Create a fallback procedural building if model loading fails
    function createFallbackBuilding(tierType, design, position) {
        const group = new THREE.Group();
        
        // Simple box as fallback
        const geometry = new THREE.BoxGeometry(design.width, design.height, design.depth);
        const material = new THREE.MeshPhongMaterial({ 
            color: design.color,
            flatShading: true
        });
        
        const building = new THREE.Mesh(geometry, material);
        building.position.set(0, design.height/2, 0);
        group.add(building);
        
        // Position the entire building
        group.position.set(position.x, 0, position.z);
        
        return group;
    }
    
    // Add a text label in front of the building
    function addBuildingLabel(scene, startupData, position) {
        // Create a canvas for the text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512; // Larger canvas for more detail
        canvas.height = 160; // Reduced height since we're removing the building name
        
        // Draw background for better visibility
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw border
        context.strokeStyle = '#ffffff';
        context.lineWidth = 4;
        context.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        // Draw startup name (larger font)
        context.fillStyle = '#ffffff';
        context.font = 'bold 36px Arial';
        context.textAlign = 'center';
        context.fillText(startupData.name, canvas.width / 2, 45);
        
        // Draw MRR info (smaller font, different color based on MRR)
        var mrrText = "";
        if (startupData.mrr != null && startupData.status != "failed") {
            mrrText = `$${startupData.mrr} MRR`;
            context.fillStyle = startupData.mrr > 0 ? '#4CAF50' : '#FFC107'; // Green for revenue, yellow for pre-revenue
        } else {
            if (startupData.status === "failed") {
                mrrText = "Failed";
                context.fillStyle = '#e74c3c';
            } else {
                mrrText = "Pre-revenue";
            }
        }
        
        context.font = '28px Arial';
        context.fillText(mrrText, canvas.width / 2, 85);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        
        // Create sprite material with the texture
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        
        // Create sprite
        const sprite = new THREE.Sprite(material);
        
        // Position the sprite in front of the building at a fixed height
        sprite.position.set(position.x, 3, position.z); // Fixed height of 3 units
        
        // Make the sprite an appropriate size
        sprite.scale.set(4, 1.3, 1);
        
        // Set render order to ensure the sign is rendered on top
        sprite.renderOrder = 1; // Higher value means rendered on top of lower values
        
        // Store the website URL in the sprite's userData for click handling
        sprite.userData = {
            type: 'label',
            url: startupData.website,
            name: startupData.name
        };
        
        scene.add(sprite);
        return sprite;
    }
    
    return {
        createBuilding,
        preloadModels,
        centerModelOnPlot
    };
})(); 