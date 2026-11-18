const legacyPageRoutes = new Map([
    ["/", "/index.html"],
    ["/home", "/index.html"],
    ["/testing", "/testing/index.html"],
    ["/testing/", "/testing/index.html"],
    ["/versions", "/versions/index.html"],
    ["/versions/", "/versions/index.html"],
    ["/doctor", "/doctor.html"],
    ["/doctor.html", "/doctor.html"],
    ["/display", "/display.html"],
    ["/display.html", "/display.html"],
    ["/reception", "/reception.html"],
    ["/reception.html", "/reception.html"],
    ["/tv-test", "/tv-test/index.html"],
    ["/tv-test/", "/tv-test/index.html"],
    ["/v17", "/v17/index.html"],
    ["/v17/", "/v17/index.html"],
    ["/v17/doctor", "/v17/doctor/index.html"],
    ["/v17/doctor/", "/v17/doctor/index.html"],
    ["/v17/display", "/v17/display/index.html"],
    ["/v17/display/", "/v17/display/index.html"],
    ["/v18", "/v18/index.html"],
    ["/v18/", "/v18/index.html"],
    ["/v18/doctor", "/v18/doctor/index.html"],
    ["/v18/doctor/", "/v18/doctor/index.html"],
    ["/v18/display", "/v18/display/index.html"],
    ["/v18/display/", "/v18/display/index.html"],
    ["/v19", "/v19/index.html"],
    ["/v19/", "/v19/index.html"],
    ["/v19/doctor", "/v19/doctor/index.html"],
    ["/v19/doctor/", "/v19/doctor/index.html"],
    ["/v19/display", "/v19/display/index.html"],
    ["/v19/display/", "/v19/display/index.html"],
    ["/v20", "/v20/index.html"],
    ["/v20/", "/v20/index.html"],
    ["/v20/doctor", "/v20/doctor/index.html"],
    ["/v20/doctor/", "/v20/doctor/index.html"],
    ["/v20/display", "/v20/display/index.html"],
    ["/v20/display/", "/v20/display/index.html"]
]);

export function rewritePageUrl(requestUrl) {
    const url = new URL(requestUrl, "http://localhost");
    const legacyPagePath = legacyPageRoutes.get(url.pathname);

    if (legacyPagePath) {
        url.pathname = legacyPagePath;
    } else {
        const versionRoot = url.pathname.match(/^\/(v\d+)\/?$/);
        if (versionRoot) {
            url.pathname = `/${versionRoot[1]}/index.html`;
        }
    }

    return `${url.pathname}${url.search}`;
}
