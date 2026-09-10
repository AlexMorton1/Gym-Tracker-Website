let db = {}; // { habitName: { personName: ["YYYY-MM-DD", ...] } }

function formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

const today = new Date();
today.setHours(12, 0, 0, 0);
const todayStr = formatDate(today);

const numWeeks = 38;
const weeks = [];
const months = [];

const daysToSubtract = (numWeeks * 7) + today.getDay();
const currentDate = new Date(today);
currentDate.setDate(today.getDate() - daysToSubtract);

for (let i = 0; i <= numWeeks; i++) {
    const week = [];
    for (let j = 0; j < 7; j++) {
        currentDate.setDate(currentDate.getDate() + 1);
        if (currentDate <= today) {
            const dateStr = formatDate(currentDate);
            week.push(dateStr);
            if (currentDate.getDate() === 1 || (i === 0 && j === 0)) {
                months.push({ name: currentDate.toLocaleString('default', { month: 'short' }), colIndex: i });
            }
        } else {
            week.push(null);
        }
    }
    weeks.push(week);
}

const selector = document.getElementById('habit-selector');
const container = document.getElementById('tracker-container');
const addPersonBtn = document.getElementById('add-person-btn');

async function apiGet(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error((await res.json()).error || 'Request failed.');
    return res.json();
}

async function apiPost(url, body) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Request failed.');
    return res.json();
}

function populateSelector() {
    const previousValue = selector.value;
    selector.innerHTML = '';
    Object.keys(db).forEach(habit => {
        const option = document.createElement('option');
        option.value = habit;
        option.textContent = habit;
        selector.appendChild(option);
    });
    if (previousValue && db[previousValue]) selector.value = previousValue;
}

function renderTracker(habitName) {
    container.innerHTML = '';
    const habitUsers = db[habitName] || {};
    const entries = Object.entries(habitUsers);

    if (entries.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'No one is tracking this habit yet. Add a person to get started.';
        container.appendChild(empty);
        return;
    }

    for (const [userName, completedDates] of entries) {
        const section = document.createElement('div');
        section.className = 'habit-section';

        const userRowHeader = document.createElement('div');
        userRowHeader.className = 'user-row-header';

        const title = document.createElement('h3');
        title.className = 'habit-title';
        title.textContent = userName;
        userRowHeader.appendChild(title);

        const isDoneToday = completedDates.includes(todayStr);
        const todayBtn = document.createElement('button');
        todayBtn.className = 'today-btn' + (isDoneToday ? ' done' : '');
        todayBtn.textContent = isDoneToday ? '✓ Done today' : '+ Mark today';
        todayBtn.addEventListener('click', () => toggleToday(habitName, userName, todayBtn));
        userRowHeader.appendChild(todayBtn);

        section.appendChild(userRowHeader);

        const graphContainer = document.createElement('div');
        graphContainer.className = 'graph-container';

        const monthsHeader = document.createElement('div');
        monthsHeader.className = 'months-header';
        months.forEach(month => {
            const span = document.createElement('span');
            span.className = 'month-label';
            span.textContent = month.name;
            span.style.left = `${month.colIndex * 18}px`;
            monthsHeader.appendChild(span);
        });
        graphContainer.appendChild(monthsHeader);

        const graphBody = document.createElement('div');
        graphBody.className = 'graph-body';

        const daysSidebar = document.createElement('div');
        daysSidebar.className = 'days-sidebar';
        ['', 'Mon', '', 'Wed', '', 'Fri', ''].forEach(day => {
            const span = document.createElement('span');
            span.textContent = day;
            daysSidebar.appendChild(span);
        });
        graphBody.appendChild(daysSidebar);

        const grid = document.createElement('div');
        grid.className = 'grid';

        weeks.forEach(week => {
            const column = document.createElement('div');
            column.className = 'column';
            week.forEach(dateString => {
                const cell = document.createElement('div');
                cell.className = 'cell';
                if (dateString) {
                    cell.title = dateString;
                    if (completedDates.includes(dateString)) cell.classList.add('completed');
                } else {
                    cell.classList.add('hidden');
                }
                column.appendChild(cell);
            });
            grid.appendChild(column);
        });

        graphBody.appendChild(grid);
        graphContainer.appendChild(graphBody);
        section.appendChild(graphContainer);
        container.appendChild(section);
    }
}

async function toggleToday(habitName, userName, buttonEl) {
    buttonEl.disabled = true;
    try {
        db = await apiPost('/api/toggle', { habit: habitName, person: userName, date: todayStr });
        renderTracker(habitName);
    } catch (err) {
        alert(`Couldn't update: ${err.message}`);
        buttonEl.disabled = false;
    }
}

// --- Add person modal ---
function openAddPersonModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const box = document.createElement('div');
    box.className = 'modal-box';

    const heading = document.createElement('h3');
    heading.textContent = 'Add a person';
    box.appendChild(heading);

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Name';
    input.maxLength = 40;
    box.appendChild(input);

    const errorLine = document.createElement('div');
    errorLine.className = 'modal-error';
    box.appendChild(errorLine);

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => overlay.remove());

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'btn primary';
    confirmBtn.textContent = 'Add person';

    async function confirmAdd() {
        const name = input.value.trim();
        if (!name) {
            errorLine.textContent = 'Enter a name first.';
            return;
        }
        confirmBtn.disabled = true;
        cancelBtn.disabled = true;
        confirmBtn.textContent = 'Adding…';
        errorLine.textContent = '';

        try {
            db = await apiPost('/api/people', { name });
            overlay.remove();
            populateSelector();
            renderTracker(selector.value);
        } catch (err) {
            errorLine.textContent = err.message;
            confirmBtn.disabled = false;
            cancelBtn.disabled = false;
            confirmBtn.textContent = 'Add person';
        }
    }

    confirmBtn.addEventListener('click', confirmAdd);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirmAdd();
        if (e.key === 'Escape') overlay.remove();
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    box.appendChild(actions);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    input.focus();
}

addPersonBtn.addEventListener('click', openAddPersonModal);
selector.addEventListener('change', (e) => renderTracker(e.target.value));

async function init() {
    try {
        db = await apiGet('/api/tracker');
        populateSelector();
        const firstHabit = Object.keys(db)[0];
        if (firstHabit) {
            renderTracker(firstHabit);
        } else {
            container.innerHTML = '<div class="empty-state">No habits set up yet.</div>';
        }
    } catch (err) {
        container.innerHTML = `<div class="status-line error">Couldn't load the tracker: ${err.message}</div>`;
    }
}

init();
