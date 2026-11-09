const legacyPageRoutes = new Map([
    ["/", "/v2/doctor.html"],
    ["/doctor", "/v2/doctor.html"],
    ["/doctor.html", "/v2/doctor.html"],
    ["/display", "/v2/display.html"],
    ["/display.html", "/v2/display.html"],
    ["/reception", "/v2/reception.html"],
    ["/reception.html", "/v2/reception.html"]
]);

export function rewritePageUrl(requestUrl) {
    const url = new URL(requestUrl, "http://localhost");
    const legacyPagePath = legacyPageRoutes.get(url.pathname);

    if (legacyPagePath) {
        url.pathname = legacyPagePath;
    } else {
        const versionRoot = url.pathname.match(/^\/(v\d+)\/?$/);

        if (versionRoot) url.pathname = `/${versionRoot[1]}/doctor`;
    }

    return `${url.pathname}${url.search}`;
}
