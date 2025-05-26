function addCompareButtons() {
    const posts = document.querySelectorAll('div.userContentWrapper');

    posts.forEach(post => {
        if (post.querySelector('.compare-btn')) return;

        const btn = document.createElement('button');
        btn.textContent = 'הוסף להשוואה';
        btn.className = 'compare-btn';
        btn.style.marginTop = '5px';
        btn.style.padding = '5px 10px';
        btn.style.backgroundColor = '#1877F2';
        btn.style.color = 'white';
        btn.style.border = 'none';
        btn.style.borderRadius = '4px';
        btn.style.cursor = 'pointer';

        post.appendChild(btn);

        btn.addEventListener('click', () => {
            const name = post.querySelector('h5, span')?.innerText || 'פוסט ללא כותרת';
            const description = post.querySelector('div[data-ad-preview]')?.innerText || '';
            const source = window.location.href;

            const item = { name, description, source };

            // שליפת הנתונים מ־chrome.storage.local
            chrome.storage.local.get({ compareItems: [] }, (result) => {
                const items = result.compareItems;

                // בדיקה אם הפריט כבר קיים
                const exists = items.some(i => i.name === item.name && i.source === item.source);
                if (!exists) {
                    items.push(item);
                    chrome.storage.local.set({ compareItems: items }, () => {
                        alert('הפריט נוסף להשוואה!');
                    });
                } else {
                    alert('הפריט כבר נמצא בהשוואה');
                }
            });
        });
    });
}

// הוספה מחודשת של כפתורים לפוסטים חדשים
setInterval(addCompareButtons, 3000);
