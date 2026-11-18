// Injects the shared top navigation bar. Included on every page.
(function () {
    const cfg = window.SITE_CONFIG || {};
    const path = location.pathname.replace(/\/+$/, '');

    // Add or reorder pages here
    const pages = [
        { label: 'Home',         href: '/',              match: ['', '/index.html'] },
        { label: 'Log activity', href: '/log.html',      match: ['/log', '/log.html'] },
        { label: 'Wrapped',      href: '/wrapped.html',  match: ['/wrapped', '/wrapped.html'] }
    ];
    const current = pages.find(p => p.match.includes(path)) || pages[0];

    const nav = document.createElement('nav');
    nav.className = 'navbar';

    const brand = document.createElement('a');
    brand.className = 'nav-brand';
    brand.href = '/';
    brand.textContent = cfg.siteName || 'Habit Tracker';

    const links = document.createElement('div');
    links.className = 'nav-links';
    pages.forEach(item => {
        const a = document.createElement('a');
        a.className = 'nav-btn' + (item === current ? ' active' : '');
        a.href = item.href;
        a.textContent = item.label;
        links.appendChild(a);
    });

    // Empty right-hand column keeps the buttons truly centred
    const spacer = document.createElement('div');

    nav.append(brand, links, spacer);
    document.body.insertBefore(nav, document.body.firstChild);
    document.title = current.label + ' · ' + (cfg.siteName || 'Habit Tracker');
})();
