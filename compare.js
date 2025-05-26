document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#compareTable tbody');
    const clearBtn = document.getElementById('clearBtn');
    const refreshBtn = document.getElementById('refreshBtn');

    function loadItems() {
        chrome.storage.local.get({ compareItems: [] }, (result) => {
            renderTable(result.compareItems);
        });
    }

    function renderTable(items) {
        tableBody.innerHTML = '';

        if (items.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 8; // צריך לכסות את כל העמודות
            emptyCell.textContent = 'אין פריטים להשוואה';
            emptyRow.appendChild(emptyCell);
            tableBody.appendChild(emptyRow);
            return;
        }

        items.forEach((item, index) => {
            const row = document.createElement('tr');

            // שם הפריט
            const nameCell = document.createElement('td');
            nameCell.textContent = item.name || '';
            row.appendChild(nameCell);

            // תיאור
            const descCell = document.createElement('td');
            descCell.textContent = item.description || '';
            row.appendChild(descCell);

            // שם הכותב
            const authorNameCell = document.createElement('td');
            authorNameCell.textContent = item.authorName || '';
            row.appendChild(authorNameCell);

            // קישור לפרופיל
            const authorProfileCell = document.createElement('td');
            if (item.authorProfile) {
                const link = document.createElement('a');
                link.href = item.authorProfile;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = 'פרופיל';
                authorProfileCell.appendChild(link);
            }
            row.appendChild(authorProfileCell);

            // קישור לפוסט
            const postLinkCell = document.createElement('td');
            if (item.postLink) {
                const link = document.createElement('a');
                link.href = item.postLink;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = 'פוסט';
                postLinkCell.appendChild(link);
            }
            row.appendChild(postLinkCell);

            // טלפון
            const phoneCell = document.createElement('td');
            phoneCell.textContent = item.phone || '';
            row.appendChild(phoneCell);

            // שם ליד הטלפון
            const phoneNameCell = document.createElement('td');
            phoneNameCell.textContent = item.phoneName || '';
            row.appendChild(phoneNameCell);

            // כפתור מחיקה
            const deleteCell = document.createElement('td');
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.dataset.index = index;
            deleteBtn.textContent = 'מחק';
            deleteCell.appendChild(deleteBtn);
            row.appendChild(deleteCell);

            tableBody.appendChild(row);
        });
    }

    // מאזין למחיקה אחד על tbody
    tableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const index = parseInt(e.target.dataset.index);
            deleteItem(index);
        }
    });

    function deleteItem(index) {
        chrome.storage.local.get({ compareItems: [] }, (result) => {
            const items = result.compareItems;
            items.splice(index, 1);
            chrome.storage.local.set({ compareItems: items }, () => {
                loadItems();
            });
        });
    }

    clearBtn.addEventListener('click', () => {
        if (confirm('למחוק את כל הפריטים?')) {
            chrome.storage.local.set({ compareItems: [] }, () => {
                loadItems();
            });
        }
    });

    refreshBtn.addEventListener('click', loadItems);

    loadItems();
});
