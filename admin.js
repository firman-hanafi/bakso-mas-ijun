let websiteData = null;


// =========================================
// LOGIN
// =========================================

let adminToken =
    sessionStorage.getItem(
        "masIjunAdminToken"
    );

const loginPage =
    document.getElementById(
        "login-page"
    );

const dashboardPage =
    document.getElementById(
        "dashboard-page"
    );

const loginForm =
    document.getElementById(
        "admin-login"
    );

const loginMessage =
    document.getElementById(
        "login-message"
    );


loginForm.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        const username =
            document
                .getElementById(
                    "admin-username"
                )
                .value
                .trim();

        const password =
            document
                .getElementById(
                    "admin-password"
                )
                .value;


        try {

            const response =
                await fetch(
                    "/api/admin/login",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                username,
                                password
                            })
                    }
                );


            const result =
                await response.json();


            if (!response.ok) {

                loginMessage.textContent =
                    result.message ||
                    "Login gagal.";

                return;
            }


            adminToken =
                result.token;


            sessionStorage.setItem(
                "masIjunAdminToken",
                adminToken
            );


            loginMessage.textContent =
                "";

            loginPage.hidden =
                true;

            dashboardPage.hidden =
                false;

            loadDashboard();

        } catch (error) {

            console.error(error);

            loginMessage.textContent =
                "Server tidak dapat dihubungi.";
        }
    }
);

// =========================================
// LOGOUT
// =========================================

document
    .getElementById("logout-button")
    .addEventListener(
        "click",
        function () {

            dashboardPage.hidden = true;
            loginPage.hidden = false;

            document
                .getElementById("admin-password")
                .value = "";
        }
    );


// =========================================
// LOAD DATA
// =========================================

async function loadDashboard() {

    try {

        const response =
            await fetch(
                "/api/data?t=" + Date.now(),
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                "Gagal mengambil data."
            );
        }

        const result =
            await response.json();

        if (!result.success) {
            throw new Error(
                "Data tidak tersedia."
            );
        }

        websiteData =
            result.data;

        if (!websiteData.status) {

            websiteData.status = {
                type: "auto",
                message: ""
            };
        }

        if (!websiteData.menu) {
            websiteData.menu = [];
        }

        if (!websiteData.schedule) {
            websiteData.schedule = {};
        }

        renderSummary();
        renderMenu();
        renderBusiness();
        renderSchedule();
        renderStatus();
        renderAnnouncement();

    } catch (error) {

        console.error(error);

        alert(
            "Gagal memuat data website."
        );
    }
}


// =========================================
// DASHBOARD SUMMARY
// =========================================

function renderSummary() {

    const menu =
        websiteData.menu || [];

    const total =
        menu.length;

    const available =
        menu.filter(
            item =>
                item.available !== false
        ).length;

    const unavailable =
        menu.filter(
            item =>
                item.available === false
        ).length;

    document
        .getElementById("summary-total-menu")
        .textContent =
            total;

    document
        .getElementById("summary-available-menu")
        .textContent =
            available;

    document
        .getElementById("summary-unavailable-menu")
        .textContent =
            unavailable;

    let statusText =
        "Otomatis";

    if (websiteData.status) {

        switch (
            websiteData.status.type
        ) {

            case "open":
                statusText =
                    "Jualan";
                break;

            case "closed":
                statusText =
                    "Tutup";
                break;

            case "holiday":
                statusText =
                    "Libur";
                break;

            default:
                statusText =
                    "Otomatis";
        }
    }

    document
        .getElementById("summary-status")
        .textContent =
            statusText;
}


// =========================================
// FORMAT RUPIAH
// =========================================

function formatRupiah(number) {

    return new Intl.NumberFormat(
        "id-ID",
        {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }
    ).format(number);
}


// =========================================
// VALIDASI NAMA MENU
// =========================================

