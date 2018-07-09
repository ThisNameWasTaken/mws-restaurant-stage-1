import idb from './idb';

const idbPromise = idb.open('restaurant-reviews', 1, upgradeDb => upgradeDb.createObjectStore('restaurant-data', { keyPath: 'id' }));

self.onmessage = function (event) {
    const message = event.data;

    switch (message.type) {
        case 'updateIDB':
            updateIDB(message.responseText);
            break;

        case 'fetchCuisines':
            fetchCuisines(message.restaurants);
            break;

        case 'fetchNeighborhoods':
            fetchNeighborhoods(message.restaurants);
            break;

        case 'filterByNeighborhood':
            filterByNeighborhood({
                restaurants: message.restaurants,
                neighborhood: message.neighborhood
            });
            break;

        case 'filterByCuisine':
            filterByCuisine({
                restaurants: message.restaurants,
                cuisine: message.cuisine
            });
            break;

        case 'filterByID':
            filterByID({
                restaurants: message.restaurants,
                id: message.id
            });
            break;

        case 'filterByCuisineAndNeighborhood':
            filterByCuisineAndNeighborhood({
                restaurants: message.restaurants,
                cuisine: message.cuisine,
                neighborhood: message.neighborhood
            });
            break;

        default:
            break;
    }
}

function updateIDB(responseText) {
    const restaurants = JSON.parse(responseText);

    if (!restaurants) {
        return;
    }

    restaurants.forEach(restaurant =>
        idbPromise.then(db =>
            db.transaction('restaurant-data', 'readwrite').objectStore('restaurant-data').put(restaurant))
    );
}

function fetchCuisines(restaurants) {
    // Get all cuisines from all restaurants
    const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
    // Remove duplicates from cuisines
    const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
    // Send back the cuisines
    self.postMessage({ type: 'fetchCuisines', cuisines: uniqueCuisines });
}

function fetchNeighborhoods(restaurants) {
    // Get all neighborhoods from all restaurants
    const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
    // Remove duplicates from neighborhoods
    const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
    // Send back the neighborhoods
    self.postMessage({ type: 'fetchNeighborhoods', neighborhoods: uniqueNeighborhoods });
}

function filterByNeighborhood({ restaurants, neighborhood }) {
    // Send back the restaurants filtered by the given neighborhood
    self.postMessage({
        type: 'filterByNeighborhood',
        // Filter restaurants to have only given neighborhood
        restaurants: restaurants.filter(r => r.neighborhood == neighborhood)
    });
}

function filterByCuisine({ restaurants, cuisine }) {
    // Send back the restaurants filtered by the given cuisine
    self.postMessage({
        type: 'filterByCuisine',
        // Filter restaurants to have only given cuisine type
        restaurants: restaurants.filter(r => r.cuisine_type == cuisine)
    });
}

function filterByID({ restaurants, id }) {
    // Find the restaurant with given ID
    let restaurant = restaurants.find(r => r.id == id);

    if (restaurant) {
        // Get the reviews for the given restaurant
        fetch(`http://localhost:1337/reviews/?restaurant_id=${id}`)
            .then(response => response.json())
            .then(reviews => {
                restaurant.reviews = reviews;
                // Send back the restaurant with the given ID
                self.postMessage({
                    type: 'filterByID',
                    restaurant: restaurant
                });
            });
    } else {
        // Send back the restaurant with the given ID
        self.postMessage({
            type: 'filterByID',
            restaurant: restaurant
        });
    }
}

function filterByCuisineAndNeighborhood({ restaurants, cuisine, neighborhood }) {
    if (cuisine != 'all') { // filter by cuisine
        restaurants = restaurants.filter(r => r.cuisine_type == cuisine);
    }

    if (neighborhood != 'all') { // filter by neighborhood
        restaurants = restaurants.filter(r => r.neighborhood == neighborhood);
    }

    // Send back the restaurants filtered by the given cuisine and neighborhood
    self.postMessage({
        type: 'filterByCuisineAndNeighborhood',
        // Filter restaurants to have only given cuisine and neighborhood
        restaurants: restaurants
    });
}