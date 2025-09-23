// ==UserScript==
// @name         AliExpress Price Per Piece Calculator
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Calculates and displays the price per piece on AliExpress product pages for products with PCS variations or fixed amounts.
// @author       @MakeNModify
// @match        https://*.aliexpress.com/item/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Function to extract number of pieces from text
    function extractPCS(text) {
        if (!text) return null;
        const lowerText = text.toLowerCase();
        // Match number followed by pcs, pieces, parts, or x (with optional space and optional trailing text)
        //const match = lowerText.match(/-?(\d+)\s*(pcs?|pieces?|parts?|x)/);
        //const match = lowerText.match(/(\d+)\s*(pcs?|pieces?|parts?|x)(?:\s+\S+)?/);
        const match = lowerText.match(/-?(\d+)\s*(pcs?|pieces?|parts?|x)(?:\s+\S+)?/);
        return match ? parseInt(match[1], 10) : null;
    }

    // Function to parse price from text (handles comma as decimal separator)
    function parsePrice(priceText) {
        if (!priceText) return null;
        // Extract numeric part, replace comma with dot
        const numMatch = priceText.match(/[\d,]+/);
        if (!numMatch) return null;
        const numStr = numMatch[0].replace(',', '.');
        const price = parseFloat(numStr);
        return isNaN(price) ? null : price;
    }

    // Function to get currency symbol
    function getCurrency(priceText) {
        const match = priceText.match(/[€$£¥]/);
        return match ? match[0] : '';
    }

    // Function to calculate and display price per piece
    function updatePricePerPiece() {
        let pcs = null;
        let priceEl = document.querySelector('.price-default--current--F8OlYIo');
        if (!priceEl) return; // No price element found

        const priceText = priceEl.textContent.trim();
        const price = parsePrice(priceText);
        const currency = getCurrency(priceText);
        if (!price) return;

        // First, check for variations
        const varElements = document.querySelectorAll('.sku-item--title--Z0HLO87');
        if (varElements.length > 0) {
            // Look for selected variation (check for 'selected' class or similar)
            for (let el of varElements) {
                if (el.closest('.sku-item--selected') || el.parentElement?.classList.contains('selected') || el.querySelector('.selected')) {
                    const innerSpan = el.querySelector('span > span');
                    if (innerSpan) {
                        const spanText = innerSpan.textContent.trim();
                        pcs = extractPCS(spanText);
                        if (pcs) break;
                    }
                }
            }
            // If no selected variation found, check all variations as fallback
            if (!pcs) {
                for (let el of varElements) {
                    const innerSpan = el.querySelector('span > span');
                    if (innerSpan) {
                        const spanText = innerSpan.textContent.trim();
                        pcs = extractPCS(spanText);
                        if (pcs) break;
                    }
                }
            }
        }

        // If no PCS from variations, check title
        if (!pcs) {
            const titleEl = document.querySelector('h1[data-pl="product-title"]');
            if (titleEl) {
                pcs = extractPCS(titleEl.textContent);
                // Handle ranges like "1-6PCS" by taking the first number (or average if needed)
                if (!pcs) {
                    const rangeMatch = titleEl.textContent.match(/(\d+)[-\s~]+(\d+)\s*(pcs?|pieces?|parts?|x)/i);
                    if (rangeMatch) {
                        pcs = Math.floor((parseInt(rangeMatch[1]) + parseInt(rangeMatch[2])) / 2); // Average for ranges
                    }
                }
            }
        }

        if (pcs && pcs > 0) {
            const perPiece = (price / pcs).toFixed(2);
            // Remove existing display if any
            const existingDisplay = priceEl.parentNode.querySelector('.price-per-piece');
            if (existingDisplay) {
                existingDisplay.remove();
            }
            // Create display element
            const display = document.createElement('span');
            display.className = 'price-per-piece';
            display.textContent = ` (${perPiece}${currency}/pcs)`;
            display.style.color = '#28a745';
            display.style.fontWeight = 'bold';
            display.style.marginLeft = '5px';
            priceEl.insertAdjacentElement('afterend', display);
        }
    }

    // Retry mechanism for delayed DOM loading
    function tryUpdateWithRetry(attempts = 5, delay = 500) {
        updatePricePerPiece();
        if (attempts > 0 && !document.querySelector('.price-per-piece')) {
            setTimeout(() => tryUpdateWithRetry(attempts - 1, delay), delay);
        }
    }

    // Run on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => tryUpdateWithRetry());
    } else {
        tryUpdateWithRetry();
    }

    // Observe for changes (for dynamic variation selection)
    const observer = new MutationObserver(function(mutations) {
        let shouldUpdate = false;
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' || mutation.type === 'attributes') {
                // Check if variations or price changed
                if (mutation.target && (mutation.target.querySelector &&
                    (mutation.target.querySelector('.sku-item--title--Z0HLO87') ||
                     mutation.target.matches('.price-default--current--F8OlYIo') ||
                     mutation.target.closest('[data-pl="product-title"]')))) {
                    shouldUpdate = true;
                }
            }
        });
        if (shouldUpdate) {
            // Small delay to let changes settle
            setTimeout(() => tryUpdateWithRetry(), 100);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });

    // Add click listeners to variation selectors
    const variationSelectors = document.querySelectorAll('.sku-item, [data-sku], [class*="sku-item"]');
    variationSelectors.forEach(function(selector) {
        selector.addEventListener('click', function() {
            setTimeout(() => tryUpdateWithRetry(), 300); // Delay for update
        });
    });

})();