function validateMenuName(name) {

    if (!name) {

        return {
            valid: false,
            message:
                "Nama menu wajib diisi."
        };
    }

    if (name.length < 2) {

        return {
            valid: false,
            message:
                "Nama menu minimal 2 karakter."
        };
    }

    if (name.length > 80) {

        return {
            valid: false,
            message:
                "Nama menu maksimal 80 karakter."
        };
    }

    return {
        valid: true
    };
}


// =========================================
// VALIDASI HARGA
// =========================================

function validateMenuPrice(price) {

    if (!Number.isFinite(price)) {

        return {
            valid: false,
            message:
                "Harga menu harus berupa angka."
        };
    }

    if (price <= 0) {

        return {
            valid: false,
            message:
                "Harga menu harus lebih dari Rp0."
        };
    }

    if (!Number.isInteger(price)) {

        return {
            valid: false,
            message:
                "Harga harus berupa angka bulat."
        };
    }

    if (price > 1000000) {

        return {
            valid: false,
            message:
                "Harga maksimal yang diperbolehkan adalah Rp1.000.000."
        };
    }

    return {
        valid: true
    };
}


// =========================================
// VALIDASI GAMBAR
// =========================================

function validateMenuImage(image) {

    if (!image) {

        return {
            valid: true
        };
    }

    image =
        image.trim();

    if (
        image.startsWith("http://") ||
        image.startsWith("https://") ||
        image.startsWith("//")
    ) {

        return {
            valid: false,
            message:
                "Gunakan path gambar lokal, bukan URL."
        };
    }

    const allowedExtensions =
        /\.(webp|jpg|jpeg|png)$/i;

    if (
        !allowedExtensions.test(image)
    ) {

        return {
            valid: false,
            message:
                "Format gambar harus WEBP, JPG, JPEG, atau PNG."
        };
    }

    if (
        !image.startsWith(
            "assets/images/"
        )
    ) {

        return {
            valid: false,
            message:
                "Path gambar harus berada di folder assets/images/."
        };
    }

    return {
        valid: true
    };
}


// =========================================
// CEK NAMA MENU DUPLIKAT
// =========================================

function isDuplicateMenuName(
    name,
    currentId = null
) {

    const normalizedName =
        name
            .trim()
            .toLowerCase();

    return websiteData.menu.some(
        item => {

            if (
                currentId !== null &&
                Number(item.id) ===
                    Number(currentId)
            ) {
                return false;
            }

            return (
                String(item.name)
                    .trim()
                    .toLowerCase() ===
                normalizedName
            );
        }
    );
}


// =========================================
// VALIDASI WAKTU
// =========================================

function parseScheduleTime(time) {

    const value =
        String(time).trim();

    const match =
        value.match(
            /^([01]\d|2[0-3])\.([0-5]\d)$/
        );

    if (!match) {
        return null;
    }

    const hour =
        Number(match[1]);

    const minute =
        Number(match[2]);

    return (
        hour * 60 +
        minute
    );
}


// =========================================
// VALIDASI JADWAL
// =========================================

function validateSchedule(
    schedule,
    dayLabel
) {

    const location =
        String(
            schedule.location || ""
        ).trim();

    const open =
        String(
            schedule.open || ""
        ).trim();

    const close =
        String(
            schedule.close || ""
        ).trim();

    const maps =
        String(
            schedule.maps || ""
        ).trim();


    // Lokasi wajib

    if (!location) {

        return {
            valid: false,
            message:
                `Lokasi untuk ${dayLabel} wajib diisi.`
        };
    }


    // Jam buka

    const openMinutes =
        parseScheduleTime(open);

    if (openMinutes === null) {

        return {
            valid: false,
            message:
                `Jam buka ${dayLabel} tidak valid.\nGunakan format HH.MM, contoh 16.00.`
        };
    }


    // Jam tutup

    const closeMinutes =
        parseScheduleTime(close);

    if (closeMinutes === null) {

        return {
            valid: false,
            message:
                `Jam tutup ${dayLabel} tidak valid.\nGunakan format HH.MM, contoh 22.00.`
        };
    }


    // Buka harus sebelum tutup

    if (
        openMinutes >= closeMinutes
    ) {

        return {
            valid: false,
            message:
                `Jam buka ${dayLabel} harus lebih awal daripada jam tutup.`
        };
    }


    // Google Maps boleh kosong

    if (maps) {

        try {

            const url =
                new URL(maps);

            if (
                url.protocol !== "http:" &&
                url.protocol !== "https:"
            ) {

                return {
                    valid: false,
                    message:
                        `Link Google Maps untuk ${dayLabel} tidak valid.`
                };
            }

        } catch (error) {

            return {
                valid: false,
                message:
                    `Link Google Maps untuk ${dayLabel} tidak valid.`
            };
        }
    }

    return {
        valid: true
    };
}


