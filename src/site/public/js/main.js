$(document).ready(async () => {

    //load particles
    particlesJS.load('particles', './assets/particles.json', function() {
        console.log('callback - particles.js config loaded');
    })

    //animations
    function animateCss(element, animationName, callback) {
        $(element).removeClass('dnone')
        const node = document.querySelector(element)
        node.classList.add('animated', animationName)

        function handleAnimationEnd() {
            node.classList.remove('animated', animationName)
            node.removeEventListener('animationend', handleAnimationEnd)

            if (typeof callback === 'function') callback()
        }

        node.addEventListener('animationend', handleAnimationEnd)
    }

    await animateCss('#name', 'flipInX', () => {
        $('#name').addClass('floating')
        animateCss('#icon-list', 'fadeIn')

    })

}) 