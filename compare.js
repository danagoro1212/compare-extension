// compare.js - כולל וואטסאפ תקני, מיון, חיפוש, שמירת הערות וייצוא ל-Excel

document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.querySelector("#compareTable tbody");
    const clearBtn = document.getElementById("clearBtn");
    const refreshBtn = document.getElementById("refreshBtn");
    const searchInput = document.getElementById("searchInput");
    const exportBtn = document.getElementById("exportBtn");
    exportBtn.addEventListener("click", exportToExcel);

    const headers = document.querySelectorAll("#compareTable thead th");
    let allItems = [];
    let currentSort = { key: null, direction: 1 };

    const keyMap = ["index", "description", "authorName", null, null, "phone", "phoneName", "address", "price", null, "addedAt", null, null];

    headers.forEach((th, index) => {
        const key = keyMap[index];
        if (key) {
            th.classList.add("sortable");
            th.addEventListener("click", () => {
                if (currentSort.key === key) {
                    currentSort.direction *= -1;
                } else {
                    currentSort = { key, direction: 1 };
                }
                renderTable(filterItems(searchInput.value));
                updateSortIndicators();
            });
        }
    });

    function updateSortIndicators() {
        headers.forEach((th, i) => {
            th.innerHTML = th.textContent.replace(/\s*[▲▼]$/, "");
            if (keyMap[i] === currentSort.key) {
                const arrow = currentSort.direction === 1 ? "▲" : "▼";
                th.innerHTML += ` <span class="sort-arrow">${arrow}</span>`;
            }
        });
    }

    function getWhatsappLink(phone, message = '') {
        if (!phone || !/^0[5]\d{8}$/.test(phone)) return '';
        const intl = phone.startsWith('0') ? '972' + phone.slice(1) : phone;
        const encodedMessage = encodeURIComponent(message || 'שלום, ראיתי את הפוסט שלך בפייסבוק. האם זה עדיין רלוונטי?');
        return `https://wa.me/${intl}?text=${encodedMessage}`;
    }

    function renderTable(items) {
        if (currentSort.key) {
            items.sort((a, b) => {
                const valA = a[currentSort.key] || "";
                const valB = b[currentSort.key] || "";

                if (currentSort.key === "price") {
                    return (parseFloat(valA || 0) - parseFloat(valB || 0)) * currentSort.direction;
                }

                if (currentSort.key === "addedAt") {
                    return (new Date(valA) - new Date(valB)) * currentSort.direction;
                }

                return valA.toString().localeCompare(valB.toString(), 'he') * currentSort.direction;
            });
        }

        tableBody.innerHTML = "";
        items.forEach((item, index) => {
            const addedDate = item.addedAt ? new Date(item.addedAt).toLocaleString("he-IL") : "";
            const whatsappLink = getWhatsappLink(item.phone);
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${item.description}</td>
                <td>${item.authorName}</td>
                <td><a href="${item.authorProfile}" target="_blank">פרופיל</a></td>
                <td><a href="${item.postLink}" target="_blank">פוסט</a></td>
                <td>${item.phone}</td>
                <td>${item.phoneName}</td>
                <td>${item.address || ''}</td>
                <td>${item.price || ''}</td>
                <td>${whatsappLink ? `<a href="${whatsappLink}" target="_blank">שלח וואטסאפ</a>` : ''}</td>
                <td>${addedDate}</td>
                <td><textarea class="notes-area" data-index="${index}">${item.notes || ''}</textarea></td>
                <td><button class="deleteBtn" data-index="${index}">X</button></td>
            `;
            tableBody.appendChild(row);
        });

        document.querySelectorAll(".deleteBtn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const index = +e.target.dataset.index;
                allItems.splice(index, 1);
                chrome.storage.local.set({ compareItems: allItems }, () => renderTable(filterItems(searchInput.value)));
            });
        });

        document.querySelectorAll(".notes-area").forEach(area => {
            area.addEventListener("change", (e) => {
                const index = +e.target.dataset.index;
                const newNote = e.target.value;
                if (allItems[index]) {
                    allItems[index].notes = newNote;
                    chrome.storage.local.set({ compareItems: allItems });
                    e.target.closest("tr").classList.add("table-warning");
                    setTimeout(() => e.target.closest("tr").classList.remove("table-warning"), 800);
                }
            });
        });
    }

    function filterItems(query) {
        const q = query.toLowerCase();
        return allItems.filter(item =>
            Object.values(item).some(val =>
                typeof val === "string" && val.toLowerCase().includes(q)
            )
        );
    }

    function refreshCompareTable() {
        chrome.storage.local.get({ compareItems: [] }, (result) => {
            allItems = result.compareItems;
            renderTable(filterItems(searchInput.value));
            updateSortIndicators();
        });
    }

    function clearCompareItems() {
        if (confirm("האם אתה בטוח שברצונך למחוק את כל הפריטים?")) {
            chrome.storage.local.set({ compareItems: [] }, () => {
                allItems = [];
                renderTable([]);
            });
        }
    }

    clearBtn.addEventListener("click", clearCompareItems);
    refreshBtn.addEventListener("click", refreshCompareTable);
    searchInput.addEventListener("input", () => renderTable(filterItems(searchInput.value)));

    refreshCompareTable();
});

window.exportToExcel = function () {
    chrome.storage.local.get({ compareItems: [] }, (result) => {
        const items = result.compareItems;
        if (items.length === 0) {
            alert("אין פריטים לייצוא.");
            return;
        }

        const data = items.map((item, index) => ({
            מספר: index + 1,
            תיאור: item.description || '',
            "שם הכותב": item.authorName || '',
            "קישור לפרופיל": item.authorProfile || '',
            "קישור לפוסט": item.postLink || '',
            טלפון: item.phone || '',
            "שם ליד הטלפון": item.phoneName || '',
            כתובת: item.address || '',
            מחיר: item.price || '',
            וואטסאפ: item.phone ? getWhatsappLink(item.phone) : '',
            "תאריך הוספה": item.addedAt ? new Date(item.addedAt).toLocaleString("he-IL") : '',
            הערות: item.notes || ''
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "השוואה");
        XLSX.writeFile(wb, "compare_items.xlsx");
    });
};