// =========================================
// RENDER MENU
// =========================================

function renderMenu() {

    const menuList =
        document.getElementById(
            "admin-menu-list"
        );

    menuList.innerHTML = "";

    if (
        !websiteData.menu ||
        websiteData.menu.length === 0
    ) {

        menuList.innerHTML =
            `
            <p>
                Belum ada menu.
            </p>
            `;

        return;
    }

    websiteData.menu.forEach(
        item => {

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "admin-menu-card";

            card.innerHTML =
                `
                <div class="admin-menu-info">

                    <strong>
                        ${item.name}
                    </strong>

                    <span>
                        ${formatRupiah(item.price)}
                    </span>

                    <small>
                        ${
                            item.available !== false
                                ? "Tersedia"
                                : "Habis"
                        }
                    </small>

                </div>

                <div class="admin-menu-actions">

                    <button
                        type="button"
                        class="secondary-button"
                        data-edit="${item.id}"
                    >
                        Edit
                    </button>

                    <button
                        type="button"
                        class="danger-button"
                        data-delete="${item.id}"
                    >
                        Hapus
                    </button>

                    <label>

                        <input
                            type="checkbox"
                            data-available="${item.id}"
                            ${
                                item.available !== false
                                    ? "checked"
                                    : ""
                            }
                        >

                        Tersedia

                    </label>

                </div>
                `;

            menuList.appendChild(
                card
            );
        }
    );


    // EDIT

    document
        .querySelectorAll(
            "[data-edit]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        openEditMenu(
                            Number(
                                button.dataset.edit
                            )
                        );
                    }
                );
            }
        );


    // DELETE

    document
        .querySelectorAll(
            "[data-delete]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        deleteMenu(
                            Number(
                                button.dataset.delete
                            )
                        );
                    }
                );
            }
        );


    // AVAILABLE

    document
        .querySelectorAll(
            "[data-available]"
        )
        .forEach(
            checkbox => {

                checkbox.addEventListener(
                    "change",
                    async () => {

                        const id =
                            Number(
                                checkbox.dataset.available
                            );

                        const item =
                            websiteData.menu.find(
                                menu =>
                                    Number(menu.id) ===
                                    id
                            );

                        if (!item) return;

                        item.available =
                            checkbox.checked;

                        const saved =
                            await saveData();

                        if (saved) {

                            renderMenu();
                            renderSummary();
                        }
                    }
                );
            }
        );
}


// =========================================
// TAMBAH MENU
// =========================================

document
    .getElementById(
        "add-menu-button"
    )
    .addEventListener(
        "click",
        openAddMenu
    );


function openAddMenu() {

    document
        .getElementById(
            "menu-modal-title"
        )
        .textContent =
            "Tambah Menu";

    document
        .getElementById(
            "menu-id"
        )
        .value = "";

    document
        .getElementById(
            "menu-name"
        )
        .value = "";

    document
        .getElementById(
            "menu-price"
        )
        .value = "";

    document
        .getElementById(
            "menu-image"
        )
        .value = "";

    document
        .getElementById(
            "menu-available"
        )
        .checked = true;

    document
        .getElementById(
            "menu-modal"
        )
        .hidden = false;
}


// =========================================
// EDIT MENU
// =========================================

