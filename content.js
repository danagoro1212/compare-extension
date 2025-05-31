// compare-extension.js - גרסה עם זיהוי שם כותב מדויק, קישור למסנג'ר, וקישור וואטסאפ רק אם יש טלפון

function initCompareExtension() {
    const observer = new MutationObserver(() => {
        addCompareButtons();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    function addCompareButtons() {
        const posts = document.querySelectorAll('div[role="article"]');

        posts.forEach(post => {
            if (post.querySelector('.compare-btn')) return;
            const iconBtn = document.createElement('img');
            try {
                iconBtn.src = chrome.runtime.getURL('icons/icon16.png');
            } catch (e) {
                console.error('לא ניתן לטעון אייקון ההשוואה:', e);
            }

            iconBtn.title = 'הוסף להשוואה';
            iconBtn.className = 'compare-btn';

            Object.assign(iconBtn.style, {
                width: '16px',
                height: '16px',
                marginRight: '6px',
                cursor: 'pointer',
                opacity: '0.75',
                display: 'inline-block',
                verticalAlign: 'middle',
                transition: 'opacity 0.2s ease'
            });

            iconBtn.addEventListener('mouseenter', () => iconBtn.style.opacity = '1');
            iconBtn.addEventListener('mouseleave', () => iconBtn.style.opacity = '0.75');

            const menuButton = post.querySelector('[aria-label][role="button"]');
            if (menuButton && menuButton.parentElement) {
                menuButton.parentElement.insertBefore(iconBtn, menuButton.nextSibling);
            } else {
                post.insertBefore(iconBtn, post.firstChild);
            }

            iconBtn.addEventListener('click', () => {
                const expanded = expandSeeMore(post);
                if (expanded) {
                    setTimeout(() => savePostData(post), 500);
                } else {
                    savePostData(post);
                }
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
        if (cleaned.startsWith('972')) {
            cleaned = '0' + cleaned.slice(3);
        }
        return cleaned;
    }

    function extractPhoneAndName(text) {
        const phoneRegex = /([\u0590-\u05FF\s\-]{0,20})?((?:\+972\-?|\b0)5[0-9\- ]{7,10})/g;
        let match;
        const results = [];

        while ((match = phoneRegex.exec(text)) !== null) {
            let namePart = match[1] ? match[1].trim() : '';
            let phonePart = match[2];
            namePart = namePart.replace(/(לפרטים|בפרטי|לוואצאפ|למספר|טלפון|פלאפון|מספר|מייל|סמס|:|,)/g, '').trim();
            phonePart = normalizePhone(phonePart);
            results.push({ phone: phonePart, name: namePart });
        }
        return results;
    }

    function extractDetails(text) {
        const addressRegex = /(?:ב(?:רחוב)?\s*)?([א-ת"׳'\- ]{2,30})\s*(\d{1,4})/;
        const addressMatch = text.match(addressRegex);
        const address = addressMatch ? `${addressMatch[1].trim()} ${addressMatch[2]}` : null;

        const priceMatch = text.match(/(?:שכ(?:\"|״)?ד|שכירות|מחיר|עלות)?[-\s:]*([\d]{3,6})(?:\s*₪|ש["']?ח|שח)?/i);
        let price = priceMatch && priceMatch[1] ? priceMatch[1].replace(/,/g, '').replace(/\.00$/, '') : null;

        const roomsMatch = text.match(/(\d+)\s*חדר(?:ים)?|חדר\s*אחד/);
        const rooms = roomsMatch ? (roomsMatch[1] || "1") : null;

        let entryDate = null;
        const entryMatch = text.match(/כניסה[:\s\-]*([0-9]{1,2}[\.\/]?[0-9]{1,2})/);
        if (entryMatch) {
            entryDate = entryMatch[1];
        } else if (/(פנוי(?:ה)?|זמין(?:ה)?)\s*מיידי(?:ת)?/i.test(text)) {
            entryDate = 'מיידי';
        }

        return { address, rooms, entryDate, price };
    }

    function extractMessengerId(url) {
        const idMatch = url.match(/profile\.php\?id=(\d{8,20})/);
        if (idMatch) return idMatch[1];

        const groupUserMatch = url.match(/groups\/\d+\/user\/(\d{8,20})/);
        if (groupUserMatch) return groupUserMatch[1];

        const usernameMatch = url.match(/facebook\.com\/([a-zA-Z0-9.\-]+)(?:[\/?]|$)/);
        if (usernameMatch && !usernameMatch[1].startsWith('profile.php')) return usernameMatch[1];

        return null;
    }

    function savePostData(post) {
        const name = post.querySelector('h5, strong')?.innerText || 'פוסט ללא כותרת';
        const description = post.querySelector('[data-ad-comet-preview="message"]')?.innerText || '';

        let authorName = 'לא ידוע';
        let authorProfile = window.location.href;

        const nameHeader = post.querySelector('h3');
        const nameSpan = nameHeader?.querySelector('span span');
        const profileLink = nameHeader?.querySelector('a[href*="facebook.com"]');

        if (profileLink?.href) {
            authorProfile = profileLink.href;
        }

        if (nameSpan?.textContent) {
            authorName = nameSpan.textContent.trim();
        }

        const messengerId = extractMessengerId(authorProfile);
        const messengerLink = messengerId ? `https://m.me/${messengerId}` : authorProfile;

        let postLink = '';
        const linkToPost = post.querySelector('a[href*="/posts/"], a[href*="/permalink/"], a[href*="/photos/"]');
        if (linkToPost && linkToPost.href) {
            postLink = linkToPost.href;
        }

        const phonesAndNames = extractPhoneAndName(description);
        let phone = '';
        let phoneName = '';
        if (phonesAndNames.length > 0) {
            phone = phonesAndNames[0].phone;
            phoneName = phonesAndNames[0].name;
        }

        const details = extractDetails(description);

        const newItem = {
            name,
            description,
            authorName,
            authorProfile: messengerLink,
            postLink,
            phone,
            phoneName,
            ...details,
            notes: '',
            addedAt: new Date().toISOString()
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
                    showToast('הפריט נוסף להשוואה!');
                    console.log('נשמר:', newItem);
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
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#333',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '5px',
            zIndex: 10000,
            opacity: '0.9',
            fontSize: '14px',
            fontWeight: 'bold',
            fontFamily: 'Arial, sans-serif',
            userSelect: 'none',
            pointerEvents: 'none'
        });
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

initCompareExtension();
