// Injects the shared top navigation bar. Included on every page.
(function () {
    const cfg = window.SITE_CONFIG || {};
    const path = location.pathname.replace(/\/+$/, '');
    const onLog = path.endsWith('/log') || path.endsWith('/log.html');

    const nav = document.createElement('nav');
    nav.className = 'navbar';

    const brand = document.createElement('a');
    brand.className = 'nav-brand';
    brand.href = '/';
    brand.textContent = cfg.siteName || 'Habit Tracker';

    const links = document.createElement('div');
    links.className = 'nav-links';

    [
        { label: 'Home', href: '/', active: !onLog },
        { label: 'Log activity', href: '/log.html', active: onLog }
    ].forEach(item => {
        const a = document.createElement('a');
        a.className = 'nav-btn' + (item.active ? ' active' : '');
        a.href = item.href;
        a.textContent = item.label;
        links.appendChild(a);
    });

    // Empty right-hand column keeps the buttons truly centred
    const spacer = document.createElement('div');

    nav.append(brand, links, spacer);
    document.body.insertBefore(nav, document.body.firstChild);
    document.title = (onLog ? 'Log activity' : 'Home') + ' · ' + (cfg.siteName || 'Habit Tracker');
})();