function openEditMenu(id) {

    const item =
        websiteData.menu.find(
            menu =>
                Number(menu.id) === id
        );

    if (!item) return;

    document
        .getElementById(
            "menu-modal-title"
        )
        .textContent =
            "Edit Menu";

    document
        .getElementById(
            "menu-id"
        )
        .value =
            item.id;

    document
        .getElementById(
            "menu-name"
        )
        .value =
            item.name;

    document
        .getElementById(
            "menu-price"
        )
        .value =
            item.price;

    document
        .getElementById(
            "menu-image"
        )
        .value =
            item.image || "";

    document
        .getElementById(
            "menu-available"
        )
        .checked =
            item.available !== false;

    document
        .getElementById(
            "menu-modal"
        )
        .hidden = false;
}


// =========================================
// TUTUP MODAL
// =========================================

function closeMenuModal() {

    document
        .getElementById(
            "menu-modal"
        )
        .hidden = true;
}


document
    .getElementById(
        "close-menu-modal"
    )
    .addEventListener(
        "click",
        closeMenuModal
    );


document
    .getElementById(
        "cancel-menu"
    )
    .addEventListener(
        "click",
        closeMenuModal
    );


// =========================================
// SIMPAN MENU
// =========================================

document
    .getElementById(
        "menu-form"
    )
    .addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const idValue =
                document
                    .getElementById(
                        "menu-id"
                    )
                    .value;

            const currentId =
                idValue
                    ? Number(idValue)
                    : null;

            const name =
                document
                    .getElementById(
                        "menu-name"
                    )
                    .value
                    .trim();

            const price =
                Number(
                    document
                        .getElementById(
                            "menu-price"
                        )
                        .value
                );

            const image =
                document
                    .getElementById(
                        "menu-image"
                    )
                    .value
                    .trim();

            const available =
                document
                    .getElementById(
                        "menu-available"
                    )
                    .checked;


            // Nama

            const nameValidation =
                validateMenuName(
                    name
                );

            if (
                !nameValidation.valid
            ) {

                alert(
                    nameValidation.message
                );

                return;
            }


            // Duplikat

            if (
                isDuplicateMenuName(
                    name,
                    currentId
                )
            ) {

                alert(
                    "Nama menu tersebut sudah digunakan."
                );

                return;
            }


            // Harga

            const priceValidation =
                validateMenuPrice(
                    price
                );

            if (
                !priceValidation.valid
            ) {

                alert(
                    priceValidation.message
                );

                return;
            }


            // Gambar

            const imageValidation =
                validateMenuImage(
                    image
                );

            if (
                !imageValidation.valid
            ) {

                alert(
                    imageValidation.message
                );

                return;
            }


            // UPDATE

            if (idValue) {

                const id =
                    Number(idValue);

                const item =
                    websiteData.menu.find(
                        menu =>
                            Number(menu.id) === id
                    );

                if (!item) {

                    alert(
                        "Menu yang ingin diedit tidak ditemukan."
                    );

                    return;
                }

                item.name =
                    name;

                item.price =
                    price;

                item.image =
                    image;

                item.available =
                    available;

            } else {

                // TAMBAH

                const ids =
                    websiteData.menu
                        .map(
                            item =>
                                Number(item.id)
                        )
                        .filter(
                            id =>
                                Number.isFinite(id)
                        );

                const newId =
                    ids.length > 0
                        ? Math.max(...ids) + 1
                        : 1;

                websiteData.menu.push({

                    id:
                        newId,

                    name:
                        name,

                    price:
                        price,

                    image:
                        image,

                    available:
                        available
                });
            }


            const saved =
                await saveData();

            if (saved) {

                closeMenuModal();

                renderMenu();

                renderSummary();

                alert(
                    "Menu berhasil disimpan."
                );
            }
        }
    );


// =========================================
// HAPUS MENU
// =========================================

