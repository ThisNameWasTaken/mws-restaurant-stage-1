import DBHelper from './dbhelper.js';
import lazyImageObserver from './lazyImageObserver.js';

self.restaurants;
self.neighborhoods;
self.cuisines;
self.map;
self.markers = [];

const cuisinesSelect = document.getElementById('cuisines-select')
const neighborhoodsSelect = document.getElementById('neighborhoods-select');

const restaurantsList = document.getElementById('restaurants-list');

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
fetchNeighborhoods();
fetchCuisines();

/**
 * Fetch all neighborhoods and set their HTML.
 */
function fetchNeighborhoods() {
  DBHelper.fetchNeighborhoods(function (error, neighborhoods) {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
function fillNeighborhoodsHTML(neighborhoods = self.neighborhoods) {
  const select = document.getElementById('neighborhoods-select');

  select.innerHTML = '';

  const option = document.createElement('option');
  option.innerHTML = 'All Neighborhoods';
  option.value = 'all';
  select.appendChild(option);

  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.appendChild(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
function fetchCuisines() {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
function fillCuisinesHTML(cuisines = self.cuisines) {
  const select = document.getElementById('cuisines-select');

  select.innerHTML = '';

  const option = document.createElement('option');
  option.innerHTML = 'All Cuisines';
  option.value = 'all';
  select.appendChild(option);

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.appendChild(option);
  });
}

let isMapInitialized = false;

const mapElement = document.getElementById('map');
mapElement.addEventListener('click', function wakeMap() {
  if (isMapInitialized) {
    mapElement.removeEventListener('click', wakeMap, false);
    return;
  }

  window.initMap();
});

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = function () {
  isMapInitialized = true;

  let loc = {
    lat: 40.722216,
    lng: -73.987501
  };

  self.map = new google.maps.Map(mapElement, {
    zoom: 12,
    center: loc,
    scrollwheel: false,
    mapTypeControl: false,
    streetViewControl: false
  });

  // Add the markers to the map
  addMarkersToMap(self.restaurants);
}

updateRestaurants();

// If the user has a good internet connection
if (
  navigator.connection &&
  navigator.connection.effectiveType &&
  !['3g', '2g', 'slow-2g'].includes(navigator.connection.effectiveType)) {
  // Initialized the map
  window.addEventListener('load', initMap);
}

/**
 * Update page and map for current restaurants.
 */
function updateRestaurants() {
  const cIndex = cuisinesSelect.selectedIndex;
  const nIndex = neighborhoodsSelect.selectedIndex;

  const cuisine = cuisinesSelect[cIndex].value;
  const neighborhood = neighborhoodsSelect[nIndex].value;

  if (!isMapInitialized && (cuisine != 'all' || neighborhood != 'all')) {
    initMap();
  }

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

cuisinesSelect.addEventListener('change', updateRestaurants);
neighborhoodsSelect.addEventListener('change', updateRestaurants);

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
function resetRestaurants(restaurants) {
  // Remove all restaurants
  self.restaurants = [];
  restaurantsList.innerHTML = '';

  // Remove all map markers
  self.markers.forEach(m => m.setMap(null));
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
function fillRestaurantsHTML(restaurants = self.restaurants) {
  restaurants.forEach(restaurant => restaurantsList.appendChild(createRestaurantHTML(restaurant)));
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
function createRestaurantHTML(restaurant) {
  const li = document.createElement('li');
  li.classList.add('card');

  const image = document.createElement('img');
  image.classList.add('restaurant-img');
  image.classList.add('lazy');

  const imageUrl = DBHelper.imageUrlForRestaurant(restaurant);
  image.dataset.src = imageUrl;

  const imagePath = imageUrl.substring(0, imageUrl.lastIndexOf('.'));
  const imageType = imageUrl.substring(imageUrl.lastIndexOf('.'), imageUrl.length);

  image.src = `img/placeholder.svg`;

  image.dataset.srcset =
    `${imagePath}-300w${imageType} 300w,` +
    `${imagePath}-550w${imageType} 550w`;

  image.dataset.sizes =
    `(min-width: 1024px) 300px,` +
    `(min-width: 720px) 300px,` +
    `(min-width: 480px) 300px,` +
    `(max-width: 479px) 550px`;

  image.alt = `A view from the restaurant ${restaurant.name}`;

  if (lazyImageObserver) {
    lazyImageObserver.observe(image);
  }

  li.appendChild(image);

  const name = document.createElement('h3');
  name.innerHTML = restaurant.name;
  li.appendChild(name);

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  li.appendChild(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  li.appendChild(address);

  const more = document.createElement('a');
  more.classList.add('button');
  more.innerHTML = 'View Details';
  more.href = DBHelper.urlForRestaurant(restaurant);
  more.setAttribute('aria-label', `view details about ${restaurant.name}`);
  li.appendChild(more)

  return li
}

/**
 * Add markers for current restaurants to the map.
 */
function addMarkersToMap(restaurants = self.restaurants) {
  if (!isMapInitialized || !restaurants) {
    return;
  }

  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map)

    google.maps.event.addListener(marker, 'click', () => {
      window.location.href = marker.url
    });
    self.markers.push(marker);
  });
}