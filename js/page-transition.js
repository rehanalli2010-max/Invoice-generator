(function () {
    const overlay = document.querySelector('.page-transition');
    if (!overlay) return;

    const LEAVE_MS = 450;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let pendingUrl = null;

    function isLocalPage(href) {
        if (!href || href.startsWith('#') || href.startsWith('javascript:')) return false;
        try {
            const url = new URL(href, window.location.href);
            if (url.origin !== window.location.origin) return false;
            if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
            return url.pathname === '/' || /\.html?($|[?#])/i.test(url.pathname);
        } catch {
            return false;
        }
    }

    function navigate(url) {
        // Clear the pending flag before navigating so a failed navigation
        // doesn't permanently block future transitions.
        pendingUrl = null;
        window.location.href = url;
    }

    function leave(url) {
        if (pendingUrl) return;
        pendingUrl = url;
        if (reduceMotion) {
            navigate(url);
            return;
        }
        document.body.classList.add('is-page-leaving');
        overlay.classList.add('is-leaving');
        setTimeout(() => {
            try {
                navigate(url);
            } catch {
                pendingUrl = null;
                document.body.classList.remove('is-page-leaving');
                overlay.classList.remove('is-leaving');
            }
        }, LEAVE_MS);
    }

    // If navigation fails or the page is restored from cache, unblock future transitions
    function reset() {
        pendingUrl = null;
    }

    document.addEventListener('click', function (e) {
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const anchor = e.target.closest('a[href]');
        if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
        if (anchor.hasAttribute('data-no-transition')) return;
        const href = anchor.getAttribute('href');
        if (!isLocalPage(href)) return;
        e.preventDefault();
        leave(href);
    }, true);

    window.addEventListener('pageshow', function (e) {
        pendingUrl = null;
        if (e.persisted) {
            document.body.classList.remove('is-page-leaving');
            overlay.classList.remove('is-leaving');
            overlay.classList.remove('is-loading');
            void overlay.offsetWidth;
            overlay.classList.add('is-loading');
        }
    });

    window.pageTransition = { navigate: navigate };
})();
