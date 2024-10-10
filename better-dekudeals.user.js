// ==UserScript==
// @name         Better DekuDeals (VN)
// @namespace    https://github.com/redphx
// @version      1.0
// @description  QoL features for DekuDeals
// @author       redphx
// @match        https://www.dekudeals.com/*
// @run-at       document-end
// @grant        none
// @downloadURL  https://github.com/redphx/better-dekudeals-vn/raw/refs/heads/main/better-dekudeals.user.js
// ==/UserScript==
'use strict';

const USD_TO_VND_RATE = 24500;

async function getPrice(market, productId) {
    const url = `https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=${productId}&market=${market}&languages=en-US&fieldsTemplate=browse`;

    const json = await (await fetch(url)).json();
    const products = json.Products;
    if (products.length === 0) {
        return null;
    }

    try {
        const price = products[0].DisplaySkuAvailabilities[0].Availabilities[0].OrderManagementData.Price;
        return {
            msrp: price.MSRP,
            discounted: price.ListPrice,
        };
    } catch (e) {
        console.error('Couldn\'t get price');
        return null;
    }
}


async function getVnPrices() {
    if (!window.location.pathname.startsWith('/items/')) {
        return;
    }

    const $table = document.querySelector('table.item-price-table');
    const $price = $table.querySelector('a[data-out-analytics-id^=microsoft]');
    const match = /microsoft_\w+:([^:]+)/.exec($price.getAttribute('data-out-analytics-id'));
    const productId = match[1];

    const vnPrice = await getPrice('VN', productId);
    if (!vnPrice || vnPrice.msrp === 0) {
        const $div = document.createElement('div');
        $div.innerHTML = `<p style="color:red">NOT AVAILABLE IN VIETNAM!</p>`;

        $table.insertAdjacentElement('beforebegin', $div);
    } else {
        const usPrice = await getPrice('US', productId);

        const price = vnPrice.discounted || vnPrice.msrp;
        const convertedPrice = parseFloat((price / USD_TO_VND_RATE).toFixed(2));

        const $button = document.createElement('a');
        $button.href = `https://www.xbox.com/vi-VN/games/store/wanted-dead/` + productId;
        $button.target = '_blank';
        $button.rel = 'nofollow noopener';

        $button.style.backgroundColor = 'green';
        $button.style.color = 'white';
        $button.style.display = 'block';

        if (vnPrice.discounted) {
            const saved = (100 - (convertedPrice / usPrice.msrp * 100)).toFixed(2);
            $button.innerHTML = `<p>VN: ${vnPrice.discounted.toLocaleString()} VND (${convertedPrice} USD, ${saved}% off)</p>`;
        } else {
            $button.innerHTML = `<p>VN: ${vnPrice.discounted.toLocaleString()} VND (${convertedPrice} USD)</p>`;
        }

        $table.insertAdjacentElement('beforebegin', $button);
        console.log(usPrice, vnPrice)
    }
}


const $hiddenButtons = document.querySelectorAll('form.watch-form > button.watched.hide');
$hiddenButtons && $hiddenButtons.forEach($btn => {
    const $cell = $btn.closest('.cell');
    $cell && ($cell.style.opacity = '0.2');
});

await getVnPrices();