async function deleteMenu(id) {

    const item =
        websiteData.menu.find(
            menu =>
                Number(menu.id) === id
        );

    if (!item) return;

    const confirmed =
        confirm(
            `Hapus menu "${item.name}"?`
        );

    if (!confirmed) return;

    websiteData.menu =
        websiteData.menu.filter(
            menu =>
                Number(menu.id) !== id
        );

    const saved =
        await saveData();

    if (saved) {

        renderMenu();

        renderSummary();

        alert(
            "Menu berhasil dihapus."
        );
    }
}


// =========================================
// SIMPAN DATA
// =========================================

async function saveData() {

    try {

        const response =
            await fetch(
                "/api/data",
                {
                    method: "PUT",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "x-admin-token":
                            adminToken
                    },

                    body:
                        JSON.stringify(
                            websiteData
                        )
                }
            );


        const result =
            await response.json();


        if (response.status === 401) {

            alert(
                "Sesi admin sudah tidak valid. Silakan login kembali."
            );

            sessionStorage.removeItem(
                "masIjunAdminToken"
            );

            location.reload();

            return false;
        }


        if (!result.success) {

            throw new Error(
                result.message ||
                "Gagal menyimpan."
            );
        }


        return true;

    } catch (error) {

        console.error(error);

        alert(
            "Gagal menyimpan data."
        );

        return false;
    }
}

// =========================================
// INFORMASI USAHA
// =========================================

function renderBusiness() {

    if (!websiteData.business) {
        websiteData.business = {};
    }

    document
        .getElementById(
            "business-name"
        )
        .value =
            websiteData.business.name || "";

    document
        .getElementById(
            "business-description"
        )
        .value =
            websiteData.business.description || "";

    document
        .getElementById(
            "business-whatsapp"
        )
        .value =
            websiteData.business.whatsapp || "";
}


document
    .getElementById(
        "save-business"
    )
    .addEventListener(
        "click",
        async () => {

            websiteData.business.name =
                document
                    .getElementById(
                        "business-name"
                    )
                    .value
                    .trim();

            websiteData.business.description =
                document
                    .getElementById(
                        "business-description"
                    )
                    .value
                    .trim();

            websiteData.business.whatsapp =
                document
                    .getElementById(
                        "business-whatsapp"
                    )
                    .value
                    .trim();

            const saved =
                await saveData();

            if (saved) {

                alert(
                    "Informasi usaha berhasil disimpan."
                );
            }
        }
    );


// =========================================
// JADWAL
// =========================================

function renderSchedule() {

    const scheduleList =
        document.getElementById(
            "admin-schedule-list"
        );

    scheduleList.innerHTML =
        "";

    const days = [
        ["senin", "Senin"],
        ["selasa", "Selasa"],
        ["rabu", "Rabu"],
        ["kamis", "Kamis"],
        ["jumat", "Jumat"],
        ["sabtu", "Sabtu"]
    ];

    days.forEach(
        ([key, label]) => {

            const schedule =
                websiteData.schedule[key];

            if (!schedule) return;

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "admin-schedule-card";

            card.innerHTML =
                `
                <div class="schedule-day">
                    ${label}
                </div>

                <div class="schedule-fields">

                    <div class="form-group">
                        <label>
                            Lokasi
                        </label>

                        <input
                            type="text"
                            class="schedule-location"
                            data-day="${key}"
                            value="${escapeHtmlAttribute(schedule.location || "")}"
                        >
                    </div>

                    <div class="schedule-time-row">

                        <div class="form-group">
                            <label>
                                Buka
                            </label>

                            <input
                                type="text"
                                class="schedule-open"
                                data-day="${key}"
                                value="${escapeHtmlAttribute(schedule.open || "")}"
                                placeholder="16.00"
                            >
                        </div>

                        <div class="form-group">
                            <label>
                                Tutup
                            </label>

                            <input
                                type="text"
                                class="schedule-close"
                                data-day="${key}"
                                value="${escapeHtmlAttribute(schedule.close || "")}"
                                placeholder="22.00"
                            >
                        </div>

                    </div>

                    <div class="form-group">
                        <label>
                            Link Google Maps
                        </label>

                        <input
                            type="url"
                            class="schedule-maps"
                            data-day="${key}"
                            value="${escapeHtmlAttribute(schedule.maps || "")}"
                            placeholder="https://maps.app.goo.gl/..."
                        >
                    </div>

                </div>
                `;

            scheduleList.appendChild(
                card
            );
        }
    );
}


