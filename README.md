# Student Finance Tracker

## 1\. About

- Live site: [https\://hamospenda-tech.github.io/student-finance-tracker/](https://hamospenda-tech.github.io/student-finance-tracker/)  
- Demo video (unlisted): \[add link here\]  
- GitHub- [hamospenda-tech](https://github.com/hamospenda-tech/student-finance-tracker)  
- Email- [h.amospenda@alustudent.com](mailto:h.amospenda@alustudent.com)  
- Theme: Student Finance Tracker, built with plain HTML, CSS and JavaScript (no frameworks)

Features:

- Add, edit and delete transactions, with a confirm before delete  
- Regex validation on every form  
- Live regex search with highlighted matches and a case toggle  
- Sort by date, description or amount  
- Dashboard with total records, total spent, top category and a 7-day chart  
- Monthly cap with a live message (polite when under, assertive when over)  
- Amounts are saved in RWF, and Settings holds manual USD and EUR rates  
- Editable categories  
- Saves to localStorage, with JSON export and import that checks the file first

## 2\. Regex and keyboard

Validation patterns:

- Description: `^\S+(?: \S+)*$` allows no leading, trailing or double spaces. "Lunch at cafeteria" passes, " Lunch" fails.  
- Amount: `^(0|[1-9]\d*)(\.\d{1,2})?$` allows up to 2 decimals. "12.50" passes, "012" fails.  
- Date: `^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$` checks the YYYY-MM-DD shape. The code also checks the date is real, so "2025-02-30" fails.  
- Category: `^[A-Za-z]+(?:[ -][A-Za-z]+)*$` allows letters, spaces and hyphens. "Fast-food" passes, "Food2" fails.  
- Rate: `^\d+(\.\d{1,8})?$` and above 0\. "0.00069" passes, "0" fails.  
- Advanced (back-reference): `\b(\w+)\s+\1\b` catches repeated words. "the the cafe" is rejected.

Search examples:

- Cents present: `\.\d{2}\b`  
- Beverages, ignoring case: `(coffee|tea)`  
- Lookahead, both words: `^(?=.*lunch)(?=.*Joe)`  
- A broken pattern is caught with try/catch and shows a message instead of crashing.

Keyboard:

- Tab and Shift+Tab move between controls. The first stop is the skip link.  
- Enter follows links, presses buttons and submits forms.  
- Space presses buttons and ticks the "Ignore case" box.  
- Arrow keys change the option in a dropdown.  
- In an edit row, Enter saves and Escape cancels.

## 3\. Accessibility and running

Accessibility:

- Landmarks (header, nav, main, sections, footer) with one h1 and a heading for each section  
- Skip link, a label on every input, and a visible focus outline  
- Saves, errors and search results are announced with role="status". Going over the cap uses role="alert".  
- On small screens the table becomes cards, with each value labelled  
- Colour contrast meets WCAG AA, and an axe-core check found no violations  
- Animation is turned off for visitors who prefer reduced motion

Running:

- Online: open the live site.    
- Tests: open tests.html the same way. It shows PASS or FAIL for each of its 46 checks.  
- seed.json holds 12 sample records. They load on the first visit and can also be used with Import.
