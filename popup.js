document.addEventListener('DOMContentLoaded', () => {
    const openCompareBtn = document.getElementById('openCompare');

    openCompareBtn.addEventListener('click', () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("compare.html") });
    });
});
