import idb from 'idb';

const idbPromise = idb.open('restaurant-reviews', 1, upgradeDB => {
  upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
});

const dbWorker = new Worker('/js/dbWorker.js');

/**
 * Common database helper functions.
 */
export default class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    idbPromise
      .then(db => db.transaction('restaurants', 'readwrite').objectStore('restaurants').getAll())
      .then(restaurants => callback(null, restaurants));

    let xhr = new XMLHttpRequest();
    xhr.open('GET', DBHelper.DATABASE_URL);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        dbWorker.postMessage({ type: 'updateIDB', responseText: xhr.responseText });

        dbWorker.addEventListener('message', function (event) {
          const message = event.data;
          if (message.type == 'updateIDB') {
            if (message.restaurants) { // Got the restaurant
              callback(null, message.restaurants);
            } else { // Restaurant does not exist in the database
              callback('Restaurants do not exist', null);
            }
          }
        })
      } else { // Oops!. Got an error from server.
        const error = (`Request failed. Returned status of ${xhr.status}`);
        callback(error, null);
      }
    };
    xhr.send();
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        dbWorker.postMessage({ type: 'filterByID', restaurants: restaurants, id: id });

        dbWorker.addEventListener('message', function (event) {
          const message = event.data;
          if (message.type == 'filterByID') {
            if (message.restaurant) { // Got the restaurant
              callback(null, message.restaurant);
            } else { // Restaurant does not exist in the database
              callback('Restaurant does not exist', null);
            }
          }
        });
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        dbWorker.postMessage({ type: 'filterByCuisine', restaurants: restaurants, cuisine: cuisine });

        dbWorker.addEventListener('message', function (event) {
          const message = event.data;
          if (message.type == 'filterByCuisine') {
            callback(null, message.cuisines);
          }
        });
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        dbWorker.postMessage({ type: 'filterByNeighborhood', restaurants: restaurants, neighborhood: neighborhood });

        dbWorker.addEventListener('message', function (event) {
          const message = event.data;
          if (message.type == 'filterByNeighborhood') {
            callback(null, message.neighborhoods);
          }
        });
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        dbWorker.postMessage({
          type: 'filterByCuisineAndNeighborhood',
          restaurants: restaurants,
          cuisine: cuisine,
          neighborhood: neighborhood
        });

        dbWorker.addEventListener('message', function (event) {
          const message = event.data;
          if (message.type == 'filterByCuisineAndNeighborhood') {
            callback(null, message.restaurants);
          }
        });
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        dbWorker.postMessage({ type: 'fetchNeighborhoods', restaurants: restaurants });

        dbWorker.addEventListener('message', function (event) {
          const message = event.data;
          if (message.type == 'fetchNeighborhoods') {
            callback(null, message.neighborhoods);
          }
        });
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        dbWorker.postMessage({ type: 'fetchCuisines', restaurants: restaurants });

        dbWorker.addEventListener('message', function (event) {
          const message = event.data;
          if (message.type == 'fetchCuisines') {
            callback(null, message.cuisines);
          }
        });
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map
    });
    self.didMapChange = true;
    return marker;
  }

}

// Remove the elements inside the map from the tab order,
// but add them to the tab order when it is clicked.
(function () {
  const map = document.getElementById('map');

  document.body.focus();

  self.didMapChange = true;

  let focusableElements;
  let isMapActive = false;

  map.addEventListener('focus', removeFocus);
  map.addEventListener('click', addFocus);
  map.addEventListener('keydown', function (event) {
    // Blur the map.
    if (event.key == 'Escape') {
      event.target.blur();
      map.focus();
    }

    // Keyboard trap.
    if (event.key == 'Tab') {
      if (event.shiftKey) {
        if (event.target == focusableElements[0]) {
          event.preventDefault();
          focusableElements[focusableElements.length - 1].focus();
        }
      } else {
        if (event.target == focusableElements[focusableElements.length - 1]) {
          event.preventDefault();
          focusableElements[0].focus();
        }
      }
    }
  });

  self.addEventListener('keyup', function (event) {
    if (!map.contains(event.target)) {
      return;
    }

    if (!isMapActive) {
      map.focus();
    }
  });

  function removeFocus(event) {
    isMapActive = false;

    if (self.didMapChange || !focusableElements) {
      focusableElements = map.querySelectorAll('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]');
      self.didMapChange = false;
    }

    // Remove the focusable elements from the tab order.
    for (const focusableElement of focusableElements) {
      focusableElement.setAttribute('tabindex', '-1');
    }
  }

  function addFocus(event) {
    isMapActive = true;

    if (self.didMapChange || !focusableElements) {
      focusableElements = map.querySelectorAll('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex], [contenteditable]');
    }

    // Add the focusable elements from the tab order
    for (const focusableElement of focusableElements) {
      focusableElement.setAttribute('tabindex', '0');
    }
  }
})();


/** 
 *  Register a service worker to the root of the page.
 */
(function resgiterServiceWorker() {
  if (!navigator.serviceWorker) {
    return;
  }

  navigator.serviceWorker.register('sw.js')
    .then(function (reg) {
      if (!navigator.serviceWorker.controller) {
        return;
      }

      if (reg.waiting) {
        // if there is a sw already waiting then update since the user did not yet interact with the page
        reg.waiting.postMessage({ action: 'skipWaiting' });
        return;
      }
    });
})();