// =========================================
// ESCAPE ATTRIBUTE
// =========================================

function escapeHtmlAttribute(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}


// =========================================
// SIMPAN JADWAL
// =========================================

document
    .getElementById(
        "save-schedule"
    )
    .addEventListener(
        "click",
        async () => {

            const days = [
                ["senin", "Senin"],
                ["selasa", "Selasa"],
                ["rabu", "Rabu"],
                ["kamis", "Kamis"],
                ["jumat", "Jumat"],
                ["sabtu", "Sabtu"]
            ];

            const newSchedules = {};


            // =====================================
            // AMBIL + VALIDASI SEMUA DATA
            // =====================================

            for (
                const [key, label]
                of days
            ) {

                const currentSchedule =
                    websiteData.schedule[key];

                if (!currentSchedule) {
                    continue;
                }

                const locationInput =
                    document.querySelector(
                        `.schedule-location[data-day="${key}"]`
                    );

                const openInput =
                    document.querySelector(
                        `.schedule-open[data-day="${key}"]`
                    );

                const closeInput =
                    document.querySelector(
                        `.schedule-close[data-day="${key}"]`
                    );

                const mapsInput =
                    document.querySelector(
                        `.schedule-maps[data-day="${key}"]`
                    );

                const newSchedule = {

                    location:
                        locationInput
                            ? locationInput.value.trim()
                            : "",

                    open:
                        openInput
                            ? openInput.value.trim()
                            : "",

                    close:
                        closeInput
                            ? closeInput.value.trim()
                            : "",

                    maps:
                        mapsInput
                            ? mapsInput.value.trim()
                            : ""
                };


                const validation =
                    validateSchedule(
                        newSchedule,
                        label
                    );

                if (
                    !validation.valid
                ) {

                    alert(
                        validation.message
                    );

                    return;
                }

                newSchedules[key] =
                    newSchedule;
            }


            // =====================================
            // SEMUA VALID
            // =====================================

            Object.keys(
                newSchedules
            ).forEach(
                key => {

                    websiteData
                        .schedule[key] =
                        newSchedules[key];
                }
            );


            // =====================================
            // SIMPAN
            // =====================================

            const saved =
                await saveData();

            if (saved) {

                alert(
                    "Jadwal dan lokasi berhasil disimpan."
                );
            }
        }
    );


// =========================================
// STATUS JUALAN
// =========================================

function renderStatus() {

    if (!websiteData.status) {

        websiteData.status = {
            type: "auto",
            message: ""
        };
    }

    document
        .getElementById(
            "business-status"
        )
        .value =
            websiteData.status.type;

    document
        .getElementById(
            "status-message"
        )
        .value =
            websiteData.status.message || "";
}


document
    .getElementById(
        "save-status"
    )
    .addEventListener(
        "click",
        async () => {

            websiteData.status = {

                type:
                    document
                        .getElementById(
                            "business-status"
                        )
                        .value,

                message:
                    document
                        .getElementById(
                            "status-message"
                        )
                        .value
                        .trim()
            };

            const saved =
                await saveData();

            if (saved) {

                renderSummary();

                alert(
                    "Status jualan berhasil disimpan."
                );
            }
        }
    );


// =========================================
// PENGUMUMAN
// =========================================

function renderAnnouncement() {

    document
        .getElementById(
            "announcement"
        )
        .value =
            websiteData.announcement || "";
}


document
    .getElementById(
        "save-announcement"
    )
    .addEventListener(
        "click",
        async () => {

            websiteData.announcement =
                document
                    .getElementById(
                        "announcement"
                    )
                    .value
                    .trim();

            const saved =
                await saveData();

            if (saved) {

                alert(
                    "Pengumuman berhasil disimpan."
                );
            }
        }
    );