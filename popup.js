document.addEventListener('DOMContentLoaded', () => {
  const openCompareBtn = document.getElementById('openCompare');
  const clearAllBtn = document.getElementById('clearAll');
  const itemCount = document.getElementById('itemCount');

  // פותח את compare.html בטאב חדש
  openCompareBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("compare.html") });
  });

  // מעדכן את מספר הפריטים
  chrome.storage.local.get({ compareItems: [] }, (result) => {
    const count = result.compareItems.length;
    itemCount.textContent = count > 0
      ? `נשמרו ${count} פריטים להשוואה`
      : "אין פריטים להשוואה עדיין";
  });

  // מוחק את כל הפריטים מההשוואה
  clearAllBtn.addEventListener('click', () => {
    chrome.storage.local.set({ compareItems: [] }, () => {
      itemCount.textContent = "אין פריטים להשוואה עדיין";
    });
  });
});