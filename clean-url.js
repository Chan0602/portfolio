(() => {
  const trackEvent = (eventName, params = {}) => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, params);
  };

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || link.matches('[data-scroll-target]')) return;

    const href = link.getAttribute('href') || '';
    const sectionMap = {
      'index.html#work': 'work',
      'index.html#play': 'play',
      'index.html#contact-me': 'contact',
      'index.html#scroll-footer': 'contact'
    };
    const sectionName = sectionMap[href];
    if (!sectionName) return;

    trackEvent('home_nav_click', {
      section_name: sectionName,
      source_path: window.location.pathname
    });
  });

  const { pathname, search, hash } = window.location;
  let cleanPath = pathname;
  let cleanHash = hash;

  if (cleanPath.endsWith('/index.html')) {
    cleanPath = cleanPath.slice(0, -'index.html'.length);
  } else if (cleanPath.endsWith('.html')) {
    cleanPath = cleanPath.slice(0, -'.html'.length);
  }

  const homeSectionHashes = new Set(['#work', '#play', '#contact-me', '#scroll-footer']);
  const isHomePage = pathname.endsWith('/index.html') || pathname.endsWith('/');
  if (isHomePage && homeSectionHashes.has(cleanHash)) {
    cleanHash = '';
  }

  const nextUrl = `${cleanPath}${search}${cleanHash}`;
  const currentUrl = `${pathname}${search}${hash}`;
  if (nextUrl !== currentUrl && window.history?.replaceState) {
    window.history.replaceState(null, '', nextUrl);
  }
})();
