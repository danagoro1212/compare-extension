// content.js - גרסה עם NER+REGEX והדפסות ל־DevTools כולל confidences

function waitForPostsThenInit() {
    const check = setInterval(() => {
        if (document.querySelector('div[role="article"]')) {
            clearInterval(check);
            initCompareExtension();
        }
    }, 500);
}

waitForPostsThenInit();

function initCompareExtension() {
    const observer = new MutationObserver(() => addCompareButtons());
    observer.observe(document.body, { childList: true, subtree: true });

    function addCompareButtons() {
        const posts = document.querySelectorAll('div[role="article"]');
        posts.forEach(post => {
            if (post.querySelector('.compare-btn')) return;
            const iconBtn = document.createElement('img');
            try {
                if (chrome?.runtime?.getURL) {
                    iconBtn.src = chrome.runtime.getURL('icons/icon16.png');
                }
            } catch (e) {
                console.error('אייקון השוואה נכשל:', e);
            }
            iconBtn.title = 'הוסף להשוואה';
            iconBtn.className = 'compare-btn';
            Object.assign(iconBtn.style, {
                width: '16px', height: '16px', marginRight: '6px',
                cursor: 'pointer', opacity: '0.75', display: 'inline-block',
                verticalAlign: 'middle', transition: 'opacity 0.2s ease'
            });
            iconBtn.addEventListener('mouseenter', () => iconBtn.style.opacity = '1');
            iconBtn.addEventListener('mouseleave', () => iconBtn.style.opacity = '0.75');

            const menuButton = post.querySelector('[aria-label][role="button"]');
            if (menuButton?.parentElement) {
                menuButton.parentElement.insertBefore(iconBtn, menuButton.nextSibling);
            } else {
                post.insertBefore(iconBtn, post.firstChild);
            }

            iconBtn.addEventListener('click', () => {
                const expanded = expandSeeMore(post);
                setTimeout(() => savePostData(post), expanded ? 500 : 0);
            });
        });
    }

    function expandSeeMore(post) {
        const buttons = post.querySelectorAll('div[role="button"]');
        for (const btn of buttons) {
            const text = btn.innerText.trim();
            if (text === 'ראה עוד' || text.toLowerCase() === 'see more') {
                btn.click();
                return true;
            }
        }
        return false;
    }

    function normalizePhone(phone) {
        let cleaned = phone.replace(/\D/g, '');
        return cleaned.startsWith('972') ? '0' + cleaned.slice(3) : cleaned;
    }

    function extractPhoneAndName(text) {
        const phoneRegex = /([\u0590-\u05FF\s\-]{0,20})?((?:\+972\-?|\b0)5[0-9\- ]{7,10})/g;
        let match, results = [];
        while ((match = phoneRegex.exec(text)) !== null) {
            let namePart = (match[1] || '').replace(/(לפרטים|בפרטי|וואטסאפ|טלפון|מספר|:|,)/g, '').trim();
            let phonePart = normalizePhone(match[2]);
            results.push({ phone: phonePart, name: namePart });
        }
        return results;
    }

    async function extractDetails(text) {
        console.log('%c[POST TEXT]:', 'color: #0a0; font-weight: bold;', text);
        let nerData = {};
        try {
            const res = await fetch('http://127.0.0.1:5005/extract', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });
            nerData = await res.json();
            console.log('%c[NER RAW]:', 'color: teal;', nerData.debug_entities || []);
            console.log('%c[NER PARSED]:', 'color: #00f;', nerData);
        } catch (e) {
            console.warn('[NER fallback]:', e);
        }

        let addressSource = 'NER';
        let address = nerData.address_or_location?.[0] || null;
        const addressRegex = /(?:ב(?:רחוב|שכונה)?\s*)?([א-ת"׳'\-]{2,25})[\s,]*(\d{1,4})?/;
        if (!address) {
            const m = text.match(addressRegex);
            address = m ? `${m[1].trim()}${m[2] ? ' ' + m[2] : ''}` : null;
            addressSource = address ? 'Regex' : 'None';
        }

        let priceSource = 'NER';
        let price = nerData.rent_or_money?.[0]?.replace(/[^\d]/g, '') || null;
        if (price && (+price < 900 || +price > 10000)) price = null;

        const priceRegex = /(?:שכ(?:"|״)?(?:ד)?|שכירות|מחיר|עלות)?\s*[:\-]?\s*([\d,.]{3,7})\s*(?:₪|ש["']?ח|שח)?/i;
        if (!price) {
            const m = text.match(priceRegex);
            if (m && +m[1].replace(/[^\d]/g, '') >= 900 && +m[1].replace(/[^\d]/g, '') <= 10000) {
                price = m[1].replace(/[^\d]/g, '');
                priceSource = 'Regex';
            } else {
                priceSource = 'None';
            }
        }

        const roomsMatch = text.match(/(\d+)\s*חדר(?:ים)?|חדר\s*אחד/);
        const rooms = roomsMatch ? (roomsMatch[1] || '1') : null;

        let entryDate = null;
        const entryMatch = text.match(/כניסה[:\s\-]*([0-9]{1,2}[\.\/]?[0-9]{1,2})/);
        if (entryMatch) entryDate = entryMatch[1];
        else if (/(פנוי(?:ה)?|זמין(?:ה)?)\s*מיידי(?:ת)?/i.test(text)) entryDate = 'מיידי';

        console.log(`[FINAL] Address: ${address} (${addressSource}), Price: ${price} (${priceSource})`);
        return { address, rooms, entryDate, price };
    }

    function extractMessengerId(url) {
        const idMatch = url.match(/profile\.php\?id=(\d{8,20})/);
        const groupMatch = url.match(/groups\/\d+\/user\/(\d{8,20})/);
        const userMatch = url.match(/facebook\.com\/([a-zA-Z0-9.\-]+)(?:[\/?]|$)/);
        return idMatch?.[1] || groupMatch?.[1] || (userMatch && !userMatch[1].startsWith('profile.php') ? userMatch[1] : null);
    }

    async function savePostData(post) {
        const name = post.querySelector('h5, strong')?.innerText || 'פוסט ללא כותרת';
        const description = post.querySelector('[data-ad-comet-preview="message"]')?.innerText || '';

        let authorName = 'לא ידוע';
        let authorProfile = window.location.href;
        const nameHeader = post.querySelector('h3');
        const nameSpan = nameHeader?.querySelector('span span');
        const profileLink = nameHeader?.querySelector('a[href*="facebook.com"]');
        if (profileLink?.href) authorProfile = profileLink.href;
        if (nameSpan?.textContent) authorName = nameSpan.textContent.trim();

        const messengerId = extractMessengerId(authorProfile);
        const messengerLink = messengerId ? `https://m.me/${messengerId}` : authorProfile;

        let postLink = '';
        const linkToPost = post.querySelector('a[href*="/posts/"], a[href*="/permalink/"], a[href*="/photos/"]');
        if (linkToPost?.href) postLink = linkToPost.href;

        const phonesAndNames = extractPhoneAndName(description);
        const phone = phonesAndNames[0]?.phone || '';
        const phoneName = phonesAndNames[0]?.name || '';

        const details = await extractDetails(description);

        const newItem = {
            name, authorName, authorProfile: messengerLink,
            postLink, phone, phoneName, ...details,
            notes: '', addedAt: new Date().toISOString()
        };

        chrome.storage.local.get({ compareItems: [] }, (result) => {
            const items = result.compareItems;
            const exists = items.some(i =>
                i.name === newItem.name &&
                i.postLink === newItem.postLink &&
                normalizePhone(i.phone) === normalizePhone(newItem.phone)
            );
            if (!exists) {
                items.push(newItem);
                chrome.storage.local.set({ compareItems: items }, () => {
                    console.log('%c[SAVED]:', 'color: green;', newItem);
                    showToast('הפריט נוסף להשוואה!');
                });
            } else {
                showToast('הפריט כבר קיים בהשוואה.');
            }
        });
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.innerText = message;
        Object.assign(toast.style, {
            position: 'fixed', bottom: '20px', right: '20px',
            backgroundColor: '#333', color: '#fff', padding: '10px 20px',
            borderRadius: '5px', zIndex: 10000, opacity: '0.9',
            fontSize: '14px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif',
            userSelect: 'none', pointerEvents: 'none'
        });
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}
