(async function () {
    const cfg = window.SITE_CONFIG;
    const tickerEl = document.getElementById('ticker');
    const calendarEl = document.getElementById('calendar-container');
    const legendEl = document.getElementById('legend');

    // ---------- date helpers (all local time, YYYY-MM-DD strings) ----------
    function formatDate(d) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }
    function parseDate(str) {
        const [y, m, d] = str.split('-').map(Number);
        return new Date(y, m - 1, d, 12, 0, 0, 0);
    }
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const todayStr = formatDate(today);

    function daysBetween(fromStr, toStr) {
        return Math.round((parseDate(toStr) - parseDate(fromStr)) / 86400000);
    }

    // ---------- load data ----------
    let tracker;
    try {
        const res = await fetch('/api/tracker');
        if (!res.ok) throw new Error('Request failed.');
        tracker = await res.json();
    } catch (err) {
        calendarEl.innerHTML = `<div class="status-line error">Couldn't load activity: ${err.message}</div>`;
        return;
    }

    // people: name -> Map(dateStr -> Set(habitNames))
    const people = new Map();
    for (const [habit, users] of Object.entries(tracker)) {
        for (const [person, dates] of Object.entries(users)) {
            if (!people.has(person)) people.set(person, new Map());
            const byDate = people.get(person);
            dates.forEach(date => {
                if (!byDate.has(date)) byDate.set(date, new Set());
                byDate.get(date).add(habit);
            });
        }
    }

    // ---------- ticker ----------
    function fill(template, vars) {
        return template.replace(/\{(\w+)\}/g, (m, key) => (key in vars ? vars[key] : m));
    }
    function pick(list) {
        return list[Math.floor(Math.random() * list.length)];
    }

    function buildHeadlines() {
        const t = cfg.ticker;
        const items = [];

        for (const [name, byDate] of people) {
            const dates = [...byDate.keys()].sort();
            if (dates.length === 0) {
                items.push({ text: fill(t.neverLoggedMessage, { name }), tone: t.neverLoggedTone || 'neutral' });
                continue;
            }
            const last = dates[dates.length - 1];
            const days = Math.max(0, daysBetween(last, todayStr));
            const vars = {
                name,
                days,
                dayWord: days === 1 ? 'day' : 'days',
                habit: [...byDate.get(last)].join(' & '),
                date: last
            };
            const lastHabits = [...byDate.get(last)].map(h => h.toLowerCase());
            const habitMatches = r => {
                if (r.habit == null) return true; // no habit set = matches any habit
                const wanted = (Array.isArray(r.habit) ? r.habit : [r.habit]).map(h => h.toLowerCase());
                return wanted.some(h => lastHabits.includes(h));
            };
            const rule = t.rules.find(r =>
                days >= r.minDays && (r.maxDays == null || days <= r.maxDays) && habitMatches(r));
            if (rule) {
                items.push({ text: fill(pick(rule.messages), vars), tone: rule.tone || 'neutral' });
            }
        }

        if (items.length === 0) items.push({ text: t.emptyMessage, tone: 'neutral' });
        return items;
    }

    function renderTicker() {
        const t = cfg.ticker;
        const items = buildHeadlines();

        tickerEl.innerHTML = '';
        if (t.label) {
            const label = document.createElement('div');
            label.className = 'ticker-label';
            label.textContent = t.label;
            tickerEl.appendChild(label);
        }

        const viewport = document.createElement('div');
        viewport.className = 'ticker-viewport';
        const track = document.createElement('div');
        track.className = 'ticker-track';
        viewport.appendChild(track);
        tickerEl.appendChild(viewport);

        function makeGroup(repeat) {
            const group = document.createElement('div');
            group.className = 'ticker-group';
            for (let r = 0; r < repeat; r++) {
                items.forEach(item => {
                    const span = document.createElement('span');
                    span.className = 'ticker-item tone-' + item.tone;
                    span.textContent = item.text;
                    const sep = document.createElement('span');
                    sep.className = 'ticker-sep';
                    sep.textContent = t.separator;
                    group.append(span, sep);
                });
            }
            return group;
        }

        // Make one group at least as wide as the screen so the loop has no gap
        let repeat = 1;
        let group = makeGroup(repeat);
        track.appendChild(group);
        while (group.offsetWidth < viewport.offsetWidth && repeat < 20) {
            repeat++;
            track.replaceChildren(makeGroup(repeat));
            group = track.firstChild;
        }
        const groupWidth = group.offsetWidth;
        track.appendChild(makeGroup(repeat)); // identical copy for a seamless loop

        track.style.animationDuration = Math.max(5, groupWidth / t.pixelsPerSecond) + 's';
    }

    renderTicker();

    // ---------- 14-day calendar ----------
    const c = cfg.calendar;
    const habitColors = {};
    Object.entries(c.habitColors).forEach(([k, v]) => { habitColors[k.toLowerCase()] = v; });

    // --- colour helpers ---
    const comboKey = names => names.map(n => n.trim().toLowerCase()).sort().join('+');
    const comboColors = {};
    Object.entries(c.combinationColors || {}).forEach(([k, v]) => { comboColors[comboKey(k.split('+'))] = v; });

    const rainbowHabits = (c.rainbowHabits || []).map(h => h.toLowerCase());
    const rainbowGradient = `linear-gradient(135deg, ${c.rainbowColors.join(', ')})`;

    function hexToRgb(hex) {
        let h = hex.replace('#', '');
        if (h.length === 3) h = h.split('').map(ch => ch + ch).join('');
        return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
    }
    function blend(hexColours) {
        const rgbs = hexColours.map(hexToRgb);
        const avg = [0, 1, 2].map(i => Math.round(rgbs.reduce((sum, rgb) => sum + rgb[i], 0) / rgbs.length));
        return `rgb(${avg.join(', ')})`;
    }
    const baseColour = habit => habitColors[habit.toLowerCase()] || c.defaultColor;

    // Returns a CSS background for a day's set of habits
    function colourFor(habitSet) {
        const habits = [...habitSet];
        if (habits.length === 1) return baseColour(habits[0]);

        const lower = habits.map(h => h.toLowerCase());
        if (rainbowHabits.length > 0 && rainbowHabits.every(h => lower.includes(h))) {
            return rainbowGradient;
        }
        const explicit = comboColors[comboKey(habits)];
        if (explicit) return explicit;
        return blend(habits.map(baseColour));
    }

    // Oldest day on the left, today on the right
    const days = [];
    for (let i = c.days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        days.push(d);
    }

    // Legend
    legendEl.innerHTML = '';
    function addLegend(colour, label) {
        const item = document.createElement('span');
        item.className = 'legend-item';
        const sw = document.createElement('span');
        sw.className = 'legend-swatch';
        sw.style.background = colour;
        item.append(sw, document.createTextNode(label));
        legendEl.appendChild(item);
    }
    const habitsInUse = Object.keys(tracker);
    habitsInUse.forEach(habit => addLegend(baseColour(habit), habit));
    if (habitsInUse.length > 1) {
        Object.entries(c.combinationColors || {}).forEach(([combo, colour]) => addLegend(colour, combo.split('+').join(' + ')));
        addLegend(`linear-gradient(90deg, ${habitsInUse.map(baseColour).join(', ')})`, 'Other combinations (blended)');
    }
    const lowerInUse = habitsInUse.map(h => h.toLowerCase());
    if (rainbowHabits.length > 0 && rainbowHabits.every(h => lowerInUse.includes(h))) {
        addLegend(rainbowGradient, c.rainbowHabits.join(' + '));
    }

    if (people.size === 0) {
        calendarEl.innerHTML = '<div class="empty-state">No one is on the tracker yet. Add people on the Log activity page.</div>';
        return;
    }

    const wrap = document.createElement('div');
    wrap.className = 'cal-scroll';
    const grid = document.createElement('div');
    grid.className = 'cal-grid';
    grid.style.gridTemplateColumns = `110px repeat(${c.days}, minmax(22px, 1fr))`;

    // header row
    grid.appendChild(document.createElement('div'));
    days.forEach(d => {
        const h = document.createElement('div');
        h.className = 'cal-head' + (formatDate(d) === todayStr ? ' today' : '');
        h.innerHTML = `<span>${d.toLocaleString('default', { weekday: 'narrow' })}</span><span>${d.getDate()}</span>`;
        h.title = formatDate(d);
        grid.appendChild(h);
    });

    // one row per person
    for (const [name, byDate] of people) {
        const label = document.createElement('div');
        label.className = 'cal-name';
        label.textContent = name;
        grid.appendChild(label);

        days.forEach(d => {
            const dateStr = formatDate(d);
            const habits = byDate.get(dateStr);
            const cell = document.createElement('div');
            cell.className = 'cal-cell' + (dateStr === todayStr ? ' today' : '');
            if (habits && habits.size > 0) {
                cell.style.background = colourFor(habits);
                cell.title = `${name} — ${dateStr}: ${[...habits].join(' & ')}`;
            } else {
                cell.title = `${name} — ${dateStr}: nothing logged`;
            }
            grid.appendChild(cell);
        });
    }

    wrap.appendChild(grid);
    calendarEl.innerHTML = '';
    calendarEl.appendChild(wrap);
})();
