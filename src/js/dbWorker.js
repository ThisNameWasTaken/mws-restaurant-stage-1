import idb from './idb';

const idbPromise = idb.open('restaurant-reviews', 1, upgradeDb => upgradeDb.createObjectStore('restaurant-data', { keyPath: 'id' }));

self.onmessage = function (event) {
    const message = event.data;

    switch (message.type) {
        case 'updateIDB':
            updateIDB(message.responseText);
            break;

        case 'filterCuisines':
            filterCuisinies(message.restaurants);
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

function filterCuisinies(restaurants) {
    // Get all cuisines from all restaurants
    const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
    // Remove duplicates from cuisines
    const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);

    self.postMessage({ type: 'filterCuisines', cuisines: uniqueCuisines });
}