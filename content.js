function addCompareButtons() {
    const posts = document.querySelectorAll('div[role="article"]');

    posts.forEach(post => {
        if (post.querySelector('.compare-btn')) return;

        const iconBtn = document.createElement('img');
        iconBtn.src = chrome.runtime.getURL('icons/icon16.png');
        iconBtn.title = 'הוסף להשוואה';
        iconBtn.className = 'compare-btn';

        iconBtn.style.width = '16px';
        iconBtn.style.height = '16px';
        iconBtn.style.marginRight = '6px';
        iconBtn.style.cursor = 'pointer';
        iconBtn.style.opacity = '0.75';
        iconBtn.style.display = 'inline-block';
        iconBtn.style.verticalAlign = 'middle';
        iconBtn.style.transition = 'opacity 0.2s ease';

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
                setTimeout(() => {
                    savePostData(post);
                }, 500);
            } else {
                savePostData(post);
            }
        });
    });
}

function expandSeeMore(post) {
    const buttons = post.querySelectorAll('div[role="button"]');
    for (const btn of buttons) {
        if (btn.innerText.trim() === 'ראה עוד') {
            btn.click();
            return true;
        }
    }
    return false;
}

// פונקציה חדשה לניתוח טלפון ושם מהטקסט
function extractPhoneAndName(text) {
    // ביטוי רגולרי למציאת טלפון ישראלי (קידומת +972 או 0), ולקחת עד 20 תווים לפני המספר כ"שם"
    const phoneRegex = /([\u0590-\u05FF\s\-]{0,20})?(\+972|0)5\d{8}/g;

    let match;
    const results = [];

    while ((match = phoneRegex.exec(text)) !== null) {
        let namePart = match[1] ? match[1].trim() : '';
        let phonePart = match[2] + text.substr(match.index + match[0].indexOf(match[2]) + match[2].length, 9);

        // ניקוי מילים מיותרות מהשם שמופיע לפני המספר (ניתן להוסיף עוד מילים לפי הצורך)
        namePart = namePart.replace(/(לפרטים|בפרטי|לוואצאפ|למספר|טלפון|פלאפון|מספר|מייל|סמס|:|,)/g, '').trim();

        results.push({ phone: phonePart, name: namePart });
    }
    return results;
}

function savePostData(post) {
    const name = post.querySelector('strong, h5, span')?.innerText || 'פוסט ללא כותרת';
    const description = post.querySelector('[data-ad-comet-preview="message"]')?.innerText || '';

    let authorProfile = window.location.href;
    let authorName = 'לא ידוע';
    let postLink = authorProfile;

    try {
        const profileLink = post.querySelector(
            'a[href*="facebook.com"]:not([href*="/posts/"]):not([href*="/photos/"]):not([href*="/permalink/"])'
        );
        if (profileLink && profileLink.href) {
            authorProfile = profileLink.href;
            authorName = profileLink.innerText?.trim() || authorName;
        }
    } catch (e) {
        console.warn('שגיאה באחזור קישור לפרופיל:', e);
    }

    try {
        const linkToPost = post.querySelector('a[href*="/posts/"], a[href*="/permalink/"], a[href*="/photos/"]');
        if (linkToPost && linkToPost.href) {
            postLink = linkToPost.href;
        }
    } catch (e) {
        console.warn('שגיאה באחזור קישור לפוסט:', e);
    }

    // חיפוש טלפון ושם מתוך התיאור
    const phonesAndNames = extractPhoneAndName(description);
    let phone = '';
    let phoneName = '';
    if (phonesAndNames.length > 0) {
        phone = phonesAndNames[0].phone;
        phoneName = phonesAndNames[0].name;
    }

    const newItem = {
        name,
        description,
        authorName,
        authorProfile,
        postLink,
        phone,
        phoneName
    };

    chrome.storage.local.get({ compareItems: [] }, (result) => {
        const items = result.compareItems;
        const exists = items.some(i => i.name === newItem.name && i.postLink === newItem.postLink && i.phone === newItem.phone);
        if (!exists) {
            items.push(newItem);
            chrome.storage.local.set({ compareItems: items }, () => {
                alert('הפריט נוסף להשוואה!');
                console.log('נשמר:', newItem);
            });
        } else {
            alert('הפריט כבר קיים בהשוואה.');
        }
    });
}

setInterval(addCompareButtons, 3000);
