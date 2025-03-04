// ==UserScript==
// @name         YouTube Original Audio Selector
// @match        *://*.youtube.com/*
// @version      1.0
// @author       xack (with Grok)
// ==/UserScript==


(function() {
    'use strict';

    let lastVideoId = null;

    function getVideoId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
    }

    function selectOriginalAudio() {
        const currentVideoId = getVideoId();
        if (!currentVideoId || currentVideoId === lastVideoId) return; // Skip if no video or already processed
        lastVideoId = currentVideoId;

        const settingsButton = document.querySelector('button.ytp-settings-button');
        if (!settingsButton) {
            setTimeout(selectOriginalAudio, 1000); // Retry if player not loaded
            return;
        }

        settingsButton.click(); // Open settings menu
        setTimeout(() => {
            const menuItems = document.querySelectorAll('.ytp-menuitem');
            let audioTrackItem = null;
            for (let item of menuItems) {
                if (item.textContent.includes('Audiotrack')) {
                    audioTrackItem = item;
                    break;
                }
            }

            if (!audioTrackItem) {
                settingsButton.click(); // Close menu if no audio track option
                return;
            }

            audioTrackItem.click(); // Open audio track submenu
            setTimeout(() => {
                const trackItems = document.querySelectorAll('.ytp-settings-menu .ytp-menuitem');
                for (let track of trackItems) {
                    if (track.textContent.toLowerCase().includes('(original)')) {
                        track.click(); // Select original track
                        setTimeout(() => settingsButton.click(), 100); // Close menu
                        return;
                    }
                }
                settingsButton.click(); // Close if no original track found
            }, 200); // Delay for submenu to load
        }, 200); // Delay for main menu to load
    }

    // Run on video load or navigation
    window.addEventListener('yt-navigate-finish', () => {
        setTimeout(selectOriginalAudio, 2000); // Wait for player to initialize
    });

    // Initial run
    setTimeout(selectOriginalAudio, 2000);
})();