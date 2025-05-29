document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.querySelector('#compareTable tbody');
    const clearBtn = document.getElementById('clearBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const tableHeaders = document.querySelectorAll('#compareTable thead th');

    let items = [];
    let filterText = '';
    let sortColumn = null;
    let sortDirection = 'asc';

    // יצירת שדה חיפוש אחד בלבד מעל הטבלה
    const filterInput = document.createElement('input');
    filterInput.type = 'search';
    filterInput.placeholder = 'חפש בתיאור או שם...';
    filterInput.style.marginBottom = '10px';
    filterInput.style.width = '100%';
    filterInput.style.padding = '6px';
    document.querySelector('body').insertBefore(filterInput, document.querySelector('#compareTable'));

    filterInput.addEventListener('input', (e) => {
        filterText = e.target.value.trim();
        applyFilterAndSort();
    });

    // הגדרת מיון בכותרות הטבלה
    tableHeaders.forEach((th, index) => {
        if (index < 9) { // להתאים לעמודות הרלוונטיות
            th.style.cursor = 'pointer';
            th.addEventListener('click', () => {
                if (sortColumn === index) {
                    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
                } else {
                    sortColumn = index;
                    sortDirection = 'asc';
                }
                updateSortIndicators();
                applyFilterAndSort();
            });
        }
    });

    function updateSortIndicators() {
        tableHeaders.forEach((th, idx) => {
            th.textContent = th.textContent.replace(/ ▲| ▼/g, '');
            if (idx === sortColumn) {
                th.textContent += sortDirection === 'asc' ? ' ▲' : ' ▼';
                th.style.backgroundColor = '#d0d0ff';
            } else {
                th.style.backgroundColor = '#f0f0f0';
            }
        });
    }

    function applyFilterAndSort() {
        let filtered = items;

        if (filterText) {
            const lowerFilter = filterText.toLowerCase();
            filtered = filtered.filter(item =>
                (item.description && item.description.toLowerCase().includes(lowerFilter)) ||
                (item.authorName && item.authorName.toLowerCase().includes(lowerFilter))
            );
        }

        if (sortColumn !== null) {
            filtered.sort((a, b) => {
                let valA, valB;
                switch (sortColumn) {
                    case 0:
                        valA = items.indexOf(a);
                        valB = items.indexOf(b);
                        break;
                    case 1:
                        valA = a.description || '';
                        valB = b.description || '';
                        break;
                    case 2:
                        valA = a.authorName || '';
                        valB = b.authorName || '';
                        break;
                    case 7:
                        valA = a.address || '';
                        valB = b.address || '';
                        break;
                    case 8:
                        valA = parseFloat((a.price || '').toString().replace(/[^0-9.\-]/g, '')) || 0;
                        valB = parseFloat((b.price || '').toString().replace(/[^0-9.\-]/g, '')) || 0;
                        break;
                    default:
                        valA = '';
                        valB = '';
                }

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortDirection === 'asc' ? valA - valB : valB - valA;
                } else {
                    valA = valA.toString().toLowerCase();
                    valB = valB.toString().toLowerCase();
                    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                    return 0;
                }
            });
        }

        renderTable(filtered);
    }

    function renderTable(itemsToRender) {
        tableBody.innerHTML = '';

        if (itemsToRender.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = 11;
            emptyCell.textContent = 'אין פריטים להשוואה';
            emptyRow.appendChild(emptyCell);
            tableBody.appendChild(emptyRow);
            return;
        }

        itemsToRender.forEach((item, index) => {
            const row = document.createElement('tr');

            row.appendChild(createCell((index + 1).toString()));
            row.appendChild(createCell(item.description || ''));
            row.appendChild(createCell(item.authorName || ''));

            if (item.authorProfile) {
                const profileLink = document.createElement('a');
                profileLink.href = item.authorProfile;
                profileLink.target = '_blank';
                profileLink.rel = 'noopener noreferrer';
                profileLink.textContent = 'קישור לפרופיל';
                row.appendChild(createCell(profileLink, true));
            } else {
                row.appendChild(createCell('-'));
            }

            if (item.postLink) {
                const postLink = document.createElement('a');
                postLink.href = item.postLink;
                postLink.target = '_blank';
                postLink.rel = 'noopener noreferrer';
                postLink.textContent = 'קישור לפוסט';
                row.appendChild(createCell(postLink, true));
            } else {
                row.appendChild(createCell('-'));
            }

            row.appendChild(createCell(item.phone || ''));
            row.appendChild(createCell(item.phoneName || ''));
            row.appendChild(createCell(item.address || ''));
            row.appendChild(createCell(item.price || ''));

            const whatsappCell = document.createElement('td');
            if (item.phone) {
                let phoneDigits = item.phone.replace(/\D/g, '');
                if (phoneDigits.startsWith('0')) {
                    phoneDigits = '972' + phoneDigits.slice(1);
                }
                const greetingName = item.phoneName ? item.phoneName.trim() : '';
                const message = greetingName
                    ? `היי ${greetingName},\nראיתי שפירסמת בנוגע לדירה אשמח לשמוע עוד פרטים תודה.`
                    : `היי, ראיתי שפירסמת בנוגע לדירה אשמח לשמוע עוד פרטים תודה.`;
                const encodedMessage = encodeURIComponent(message);
                const waLink = document.createElement('a');
                waLink.href = `https://wa.me/${phoneDigits}?text=${encodedMessage}`;
                waLink.target = '_blank';
                waLink.rel = 'noopener noreferrer';
                waLink.textContent = 'שלח וואטסאפ';
                whatsappCell.appendChild(waLink);
            } else {
                whatsappCell.textContent = '-';
            }
            row.appendChild(whatsappCell);

            const deleteCell = document.createElement('td');
            const deleteBtn = document.createElement('button');
            deleteBtn.classList.add('delete-btn');
            deleteBtn.textContent = 'מחק';
            deleteBtn.dataset.index = items.indexOf(item);
            deleteCell.appendChild(deleteBtn);
            row.appendChild(deleteCell);

            tableBody.appendChild(row);
        });
    }

    function createCell(content, isHTML = false) {
        const td = document.createElement('td');
        if (isHTML && content instanceof HTMLElement) {
            td.appendChild(content);
        } else {
            td.textContent = content;
        }
        return td;
    }

    tableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const index = parseInt(e.target.dataset.index);
            deleteItem(index);
        }
    });

    function deleteItem(index) {
        chrome.storage.local.get({ compareItems: [] }, (result) => {
            const itemsFromStorage = result.compareItems;
            itemsFromStorage.splice(index, 1);
            chrome.storage.local.set({ compareItems: itemsFromStorage }, () => {
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

    function loadItems() {
        chrome.storage.local.get({ compareItems: [] }, (result) => {
            items = result.compareItems;
            applyFilterAndSort();
        });
    }

    loadItems();
});
