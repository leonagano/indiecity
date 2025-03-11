/**
 * Storage module for handling data persistence
 */
const Storage = (function() {
    const LOCAL_STORAGE_KEY = 'indie_city_data';
    
    // Save user data to local storage
    function saveUserData(userData) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
    }
    
    // Load user data from local storage
    function loadUserData() {
        const data = localStorage.getItem(LOCAL_STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    }
    
    // Generate a unique ID for the city
    function generateCityId() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }
    
    // Create a shareable URL for the city
    function createShareableUrl(cityId, owner) {
        const baseUrl = window.location.origin + window.location.pathname;
        return owner ? `${baseUrl}#${owner}` : `${baseUrl}?city=${cityId}`;
    }
    
    // Get city ID or owner from URL
    function getCityIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        const cityId = urlParams.get('city');
        
        // Check for hash format (#leonagano)
        const hash = window.location.hash.substring(1);
        const owner = hash || null;
        
        return { cityId, owner };
    }
    
    return {
        saveUserData,
        loadUserData,
        generateCityId,
        createShareableUrl,
        getCityIdFromUrl
    };
})(); 