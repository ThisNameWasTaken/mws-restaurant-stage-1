export default (function () {
    'use strict';

    let inputs = document.getElementsByClassName('textfield__input');

    for (let i = 0; i < inputs.length; i++) {
        inputs[i].addEventListener('focus', handleActiveState);
        inputs[i].addEventListener('blur', handleActiveState);

        if (inputs[i].required) {
            inputs[i].addEventListener('focus', handleDangerState);
            inputs[i].addEventListener('blur', handleDangerState);
        }
    }

    function handleActiveState() {
        if (this.value) {
            this.parentElement.classList.add('textfield--active');
        } else {
            this.parentElement.classList.remove('textfield--active');
        }
    }

    function handleDangerState(event) {
        this.parentElement.classList.remove('textfield--danger');
        if (!this.value && event.type == 'blur') {
            this.parentElement.classList.add('textfield--danger');
        }
    }
})();