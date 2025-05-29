// Toast notification utility
function showToast(message) {
    let toast = document.getElementById('compare-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'compare-toast';
        toast.style.position = 'fixed';
        toast.style.bottom = '30px';
        toast.style.left = '50%';
        toast.style.transform = 'translateX(-50%)';
        toast.style.background = '#1877F2';
        toast.style.color = 'white';
        toast.style.padding = '10px 20px';
        toast.style.borderRadius = '6px';
        toast.style.zIndex = 9999;
        toast.style.fontSize = '16px';
        toast.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2000);
}

function createCompareButton() {
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
    return btn;
}

function handleCompareClick(post) {
    const name = post.querySelector('h5, span')?.innerText || 'פוסט ללא כותרת';
    const description = post.querySelector('div[data-ad-preview]')?.innerText || '';
    const source = window.location.href;

    const item = { name, description, source };

    chrome.storage.local.get({ compareItems: [] }, (result) => {
        if (chrome.runtime.lastError) {
            showToast('שגיאה בגישה לאחסון');
            return;
        }
        const items = result.compareItems;
        const exists = items.some(i => i.name === item.name && i.source === item.source);
        if (!exists) {
            items.push(item);
            chrome.storage.local.set({ compareItems: items }, () => {
                if (chrome.runtime.lastError) {
                    showToast('שגיאה בשמירת פריט');
                } else {
                    showToast('הפריט נוסף להשוואה!');
                }
            });
        } else {
            showToast('הפריט כבר נמצא בהשוואה');
        }
    });
}

function addCompareButtonsToPosts(posts) {
    posts.forEach(post => {
        if (post.querySelector('.compare-btn')) return;
        const btn = createCompareButton();
        btn.addEventListener('click', () => handleCompareClick(post));
        post.appendChild(btn);
    });
}

function observePosts() {
    const observer = new MutationObserver(() => {
        const posts = document.querySelectorAll('div.userContentWrapper');
        addCompareButtonsToPosts(posts);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    // Initial run for already loaded posts
    const posts = document.querySelectorAll('div.userContentWrapper');
    addCompareButtonsToPosts(posts);
}

observePosts();
