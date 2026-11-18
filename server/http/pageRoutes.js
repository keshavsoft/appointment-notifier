const legacyPageRoutes = new Map([
    ["/", "/index.html"],
    ["/home", "/index.html"],
    ["/tv", "/tv/index.html"],
    ["/tv/", "/tv/index.html"],
    ["/tv/single", "/tv/single/index.html"],
    ["/tv/single/", "/tv/single/index.html"],
    ["/tv/single/v18", "/tv/single/v18/index.html"],
    ["/tv/single/v18/", "/tv/single/v18/index.html"],
    ["/tv/split", "/tv/split/index.html"],
    ["/tv/split/", "/tv/split/index.html"],
    ["/tv/split/v19", "/tv/split/v19/index.html"],
    ["/tv/split/v19/", "/tv/split/v19/index.html"],
    ["/tv/display", "/tv/single/v18/index.html"],
    ["/tv/display/", "/tv/single/v18/index.html"],
    ["/tv/test", "/tv/test/index.html"],
    ["/tv/test/", "/tv/test/index.html"],
    ["/tv/audio", "/tv/audio/index.html"],
    ["/tv/audio/", "/tv/audio/index.html"],
    ["/tv/versions", "/tv/versions/index.html"],
    ["/tv/versions/", "/tv/versions/index.html"],
    ["/desktop", "/desktop/index.html"],
    ["/desktop/", "/desktop/index.html"],
    ["/desktop/doctor", "/desktop/doctor/index.html"],
    ["/desktop/doctor/", "/desktop/doctor/index.html"],
    ["/desktop/display", "/desktop/display/index.html"],
    ["/desktop/display/", "/desktop/display/index.html"],
    ["/desktop/testing", "/desktop/testing/index.html"],
    ["/desktop/testing/", "/desktop/testing/index.html"],
    ["/desktop/versions", "/desktop/versions/index.html"],
    ["/desktop/versions/", "/desktop/versions/index.html"],

    // Legacy Aliases Mapped Directly to Clean Modern Routes
    ["/doctor", "/desktop/doctor/index.html"],
    ["/doctor.html", "/desktop/doctor/index.html"],
    ["/display", "/desktop/display/index.html"],
    ["/display.html", "/desktop/display/index.html"],
    ["/reception", "/desktop/display/index.html"],
    ["/reception.html", "/desktop/display/index.html"],
    ["/testing", "/desktop/testing/index.html"],
    ["/testing/", "/desktop/testing/index.html"],
    ["/versions", "/desktop/versions/index.html"],
    ["/versions/", "/desktop/versions/index.html"],
    ["/tv-test", "/tv/test/index.html"],
    ["/tv-test/", "/tv/test/index.html"],
    ["/tv.html", "/tv/index.html"],
    ["/tv1.html", "/tv/index.html"],
    ["/v17", "/desktop/versions/index.html"],
    ["/v17/", "/desktop/versions/index.html"],
    ["/v17/doctor", "/desktop/doctor/index.html"],
    ["/v17/doctor/", "/desktop/doctor/index.html"],
    ["/v17/display", "/desktop/display/index.html"],
    ["/v17/display/", "/desktop/display/index.html"],
    ["/v18", "/desktop/index.html"],
    ["/v18/", "/desktop/index.html"],
    ["/v18/doctor", "/desktop/doctor/index.html"],
    ["/v18/doctor/", "/desktop/doctor/index.html"],
    ["/v18/display", "/desktop/display/index.html"],
    ["/v18/display/", "/desktop/display/index.html"],
    ["/v18/tv", "/tv/index.html"],
    ["/v18/tv/", "/tv/index.html"],
    ["/v19", "/desktop/index.html"],
    ["/v19/", "/desktop/index.html"],
    ["/v19/doctor", "/desktop/doctor/index.html"],
    ["/v19/doctor/", "/desktop/doctor/index.html"],
    ["/v19/display", "/desktop/display/index.html"],
    ["/v19/display/", "/desktop/display/index.html"],
    ["/v19/tv", "/tv/index.html"],
    ["/v19/tv/", "/tv/index.html"],
    ["/v20", "/desktop/versions/index.html"],
    ["/v20/", "/desktop/versions/index.html"],
    ["/v20/doctor", "/desktop/doctor/index.html"],
    ["/v20/doctor/", "/desktop/doctor/index.html"],
    ["/v20/display", "/desktop/display/index.html"],
    ["/v20/display/", "/desktop/display/index.html"]
]);

export function rewritePageUrl(requestUrl) {
    const url = new URL(requestUrl, "http://localhost");
    const legacyPagePath = legacyPageRoutes.get(url.pathname);

    if (legacyPagePath) {
        url.pathname = legacyPagePath;
    } else {
        const versionRoot = url.pathname.match(/^\/(v\d+)\/?$/);
        if (versionRoot) {
            url.pathname = "/desktop/versions/index.html";
        }
    }

    return `${url.pathname}${url.search}`;
}
