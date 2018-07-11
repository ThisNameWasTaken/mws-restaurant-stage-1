/**
 * @returns {Boolean} a boolean asserting whether or not the google maps is initialized
 */
export function isMapInitialized() {
    return typeof google !== 'undefined';
}

/**
 * @returns {Boolean} a boolean asserting whether or not the user is on a slow connection
 */
export function isSlowConnection() {
    return navigator.connection && navigator.connection.effectiveType &&
        ['3g', '2g', 'slow-2g'].includes(navigator.connection.effectiveType);
}