/**
 * PROJECT CORE CONTROLLER: script.js
 * Version: 2.0.0
 * Description: Integrated logic for state, DOM manipulation, and API handling.
 */

"use strict";

// ==========================================
// 1. GLOBAL CONFIGURATION & STATE
// ==========================================
const CONFIG = {
    apiEndpoint: "https://api.example.com/v1",
    animationDuration: 300,
    localStorageKey: "user_preferences",
    breakpoints: { mobile: 768, tablet: 1024 }
};

let appState = {
    isDarkMode: false,
    isMenuOpen: false,
    userData: null,
    activeTab: "home",
    notifications: []
};

// ==========================================
// 2. DOM ELEMENT SELECTORS
// ==========================================
const DOM = {
    body: document.body,
    nav: document.querySelector('.main-nav'),
    menuBtn: document.getElementById('menu-toggle'),
    themeBtn: document.querySelector('.theme-switcher'),
    contactForm: document.querySelector('#contact-form'),
    modalContainer: document.querySelector('.modal-overlay'),
    dynamicContent: document.getElementById('content-area'),
    scrollProgress: document.querySelector('.progress-bar')
};

// ==========================================
// 3. UTILITY FUNCTIONS (Helper Methods)
// ==========================================
const Utils = {
    /**
     * Prevents functions from firing too rapidly
     */
    debounce: (func, wait = 20) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    },

    /**
     * Validates email format via Regex
     */
    isValidEmail: (email) => {
        const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(String(email).toLowerCase());
    },

    /**
     * Safe LocalStorage Wrapper
     */
    saveToStorage: (key, data) => {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error("Error saving to LocalStorage", e);
        }
    }
};

// ==========================================
// 4. CORE FUNCTIONAL MODULES
// ==========================================

const ThemeModule = {
    init() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            this.setTheme(true);
        }
    },
    toggle() {
        appState.isDarkMode = !appState.isDarkMode;
        this.setTheme(appState.isDarkMode);
    },
    setTheme(isDark) {
        DOM.body.classList.toggle('dark-mode', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        console.log(`Theme switched to: ${isDark ? 'Dark' : 'Light'}`);
    }
};

const FormModule = {
    handleSubmission(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        if (!Utils.isValidEmail(data.email)) {
            this.showError("Please enter a valid email address.");
            return;
        }

        this.submitData(data);
    },
    async submitData(payload) {
        console.log("Attempting to send:", payload);
        // Simulate API Call
        try {
            const response = await fetch(`${CONFIG.apiEndpoint}/contact`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            alert("Message sent successfully!");
        } catch (err) {
            console.warn("API Mock: Data captured but server unreachable.", payload);
        }
    },
    showError(msg) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-msg';
        errorDiv.textContent = msg;
        DOM.contactForm.prepend(errorDiv);
        setTimeout(() => errorDiv.remove(), 3000);
    }
};

const UIModule = {
    updateScrollProgress() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        if (DOM.scrollProgress) {
            DOM.scrollProgress.style.width = scrolled + "%";
        }
    },

    revealOnScroll() {
        const observers = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.animate-on-scroll').forEach(el => observers.observe(el));
    }
};

// ==========================================
// 5. EVENT LISTENERS
// ==========================================
const initEventListeners = () => {
    // Theme Toggle
    if (DOM.themeBtn) {
        DOM.themeBtn.addEventListener('click', () => ThemeModule.toggle());
    }

    // Mobile Menu
    if (DOM.menuBtn) {
        DOM.menuBtn.addEventListener('click', () => {
            appState.isMenuOpen = !appState.isMenuOpen;
            DOM.nav.classList.toggle('active', appState.isMenuOpen);
        });
    }

    // Form Handling
    if (DOM.contactForm) {
        DOM.contactForm.addEventListener('submit', (e) => FormModule.handleSubmission(e));
    }

    // Scroll Effects
    window.addEventListener('scroll', Utils.debounce(() => {
        UIModule.updateScrollProgress();
    }, 10));

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && appState.isMenuOpen) {
            appState.isMenuOpen = false;
            DOM.nav.classList.remove('active');
        }
    });
};

// ==========================================
// 6. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("System initialized...");
    ThemeModule.init();
    UIModule.revealOnScroll();
    initEventListeners();
});
