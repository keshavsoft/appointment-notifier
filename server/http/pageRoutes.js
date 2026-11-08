const pageRoutes = new Map([
    ["/", "v2/doctor.html"],
    ["/doctor", "v2/doctor.html"],
    ["/doctor.html", "v2/doctor.html"],
    ["/display", "v2/display.html"],
    ["/display.html", "v2/display.html"],
    ["/reception", "v2/reception.html"],
    ["/reception.html", "v2/reception.html"],
    ["/v1", "v1/doctor.html"],
    ["/v1/", "v1/doctor.html"],
    ["/v1/doctor", "v1/doctor.html"],
    ["/v1/doctor.html", "v1/doctor.html"],
    ["/v1/display", "v1/display.html"],
    ["/v1/display.html", "v1/display.html"],
    ["/v1/reception", "v1/reception.html"],
    ["/v1/reception.html", "v1/reception.html"],
    ["/v2", "v2/doctor.html"],
    ["/v2/", "v2/doctor.html"],
    ["/v2/doctor", "v2/doctor.html"],
    ["/v2/doctor.html", "v2/doctor.html"],
    ["/v2/display", "v2/display.html"],
    ["/v2/display.html", "v2/display.html"],
    ["/v2/reception", "v2/reception.html"],
    ["/v2/reception.html", "v2/reception.html"],
    ["/v3", "v3/doctor.html"],
    ["/v3/", "v3/doctor.html"],
    ["/v3/doctor", "v3/doctor.html"],
    ["/v3/doctor.html", "v3/doctor.html"],
    ["/v3/display", "v3/display.html"],
    ["/v3/display.html", "v3/display.html"]
]);

export function resolvePublicPath(pathname) {
    return pageRoutes.get(pathname) ?? pathname.replace(/^\/+/, "");
}
