export default class IconButton {
    /**
     * @param {HTMLElement} element 
     * @param {String} ariaLabelOn - label to use for the aria-label when the icon-button is toggled on
     * @param {String} ariaLabelOff - label to use for the aria-label when the icon-button is toggled off
     */
    constructor(element, ariaLabelOn, ariaLabelOff) {
        if (!element) {
            return;
        }

        this._element = element;
        this._element.setAttribute('role', 'button');
        this._element.dataset.ariaLabelOn = ariaLabelOn;
        this._element.dataset.ariaLabelOff = ariaLabelOff;
        this._updateAria();

        this._element.addEventListener('click', () => {
            this._element.classList.toggle('icon-button--active');
            this._updateAria();
        });
    }
    _updateAria() {
        if (this._element.classList.contains('icon-button--active')) {
            this._element.setAttribute('aria-pressed', true);
            this._element.setAttribute('aria-label', this._element.dataset.ariaLabelOn);
        } else {
            this._element.setAttribute('aria-pressed', false);
            this._element.setAttribute('aria-label', this._element.dataset.ariaLabelOff);
        }
    }
};