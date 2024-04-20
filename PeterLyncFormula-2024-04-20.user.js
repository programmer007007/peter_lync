// ==UserScript==
// @name         PeterLynchFormula
// @namespace    http://tampermonkey.net/
// @version      v1
// @description  Checks to see if the stock if undervalued/overvalued/fairlyvalued using peter lynch formula on yahoo finances site.
// @author       Johnson
// @match        https://finance.yahoo.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=yahoo.com
// @grant        none
// @license      GPL-3.0-or-later; https://www.gnu.org/licenses/gpl-3.0.txt
// ==/UserScript==

(function() {
    'use strict';
    function getInfoBySpanText(text_to_find){
        // Get all span elements
        const spans = document.querySelectorAll('span');

        // Loop through each span element
        for (const span of spans) {
            // Check if the span's text content includes the specified text
            if (span.textContent.includes(text_to_find)) {
                // If found, get the next element
                const nextElement = span.nextElementSibling;
                if (nextElement) {
                    // Return the text content of the next element
                    return nextElement.textContent.trim();
                }
            }
        }
    }

    function getInfoByTdText(text_to_find){
        // Get all td elements
        const tds = document.querySelectorAll('td');

        // Loop through each td element
        for (const td of tds) {
            // Check if the td's text content includes the specified text
            if (td.textContent.includes(text_to_find)) {
                // If found, get the next element
                const nextElement = td.nextElementSibling;
                if (nextElement) {
                    // Return the text content of the next element
                    return nextElement.textContent.trim();
                }
            }
        }
    }

    function getTickerName(){
        const h1Element = document.querySelector('h1.svelte-ufs8hf');
        if (h1Element) {
            const textContent = h1Element.textContent.trim();
            const match = textContent.match(/\((.*?)\)/);
            const textInParentheses = match ? match[1] : null;
            if (textInParentheses) {
                return textInParentheses;
            } else {
                console.error('h1 element not found');
            }
        }
    }


    function updateStockData(tickerData) {
        // Retrieve existing data from localStorage
        let existingData = localStorage.getItem('stock_data');

        // Parse existing data or initialize an empty object if it doesn't exist
        existingData = existingData ? JSON.parse(existingData) : {};

        // Loop through the tickerData object
        for (const ticker in tickerData) {
            if (tickerData.hasOwnProperty(ticker)) {
                const newData = tickerData[ticker];
                // Check if the ticker already exists in the existing data
                if (existingData.hasOwnProperty(ticker)) {
                    // If it exists, update the data
                    for (const key in newData) {
                        if (newData.hasOwnProperty(key) && newData[key] !== undefined) {
                            existingData[ticker][key] = newData[key];
                        }
                    }
                } else {
                    // If it doesn't exist, add it to the existing data
                    existingData[ticker] = newData;
                }
            }
        }

        // Store updated data in localStorage
        localStorage.setItem('stock_data', JSON.stringify(existingData));
    }

    function evaluateStock(ticker_name) {
        // Retrieve data from localStorage
        const stockData = localStorage.getItem('stock_data');
        if (!stockData) {
            //alert('Stock data not found in localStorage.');
            return;
        }

        const parsedData = JSON.parse(stockData);
        if (!parsedData.hasOwnProperty(ticker_name)) {
            //alert(`Stock data for ${ticker_name} not found.`);
            return;
        }

        const stockInfo = parsedData[ticker_name];

        const forwardGrowth = parseFloat(stockInfo['ForwardGrowth']);
        const dividendYield = parseFloat(stockInfo['DividendYield']);
        const peRatio = parseFloat(stockInfo['PE_RATIO']);
       
        if (isNaN(forwardGrowth) || isNaN(dividendYield) || isNaN(peRatio)) {
            //alert('Some of the required data is missing. Cannot perform calculation.');
            return;
        }

        // Calculate the value
        const value = (forwardGrowth + dividendYield) / peRatio;

        // Classify the stock based on the value
        let classification;
        if (value < 1) {
            classification = 'Overvalued';
        } else if (value >= 1 && value <= 1.5) {
            classification = 'Fairly Valued';
        } else if (value > 1.5 && value <= 2) {
            classification = 'Undervalued';
        } else {
            classification = 'Very Undervalued';
        }       
        alert(`Stock: ${ticker_name}\nClassification: ${classification}`);
    }
    function cleanData(data) {
        if(data){         
            const match = data.match(/\((.*?)\)/);
            const cleanedData = match ? match[1] : data;           
            return cleanedData.replace('%', '');
        }else{
            return data;
        }
    }

    let ticker_name = getTickerName();
    console.log(ticker_name);
    let fdy = getInfoBySpanText('Forward Dividend & Yield');
    let fgrwth = getInfoByTdText('Next 5 Years (per annum)');
    let pe_ratio = getInfoBySpanText('PE Ratio (TTM)');
    // Store data in localStorage as JSON   
    if(ticker_name){
        const dataToStore = {
            [ticker_name]:{
                'ForwardGrowth': cleanData(fgrwth),
                'DividendYield': cleanData(fdy),
                'PE_RATIO': cleanData(pe_ratio),
            }
        };
        updateStockData(dataToStore);
        evaluateStock(ticker_name);
    }

})();
