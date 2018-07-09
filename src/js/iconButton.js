export default class IconButton {
    /**
     * @param {HTMLElement} element 
     */
    constructor(element) {
        if (!element) {
            return;
        }

        this._element = element;
        this._element.classList.add('button-icon--upgraded');
        this._element.addEventListener('click', () => {
            const input = this._element.firstElementChild;

            input.getAttribute('value') == 'false' ?
                input.setAttribute('value', 'true') :
                input.setAttribute('value', 'false');
        });
    }
};