import DBHelper from './dbhelper.js';
import lazyImageObserver from './lazyImageObserver.js';
import './textfields.js';
import { isMapInitialized, isSlowConnection } from './utils.js';
import idb from 'idb';

const idbPromise = idb.open('restaurant-reviews', 1, upgradeDB => {
  upgradeDB.createObjectStore('restaurants', { keyPath: 'id' });
});

self.restaurant;
self.map;


fetchRestaurantFromURL((error, restaurant) => {
  if (error) { // Got an error!
    console.error(error);
  } else {
    self.restaurant = restaurant;

    // If the user has a good internet connection
    if (navigator.connection &&
      navigator.connection.effectiveType &&
      !['3g', '2g', 'slow-2g'].includes(navigator.connection.effectiveType)) {
      // Initialized the map
      initMap();
    }
    fillBreadcrumb();
  }
});

const mapElement = document.getElementById('map');

mapElement.addEventListener('click', function wakeMap() {
  if (isMapInitialized()) {
    mapElement.removeEventListener('click', wakeMap, false);
  } else {
    window.initMap();
  }
});

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
  if (typeof google === 'undefined') {
    return;
  }

  if (!self.restaurant) {
    return;
  }

  self.map = new google.maps.Map(mapElement, {
    zoom: 16,
    center: self.restaurant.latlng,
    scrollwheel: false,
    mapTypeControl: false,
    streetViewControl: false
  });

  DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
}

// If the user has a good internet connection
if (!isSlowConnection()) {
  // Initialized the map
  window.addEventListener('load', initMap);
}

/**
 * Get current restaurant from page URL.
 */
function fetchRestaurantFromURL(callback) {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    error = 'No restaurant id in URL'
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, function (error, restaurant) {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant)
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
function fillRestaurantHTML(restaurant = self.restaurant) {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name;

  const address = document.getElementById('restaurant-address');
  address.innerHTML = '<em>address: </em>' + restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.classList.add('restaurant-img');
  image.classList.add('lazy');

  const imageUrl = DBHelper.imageUrlForRestaurant(restaurant);
  image.dataset.src = imageUrl;
  image.src = `img/placeholder.svg`;

  const imagePath = imageUrl.substring(0, imageUrl.lastIndexOf('.'));
  const imageType = imageUrl.substring(imageUrl.lastIndexOf('.'), imageUrl.length);
  image.dataset.srcset =
    `${imagePath}-300w${imageType} 300w,` +
    `${imagePath}-550w${imageType} 550w,` +
    `${imageUrl} 800w`;

  image.sizes = '(min-width: 1024px) 50vw, 100vw';

  image.alt = `A view from the restaurant ${restaurant.name}`;

  if (lazyImageObserver) {
    lazyImageObserver.observe(image);
  }

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }

  // fill reviews
  fillReviewsHTML();
}

document.getElementById('reviews-form').addEventListener('submit', function (event) {
  event.preventDefault();

  let nameInput = document.getElementById('reviewer-name');
  let ratingInput = document.getElementById('reviewer-rating');
  let reviewInput = document.getElementById('review');

  const review = {
    restaurant_id: self.restaurant.id,
    name: nameInput.value,
    rating: ratingInput.value,
    comments: reviewInput.value,
    updatedAt: new Date()
  }

  if (!review.rating || !review.comments) {
    return;
  }

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(
      registration => registration.sync.register(`post-review?${JSON.stringify(review)}`)
    ).catch(
      // system was unable to register for a sync,
      // this could be an OS-level restriction
      postReview
    );
  } else {
    // serviceworker/sync not supported
    postReview();
  }

  function postReview() {
    // Post the review
    fetch('http://localhost:1337/reviews/', {
      method: 'POST',
      body: JSON.stringify(review)
    });
  }


  // Add the review to the DOM
  document.getElementById('reviews-list').appendChild(createReviewHTML(review));

  // Update idb
  self.restaurant.reviews.push(review);
  idbPromise.then(db => db.transaction('restaurants', 'readwrite').objectStore('restaurants').put(self.restaurant));

  // Reset the form
  nameInput.value = '';
  nameInput.parentElement.classList.remove('textfield--active');
  ratingInput.value = '';
  ratingInput.parentElement.classList.remove('textfield--active');
  reviewInput.value = '';
  reviewInput.parentElement.classList.remove('textfield--active');
});

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
function fillRestaurantHoursHTML(operatingHours = self.restaurant.operating_hours) {
  const hoursTable = document.getElementById('restaurant-hours');
  hoursTable.innerHTML = '';

  const head = document.createElement('thead');
  hoursTable.appendChild(head);

  const headRow = document.createElement('tr');
  head.appendChild(headRow);

  const thDay = document.createElement('th');
  thDay.innerHTML = 'Day';
  headRow.appendChild(thDay);

  const thHours = document.createElement('th');
  thHours.innerHTML = 'Working hours';
  headRow.appendChild(thHours);

  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hoursTable.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
function fillReviewsHTML(reviews = self.restaurant.reviews) {
  const container = document.getElementById('reviews-container');;

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }

  const ul = document.getElementById('reviews-list');
  ul.innerHTML = '';
  reviews.forEach(review => ul.appendChild(createReviewHTML(review)));
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
function createReviewHTML(review) {
  const li = document.createElement('li');
  li.classList.add('card');
  const name = document.createElement('p');
  name.innerHTML = review.name !== '' ? review.name : 'Anonymous';
  li.appendChild(name);

  const date = document.createElement('p');
  date.innerHTML = new Date(review.updatedAt).toDateString();
  li.appendChild(date);

  const rating = document.createElement('p');
  rating.innerHTML = `Rating: ${review.rating}`;
  li.appendChild(rating);

  const comments = document.createElement('p');
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
function fillBreadcrumb(restaurant = self.restaurant) {
  const breadcrumb = document.getElementById('breadcrumb');
  const previousCurrentPageListElement = breadcrumb.querySelector('*[aria-current="page"]');

  // If the current page is already added
  if (previousCurrentPageListElement && previousCurrentPageListElement.innerHTML == restaurant.name) {
    return; // Exit
  }

  const li = document.createElement('li');
  li.innerHTML = restaurant.name;
  li.setAttribute('aria-current', 'page');
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
function getParameterByName(name, url) {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}
