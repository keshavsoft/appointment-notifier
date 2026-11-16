const legacyPageRoutes = new Map([
    ["/", "/index.html"],
    ["/home", "/index.html"],
    ["/doctor", "/doctor.html"],
    ["/doctor.html", "/doctor.html"],
    ["/display", "/display.html"],
    ["/display.html", "/display.html"],
    ["/reception", "/reception.html"],
    ["/reception.html", "/reception.html"],
    ["/tv-test", "/tv-test/index.html"],
    ["/tv-test/", "/tv-test/index.html"],
    ["/v17/doctor", "/v17/doctor/index.html"],
    ["/v17/doctor/", "/v17/doctor/index.html"],
    ["/v17/display", "/v17/display/index.html"],
    ["/v17/display/", "/v17/display/index.html"]
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
