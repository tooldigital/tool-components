import Sniffer from 'snifferjs'

// Class to detect browser / os / etc
class Detect {
    constructor() {
        const ua = window.navigator.userAgent
        this.init(ua)
    }

    init(ua) {
        if (this._init) return

        this._init = true

        this.sniffer = Sniffer(ua)
        this.os = this.sniffer.os
        this.browser = this.sniffer.browser
        this.feature = this.sniffer.feature

        this.browserName = this.sniffer.browser.name
        const isTablet = (ua.match(/(iPad)/) /* iOS pre 13 */ ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) /* iPad OS 13 */)
        this.isTablet = isTablet
        this.isMobile = this.sniffer.features.mobile && !this.isTablet
        this.isDesktop = !this.sniffer.features.mobile && !this.isTablet

        this.isIOS = this.os.name === 'ios'
        this.isAndroid = this.os.name === 'android'
        this.isIE = this.browser.name === 'ie'
        this.isSafari = this.browser.name === 'safari'
        this.isChrome = this.browser.name === 'chrome'
        this.isFirefox = this.browser.name === 'firefox'
        if (this.isMobile && this.isIOS) {
            this.isFirefox = ua.includes('FxiOS')
        }

        this.isFloatType = false
        const extensions = document.createElement("canvas").getContext("webgl").getSupportedExtensions()
        for (let i = 0; i < extensions.length; i++) {
            const extension = extensions[i];

            if (extension === "OES_texture_float") {
                this.isFloatType = true
            }
        }

        // const min = Math.min(window.innerWidth, window.innerHeight)
        // this.isSmall = this.isMobile && min < 768

        this.isTouch = false

        this.addClasses()
        if ('ontouchstart' in window) this.isTouch = true
    }

    addClasses() {
        if (this.isMobile) {
            document.documentElement.classList.add('mobile');
            document.documentElement.classList.add('touch');
        } else if (this.isTablet) {
            document.documentElement.classList.add('tablet');
            document.documentElement.classList.add('touch');
        } else if (this.isDesktop) {
            document.documentElement.classList.add('desktop');
        }

        if (this.isIOS) {
            document.documentElement.classList.add('ios');
        }
        if (this.isAndroid) {
            document.documentElement.classList.add('android');
        }
        if (this.isIE) {
            document.documentElement.classList.add('ie');
        }
        if (this.isSafari) {
            document.documentElement.classList.add('safari');
        }
        if (this.isChrome) {
            document.documentElement.classList.add('chrome');
        }
        if (this.isFirefox) {
            document.documentElement.classList.add('firefox');
        }
    }
}

export default new Detect()