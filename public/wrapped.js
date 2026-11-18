(async function () {
    const cfg = window.SITE_CONFIG;
    const w = cfg.wrapped;
    const year = w.year || new Date().getFullYear();

    document.getElementById('wrapped-banner').textContent = w.banner;

    const runsEl = document.getElementById('runs-chart');
    const gymEl = document.getElementById('gym-chart');
    const activeEl = document.getElementById('active-chart');
    const tooltip = document.getElementById('chart-tooltip');

    document.getElementById('runs-title').textContent = `Top ${w.topN} runners of ${year}`;
    document.getElementById('gym-title').textContent = `Top ${w.topN} gym-goers of ${year}`;

    // ---------- load data ----------
    let tracker;
    try {
        const res = await fetch('/api/tracker');
        if (!res.ok) throw new Error('Request failed.');
        tracker = await res.json();
    } catch (err) {
        [runsEl, gymEl, activeEl].forEach(el => {
            el.innerHTML = `<div class="status-line error">Couldn't load data: ${err.message}</div>`;
        });
        return;
    }

    // ---------- count days per person for this year ----------
    const habitColors = {};
    Object.entries(cfg.calendar.habitColors).forEach(([k, v]) => { habitColors[k.toLowerCase()] = v; });
    const runColor = habitColors[w.runHabit.toLowerCase()] || '#f85149';
    const gymColor = habitColors[w.gymHabit.toLowerCase()] || '#388bfd';

    const counts = new Map(); // name -> { run, gym }
    for (const [habit, users] of Object.entries(tracker)) {
        const key = habit.toLowerCase();
        for (const [name, dates] of Object.entries(users)) {
            if (!counts.has(name)) counts.set(name, { run: 0, gym: 0 });
            const inYear = dates.filter(d => d.startsWith(year + '-')).length;
            if (key === w.runHabit.toLowerCase()) counts.get(name).run += inYear;
            if (key === w.gymHabit.toLowerCase()) counts.get(name).gym += inYear;
        }
    }
    const people = [...counts.entries()].map(([name, c]) => ({ name, run: c.run, gym: c.gym, total: c.run + c.gym }));

    const byValue = (field) => (a, b) => b[field] - a[field] || a.name.localeCompare(b.name);

    // ---------- tooltip ----------
    function showTip(html, x, y) {
        tooltip.innerHTML = html;
        tooltip.classList.add('visible');
        const pad = 12;
        const rect = tooltip.getBoundingClientRect();
        let left = x + pad;
        if (left + rect.width > window.innerWidth - 8) left = x - rect.width - pad;
        tooltip.style.left = Math.max(8, left) + 'px';
        tooltip.style.top = (y + pad) + 'px';
    }
    function hideTip() { tooltip.classList.remove('visible'); }

    function attachTip(el, html) {
        el.tabIndex = 0;
        el.addEventListener('mousemove', e => showTip(html, e.clientX, e.clientY));
        el.addEventListener('mouseleave', hideTip);
        el.addEventListener('focus', () => {
            const r = el.getBoundingClientRect();
            showTip(html, r.left + r.width / 2, r.bottom);
        });
        el.addEventListener('blur', hideTip);
    }

    // ---------- chart rendering ----------
    // rows: [{ name, crown?, segments: [{ value, color, label }] }]
    function renderBars(container, rows, max) {
        container.innerHTML = '';
        const chart = document.createElement('div');
        chart.className = 'bar-chart';
        const fills = [];

        rows.forEach((row, i) => {
            const rowEl = document.createElement('div');
            rowEl.className = 'bar-row';

            const label = document.createElement('div');
            label.className = 'bar-label';
            if (row.crown) {
                const crown = document.createElement('span');
                crown.className = 'crown';
                crown.textContent = w.crown;
                crown.title = 'Most active';
                label.appendChild(crown);
            }
            const nameEl = document.createElement('span');
            nameEl.className = 'bar-name';
            nameEl.textContent = row.name;
            label.appendChild(nameEl);

            const track = document.createElement('div');
            track.className = 'bar-track';
            const total = row.segments.reduce((sum, s) => sum + s.value, 0);

            const bar = document.createElement('div');
            bar.className = 'bar-fill';
            bar.style.width = '0%';
            bar.dataset.target = (total / max * 100) + '%';

            row.segments.forEach(seg => {
                if (seg.value <= 0) return;
                const part = document.createElement('div');
                part.className = 'bar-seg';
                part.style.background = seg.color;
                part.style.flexGrow = seg.value;
                attachTip(part, `<strong>${row.name}</strong><br>${seg.label}: ${seg.value} ${seg.value === 1 ? 'day' : 'days'}` +
                    (row.segments.length > 1 ? `<br>Total: ${total}` : '') + (row.rank ? `<br>Rank #${row.rank}` : ''));
                bar.appendChild(part);
            });
            fills.push(bar);
            track.appendChild(bar);

            const value = document.createElement('div');
            value.className = 'bar-value';
            value.textContent = total;

            rowEl.append(label, track, value);
            chart.appendChild(rowEl);
        });

        container.appendChild(chart);
        // grow bars from 0 once they're in the DOM
        requestAnimationFrame(() => requestAnimationFrame(() => {
            fills.forEach((bar, i) => { setTimeout(() => { bar.style.width = bar.dataset.target; }, i * 70); });
        }));
    }

    function emptyMessage(container, text) {
        container.innerHTML = `<div class="empty-state">${text}</div>`;
    }

    // ---------- chart 1 & 2: top N ----------
    function topChart(container, field, habitLabel, color) {
        const top = people.filter(p => p[field] > 0).sort(byValue(field)).slice(0, w.topN);
        if (top.length === 0) {
            emptyMessage(container, `No ${habitLabel.toLowerCase()} recorded in ${year} yet.`);
            return;
        }
        const max = top[0][field];
        renderBars(container, top.map((p, i) => ({
            name: p.name,
            rank: i + 1,
            segments: [{ value: p[field], color, label: habitLabel }]
        })), max);
    }
    topChart(runsEl, 'run', w.runHabit, runColor);
    topChart(gymEl, 'gym', w.gymHabit, gymColor);

    // ---------- chart 3: stacked, everyone ----------
    const everyone = [...people].sort(byValue('total'));
    const maxTotal = everyone.length ? everyone[0].total : 0;

    const legend = document.getElementById('active-legend');
    [[w.runHabit, runColor], [w.gymHabit, gymColor]].forEach(([label, colour]) => {
        const item = document.createElement('span');
        item.className = 'legend-item';
        const sw = document.createElement('span');
        sw.className = 'legend-swatch';
        sw.style.background = colour;
        item.append(sw, document.createTextNode(label));
        legend.appendChild(item);
    });

    if (maxTotal === 0) {
        emptyMessage(activeEl, `No activity recorded in ${year} yet.`);
    } else {
        renderBars(activeEl, everyone.map(p => ({
            name: p.name,
            crown: p.total === maxTotal,   // ties all get a crown
            segments: [
                { value: p.run, color: runColor, label: w.runHabit },
                { value: p.gym, color: gymColor, label: w.gymHabit }
            ]
        })), maxTotal);
    }
})();
