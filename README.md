# השוואת דירות וספקים בצורה נוחה

תוסף כרום שמוסיף כפתורי "הוסף להשוואה" לפוסטים בפייסבוק, מאפשר לשמור פרטים חשובים מהפוסטים (כגון תיאור, שם הכותב, קישורים, טלפון, כתובת, מחיר ועוד), ולנהל רשימת פריטים להשוואה.

## תכונות

- הוספת כפתור קטן בכל פוסט בפייסבוק להוספה להשוואה.
- חילוץ מידע רלוונטי אוטומטי מהפוסט (טלפון, כתובת, מחיר, תאריך כניסה, שם הכותב, קישורים).
- שמירת הפריטים ב-localStorage של הדפדפן (באמצעות `chrome.storage.local`).
- טבלה דינמית להצגת כל הפריטים שנבחרו להשוואה.
- כפתור למחיקת כל הפריטים שהוספו.
- כפתור לרענון הטבלה להצגת הנתונים המעודכנים.
- אפשרות לייצא את רשימת הפריטים כקובץ CSV (להשוואה נוספת באקסל).
- הודעות Toast ידידותיות לשימוש להצלחות או שגיאות.

## התקנה

1. הורד את הקוד או שכפל את הריפוזיטורי.
2. פתח את דפדפן Chrome וגש לכתובת: `chrome://extensions/`
3. הפעל מצב מפתחים (Developer mode).
4. לחץ על "טען תיקייה מפותחת" (Load unpacked) ובחר את תיקיית התוסף.
5. כעת התוסף פעיל ויפעל אוטומטית בדפי פייסבוק.

## שימוש

- בעת גלישה בפייסבוק, ליד כל פוסט יתווסף אייקון או כפתור "הוסף להשוואה".
- לחיצה עליו תשלוף את המידע מתוך הפוסט ותשמור ברשימת ההשוואות.
- ניתן לגשת לדף ההשוואה (`compare.html`) מתוך התוסף לצפייה בטבלה, למחוק פריטים או לייצא ל-CSV.

## קבצים עיקריים

- `manifest.json` - קובץ תצורת התוסף (Manifest V3).
- `facebookContentScript.js` ו-`content.js` - סקריפטים שמוסיפים את כפתורי ההשוואה לדפי פייסבוק.
- `compare.html` - דף המציג טבלה עם הפריטים שנבחרו להשוואה.
- `compare.js` - לוגיקה להצגת הטבלה, טעינת ושמירת הנתונים, ניקוי וייצוא.
- `icons/` - תיקיית האייקונים של התוסף.



# Appartments / Suppliers Comparison Extension

A Chrome extension that adds "Add to Compare" buttons to Facebook posts, enabling users to save important details from posts (such as description, author name, links, phone, address, price, and more) and manage a list of items for comparison.

## Features

- Adds a small button to each Facebook post for adding to the comparison list.
- Automatically extracts relevant info from posts (phone, address, price, entry date, author name, links).
- Saves items in the browser's local storage using `chrome.storage.local`.
- Dynamic table displaying all selected comparison items.
- Button to clear all saved comparison items.
- Button to refresh the table to show updated data.
- Export comparison list as a CSV file (for Excel or other uses).
- User-friendly Toast notifications for success and errors.

## Installation

1. Download or clone the repository.
2. Open Chrome and go to `chrome://extensions/`
3. Enable Developer Mode.
4. Click "Load unpacked" and select the extension folder.
5. The extension is now active and will run automatically on Facebook pages.

## Usage

- When browsing Facebook, an "Add to Compare" icon/button will appear on each post.
- Clicking the button extracts data from the post and saves it to the comparison list.
- Access the comparison page (`compare.html`) from the extension to view, delete, or export items.

## Main Files

- `manifest.json` — extension configuration file (Manifest V3).
- `facebookContentScript.js` and `content.js` — scripts injecting compare buttons on Facebook pages.
- `compare.html` — page displaying the comparison table.
- `compare.js` — logic for rendering the table, data loading/saving, clearing, and exporting.
- `icons/` — folder containing extension icons.


---

