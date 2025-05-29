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

            // מיקום הכפתור אחרי כפתור התפריט אם קיים, אחרת בתחילת הפוסט
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
        // מחפש טלפון ישראלי עם קידומת +972 או 0, ונותן שם קודם לפני הטלפון אם קיים
        const phoneRegex = /([\u0590-\u05FF\s\-]{0,20})?(\+972|0)5[\s\-]?\d{1}[\s\-]?\d{6,7}/g;
        let match;
        const results = [];

        while ((match = phoneRegex.exec(text)) !== null) {
            let namePart = match[1] ? match[1].trim() : '';
            let phonePart = match[2] + text.substr(match.index + match[0].indexOf(match[2]) + match[2].length, 8);
            // ניקוי מילים לא רצויות מהשם
            namePart = namePart.replace(/(לפרטים|בפרטי|לוואצאפ|למספר|טלפון|פלאפון|מספר|מייל|סמס|:|,)/g, '').trim();
            phonePart = normalizePhone(phonePart);
            results.push({ phone: phonePart, name: namePart });
        }
        return results;
    }

    function extractDetails(text) {
        // מחפש כתובת - שילוב רחוב ומספר (אפשר לשפר בהתאם)
        const addressMatch = text.match(/(?:ברח[ו'"]?\s*|ברחוב\s*|ב)?([א-ת"׳'\- ]+\d{1,4}(?:\s*פינת\s*[א-ת"׳'\- ]+)?|[א-ת"׳'\- ]+\d{1,4})/);
        const address = addressMatch ? addressMatch[1].trim() : null;

        // מחפש מחיר בשקלים
        const priceMatch = text.match(/(?:שכ(?:\"|״)?ד|שכירות|מחיר|עלות)?[-\s:]*([\d,\.]{3,7})\s*(?:₪|ש["']?ח|שח)?/i);
        let price = priceMatch && priceMatch[1] ? priceMatch[1].replace(/,/g, '').replace(/\.00$/, '') : null;

        // מספר חדרים - תמיכה גם ב"חדר אחד"
        const roomsMatch = text.match(/(\d+)\s*חדר(?:ים)?|חדר\s*אחד/);
        const rooms = roomsMatch ? (roomsMatch[1] || "1") : null;

        // תאריך כניסה
        let entryDate = null;
        const entryMatch = text.match(/כניסה[:\s\-]*([0-9]{1,2}[\.\/][0-9]{1,2})/);
        if (entryMatch) {
            entryDate = entryMatch[1];
        } else if (/(פנוי(?:ה)?|זמין(?:ה)?)\s*מיידי(?:ת)?/i.test(text)) {
            entryDate = 'מיידי';
        }

        return { address, rooms, entryDate, price };
    }

    function savePostData(post) {
        // שם הפוסט - לוקח רק h5 או strong בכותרות
        const name = post.querySelector('h5, strong')?.innerText || 'פוסט ללא כותרת';
        const description = post.querySelector('[data-ad-comet-preview="message"]')?.innerText || '';

        let authorProfile = window.location.href;
        let authorName = 'לא ידוע';

        const profileLink = post.querySelector('a[href*="facebook.com"]:not([href*="/posts/"]):not([href*="/photos/"]):not([href*="/permalink/"])');
        if (profileLink && profileLink.href) {
            authorProfile = profileLink.href;
            authorName = profileLink.innerText?.trim() || authorName;
        }

        let postLink = '';
        const linkToPost = post.querySelector('a[href*="/posts/"], a[href*="/permalink/"], a[href*="/photos/"]');
        if (linkToPost && linkToPost.href) {
            postLink = linkToPost.href;
        }

        // חילוץ טלפונים ושמות
        const phonesAndNames = extractPhoneAndName(description);
        let phone = '';
        let phoneName = '';
        if (phonesAndNames.length > 0) {
            phone = phonesAndNames[0].phone;
            phoneName = phonesAndNames[0].name;
        }

        // חילוץ פרטים נוספים
        const details = extractDetails(description);

        const newItem = {
            name,
            description,
            authorName,
            authorProfile,
            postLink,
            phone,
            phoneName,
            ...details,
            addedAt: new Date().toISOString()
        };

        chrome.storage.local.get({ compareItems: [] }, (result) => {
            const items = result.compareItems;
            // השוואה נירמלת לטלפונים
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

    // פונקציית Toast קטנה לאינפורמציה לא פולשנית
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
            pointerEvents: 'none',
        });
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // פונקציית ייצוא ל-CSV (Excel)
    window.exportToExcel = function () {
        chrome.storage.local.get({ compareItems: [] }, (result) => {
            const items = result.compareItems;
            if (items.length === 0) {
                showToast("אין פריטים לייצוא.");
                return;
            }

            const headers = Object.keys(items[0]);
            const rows = items.map(item => headers.map(h => item[h] ?? ''));

            let csvContent = 'data:text/csv;charset=utf-8,';
            csvContent += headers.join(',') + '\n';
            rows.forEach(row => {
                csvContent += row.map(cell => `"${cell.toString().replace(/"/g, '""')}"`).join(',') + '\n';
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', 'compare_items.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };
}

// אתחול מיד
initCompareExtension();
