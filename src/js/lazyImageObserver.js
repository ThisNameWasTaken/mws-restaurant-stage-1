import 'intersection-observer';

let lazyImageObserver;

/**
 * Lazy load offscreen images
 */
if ("IntersectionObserver" in window) {
    lazyImageObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
            if (entry.isIntersecting) {
                let lazyImage = entry.target;
                lazyImage.src = lazyImage.dataset.src;
                lazyImage.srcset = lazyImage.dataset.srcset;
                lazyImageObserver.unobserve(lazyImage);
            }
        });
    });
}

export default lazyImageObserver;