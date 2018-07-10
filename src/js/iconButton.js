export default class IconButton {
    /**
     * @param {HTMLElement} element 
     */
    constructor(element) {
        if (!element) {
            return;
        }

        this._element = element;
        this._element.addEventListener('click', () =>
            this._element.classList.toggle('icon-button--active')
        );
    }
};