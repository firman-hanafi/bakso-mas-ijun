let businessData = null;

let cart = [];


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
// HARI
// =========================================

const dayNames = [
    "minggu",
    "senin",
    "selasa",
    "rabu",
    "kamis",
    "jumat",
    "sabtu"
];


// =========================================
// DAPATKAN HARI SEKARANG
// =========================================

function getTodayName() {

    return dayNames[
        new Date().getDay()
    ];

}


// =========================================
// KONVERSI JAM KE MENIT
// =========================================

function timeToMinutes(time) {

    if (!time) return null;


    const parts =
        time
            .split(".")
            .map(Number);


    if (
        parts.length !== 2 ||
        !Number.isFinite(parts[0]) ||
        !Number.isFinite(parts[1])
    ) {

        return null;

    }


    return (
        parts[0] * 60 +
        parts[1]
    );

}


// =========================================
// CEK STATUS OTOMATIS
// =========================================

function getAutomaticStatus(schedule) {

    if (!schedule) {

        return {
            type: "closed",
            text: "Tidak Jualan Hari Ini"
        };

    }


    const now =
        new Date();


    const currentMinutes =
        now.getHours() * 60 +
        now.getMinutes();


    const openMinutes =
        timeToMinutes(
            schedule.open
        );


    const closeMinutes =
        timeToMinutes(
            schedule.close
        );


    if (
        openMinutes === null ||
        closeMinutes === null
    ) {

        return {
            type: "unknown",
            text: "Jadwal Tidak Valid"
        };

    }


    if (
        currentMinutes >= openMinutes &&
        currentMinutes < closeMinutes
    ) {

        return {
            type: "open",
            text: "Sedang Jualan"
        };

    }


    if (
        currentMinutes < openMinutes
    ) {

        return {
            type: "before-open",
            text: "Belum Jualan"
        };

    }


    return {
        type: "after-close",
        text: "Di luar jam jualan"
    };

}


// =========================================
// LOAD DATA WEBSITE
// =========================================

async function loadWebsiteData() {

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
                "Gagal mengambil data website."
            );

        }


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                "Data website tidak tersedia."
            );

        }


        businessData =
            result.data;


        if (!businessData.status) {

            businessData.status = {

                type: "auto",

                message: ""

            };

        }


        if (!businessData.menu) {

            businessData.menu = [];

        }


        /*
         * Pastikan setiap menu mempunyai
         * nilai available.
         */

        businessData.menu =
            businessData.menu.map(
                item => ({

                    ...item,

                    available:
                        item.available !== false

                })
            );


        /*
         * Bersihkan keranjang dari menu
         * yang sekarang sudah habis.
         */

        cart =
            cart.filter(
                cartItem => {

                    const product =
                        businessData.menu.find(
                            item =>
                                item.id === cartItem.id
                        );


                    return (
                        product &&
                        product.available
                    );

                }
            );


        renderTodaySchedule();

        renderAnnouncement();

        renderMenu();

        renderCart();

        renderSchedule();

        renderBusinessInfo();

        renderCurrentYear();


    } catch (error) {

        console.error(error);


        document.body.insertAdjacentHTML(
            "afterbegin",
            `
            <div class="website-error">
                Gagal memuat data website.
                Silakan refresh halaman.
            </div>
            `
        );

    }

}


// =========================================
// INFORMASI USAHA
// =========================================

function renderBusinessInfo() {

    if (!businessData) return;


    const nameElements =
        document.querySelectorAll(
            "[data-business-name]"
        );


    nameElements.forEach(
        element => {

            element.textContent =
                businessData.business.name;

        }
    );


    const descriptionElements =
        document.querySelectorAll(
            "[data-business-description]"
        );


    descriptionElements.forEach(
        element => {

            element.textContent =
                businessData.business.description;

        }
    );

}


// =========================================
// HARI INI
// =========================================

function renderTodaySchedule() {

    const todayStatus =
        document.getElementById(
            "today-status"
        );


    const todayLocation =
        document.getElementById(
            "today-location"
        );


    const todayHours =
        document.getElementById(
            "today-hours"
        );


    const scheduleNote =
        document.getElementById(
            "schedule-note"
        );


    const todayMaps =
        document.getElementById(
            "today-maps"
        );


    if (!todayStatus) return;


    const todayName =
        getTodayName();


    const today =
        businessData.schedule?.[
            todayName
        ];


    if (scheduleNote) {

        scheduleNote.textContent =
            businessData.business.scheduleNote || "";

    }


    // =====================================
    // HARI TANPA JADWAL
    // =====================================

    if (!today) {

        todayStatus.textContent =
            "Tidak Jualan Hari Ini";


        todayLocation.textContent =
            "Hari ini tidak tercantum dalam jadwal.";


        todayHours.textContent =
            "";


        if (todayMaps) {

            todayMaps.href =
                "#";

            todayMaps.style.display =
                "none";

        }


        return;

    }


    // =====================================
    // LOKASI DAN JAM
    // =====================================

    todayLocation.textContent =
        today.location;


    todayHours.textContent =
        `Jam: ${today.open} – ${today.close}`;


    // =====================================
    // GOOGLE MAPS
    // =====================================

    if (todayMaps) {

        if (today.maps) {

            todayMaps.href =
                today.maps;

            todayMaps.style.display =
                "inline-flex";

        } else {

            todayMaps.href =
                "#";

            todayMaps.style.display =
                "none";

        }

    }


    // =====================================
    // STATUS
    // =====================================

    const status =
        businessData.status || {

            type: "auto",

            message: ""

        };


    let statusText =
        "";


    // =====================================
    // STATUS MANUAL: LIBUR
    // =====================================

    if (
        status.type === "holiday"
    ) {

        statusText =
            "Libur / Tutup Hari Ini";

    }


    // =====================================
    // STATUS MANUAL: TUTUP
    // =====================================

    else if (
        status.type === "closed"
    ) {

        statusText =
            "Tidak Jualan Hari Ini";

    }


    // =====================================
    // STATUS MANUAL: BUKA
    // =====================================

    else if (
        status.type === "open"
    ) {

        statusText =
            "Sedang Jualan";

    }


    // =====================================
    // STATUS OTOMATIS
    // =====================================

    else {

        const automaticStatus =
            getAutomaticStatus(
                today
            );


        statusText =
            automaticStatus.text;

    }


    todayStatus.textContent =
        statusText;


    // =====================================
    // PESAN TAMBAHAN
    // =====================================

    if (status.message) {

        todayHours.textContent +=
            ` — ${status.message}`;

    }

}


// =========================================
// UPDATE STATUS OTOMATIS
// =========================================

function updateAutomaticStatus() {

    if (!businessData) return;


    const status =
        businessData.status || {

            type: "auto",

            message: ""

        };


    /*
     * Kalau admin memilih status manual,
     * jangan mengubahnya.
     */

    if (
        status.type !== "auto"
    ) {

        return;

    }


    renderTodaySchedule();

}


// =========================================
// PENGUMUMAN
// =========================================

function renderAnnouncement() {

    const section =
        document.getElementById(
            "announcement-section"
        );


    const text =
        document.getElementById(
            "announcement-text"
        );


    if (!section || !text) return;


    const announcement =
        businessData.announcement || "";


    if (!announcement.trim()) {

        section.hidden =
            true;

        text.textContent =
            "";

        return;

    }


    section.hidden =
        false;


    text.textContent =
        announcement;

}


// =========================================
// MENU
// =========================================

function renderMenu() {

    const menuList =
        document.getElementById(
            "menu-list"
        );


    if (!menuList) return;


    menuList.innerHTML =
        "";


    [...businessData.menu]
        .sort(
            (a, b) =>
                a.price - b.price
        )
        .forEach(
            item => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "menu-card";


                const buttonHTML =
                    item.available

                        ? `
                            <button
                                class="menu-add"
                                type="button"
                                data-id="${item.id}"
                            >
                                Tambah
                            </button>
                        `

                        : `
                            <button
                                class="menu-add menu-sold-out"
                                type="button"
                                disabled
                            >
                                Sedang Habis
                            </button>
                        `;


                card.innerHTML = `

                    <div class="menu-image">

                        <img
                            src="${item.image}"
                            alt="${item.name}"
                            loading="lazy"
                        >

                    </div>


                    <div class="menu-info">

                        <h3 class="menu-name">
                            ${item.name}
                        </h3>


                        <p class="menu-price">
                            ${formatRupiah(item.price)}
                        </p>


                        ${buttonHTML}

                    </div>

                `;


                menuList.appendChild(
                    card
                );

            }
        );


    /*
     * Aktifkan tombol Tambah.
     */

    document
        .querySelectorAll(
            ".menu-add:not([disabled])"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            Number(
                                button.dataset.id
                            );


                        addToCart(id);

                    }
                );

            }
        );

}


// =========================================
// TAMBAH KE KERANJANG
// =========================================

function addToCart(id) {

    if (!businessData) return;


    const product =
        businessData.menu.find(
            item =>
                item.id === id
        );


    if (!product) return;


    if (!product.available) {

        return;

    }


    const existingItem =
        cart.find(
            item =>
                item.id === id
        );


    if (existingItem) {

        existingItem.quantity += 1;

    } else {

        cart.push({

            id:
                product.id,

            name:
                product.name,

            price:
                product.price,

            quantity:
                1

        });

    }


    renderCart();

}


// =========================================
// UBAH JUMLAH
// =========================================

function changeQuantity(
    id,
    change
) {

    const item =
        cart.find(
            product =>
                product.id === id
        );


    if (!item) return;


    if (businessData) {

        const product =
            businessData.menu.find(
                menuItem =>
                    menuItem.id === id
            );


        if (
            !product ||
            !product.available
        ) {

            cart =
                cart.filter(
                    product =>
                        product.id !== id
                );


            renderCart();

            return;

        }

    }


    item.quantity +=
        change;


    if (
        item.quantity <= 0
    ) {

        cart =
            cart.filter(
                product =>
                    product.id !== id
            );

    }


    renderCart();

}


// =========================================
// RENDER KERANJANG
// =========================================

function renderCart() {

    const cartItems =
        document.getElementById(
            "cart-items"
        );


    const cartTotal =
        document.getElementById(
            "cart-total"
        );


    const whatsappButton =
        document.getElementById(
            "whatsapp-order"
        );


    if (!cartItems) return;


    /*
     * Bersihkan item yang sudah tidak tersedia.
     */

    if (businessData) {

        cart =
            cart.filter(
                cartItem => {

                    const product =
                        businessData.menu.find(
                            item =>
                                item.id === cartItem.id
                        );


                    return (
                        product &&
                        product.available
                    );

                }
            );

    }


    if (cart.length === 0) {

        cartItems.innerHTML =
            `
            <p class="empty-cart">
                Belum ada menu yang dipilih.
            </p>
            `;


        if (cartTotal) {

            cartTotal.textContent =
                "Rp0";

        }


        if (whatsappButton) {

            whatsappButton.disabled =
                true;

        }


        return;

    }


    if (whatsappButton) {

        whatsappButton.disabled =
            false;

    }


    cartItems.innerHTML =
        "";


    let total =
        0;


    cart.forEach(
        item => {

            const subtotal =
                item.price *
                item.quantity;


            total +=
                subtotal;


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "cart-item";


            element.innerHTML = `

                <div>

                    <div class="cart-item-name">
                        ${item.name}
                    </div>

                    <div class="cart-item-price">
                        ${formatRupiah(item.price)}
                        × ${item.quantity}
                    </div>

                </div>


                <div class="cart-controls">

                    <button
                        type="button"
                        data-id="${item.id}"
                        data-change="-1"
                    >
                        −
                    </button>


                    <span class="cart-quantity">
                        ${item.quantity}
                    </span>


                    <button
                        type="button"
                        data-id="${item.id}"
                        data-change="1"
                    >
                        +
                    </button>

                </div>

            `;


            cartItems.appendChild(
                element
            );

        }
    );


    if (cartTotal) {

        cartTotal.textContent =
            formatRupiah(total);

    }


    document
        .querySelectorAll(
            ".cart-controls button"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const id =
                            Number(
                                button.dataset.id
                            );


                        const change =
                            Number(
                                button.dataset.change
                            );


                        changeQuantity(
                            id,
                            change
                        );

                    }
                );

            }
        );

}


// =========================================
// VALIDASI KERANJANG
// =========================================

function validateCartAvailability() {

    if (!businessData) {

        return false;

    }


    const unavailableItems =
        cart.filter(
            cartItem => {

                const product =
                    businessData.menu.find(
                        item =>
                            item.id === cartItem.id
                    );


                return (
                    !product ||
                    !product.available
                );

            }
        );


    if (
        unavailableItems.length === 0
    ) {

        return true;

    }


    cart =
        cart.filter(
            cartItem => {

                const product =
                    businessData.menu.find(
                        item =>
                            item.id === cartItem.id
                    );


                return (
                    product &&
                    product.available
                );

            }
        );


    renderCart();


    alert(
        "Ada menu dalam pesanan yang sudah habis. Silakan periksa kembali pesanan kamu."
    );


    return false;

}


// =========================================
// WHATSAPP
// =========================================

function createWhatsAppMessage() {

    if (
        cart.length === 0
    ) {

        return "";

    }


    let message =
        "Halo Mas Ijun, saya ingin memesan:\n\n";


    let total =
        0;


    cart.forEach(
        item => {

            const subtotal =
                item.price *
                item.quantity;


            total +=
                subtotal;


            message +=
                `- ${item.name} x${item.quantity} = ${formatRupiah(subtotal)}\n`;

        }
    );


    message +=
        `\nTotal: ${formatRupiah(total)}`;


    message +=
        "\n\nMohon konfirmasi pesanan saya.";


    return message;

}


function openWhatsApp() {

    if (
        !validateCartAvailability()
    ) {

        return;

    }


    const message =
        createWhatsAppMessage();


    if (!message) return;


    const url =
        `https://wa.me/${businessData.business.whatsapp}?text=${encodeURIComponent(message)}`;


    window.open(
        url,
        "_blank"
    );

}


function openDirectWhatsApp() {

    const message =
        encodeURIComponent(
            "Halo Mas Ijun, saya ingin bertanya tentang menu dan jadwal jualan."
        );


    const url =
        `https://wa.me/${businessData.business.whatsapp}?text=${message}`;


    window.open(
        url,
        "_blank"
    );

}


// =========================================
// TOMBOL WHATSAPP
// =========================================

const whatsappOrder =
    document.getElementById(
        "whatsapp-order"
    );


if (whatsappOrder) {

    whatsappOrder.addEventListener(
        "click",
        openWhatsApp
    );

}


const heroWhatsapp =
    document.getElementById(
        "hero-whatsapp"
    );


if (heroWhatsapp) {

    heroWhatsapp.addEventListener(
        "click",
        event => {

            event.preventDefault();

            openDirectWhatsApp();

        }
    );

}


const contactWhatsapp =
    document.getElementById(
        "contact-whatsapp"
    );


if (contactWhatsapp) {

    contactWhatsapp.addEventListener(
        "click",
        event => {

            event.preventDefault();

            openDirectWhatsApp();

        }
    );

}


// =========================================
// JADWAL
// =========================================

function renderSchedule() {

    const scheduleList =
        document.getElementById(
            "schedule-list"
        );


    if (!scheduleList) return;


    const orderedDays = [

        "senin",
        "selasa",
        "rabu",
        "kamis",
        "jumat",
        "sabtu"

    ];


    const dayLabels = {

        senin:
            "Senin",

        selasa:
            "Selasa",

        rabu:
            "Rabu",

        kamis:
            "Kamis",

        jumat:
            "Jumat",

        sabtu:
            "Sabtu"

    };


    const todayName =
        getTodayName();


    scheduleList.innerHTML =
        "";


    orderedDays.forEach(
        day => {

            const schedule =
                businessData.schedule?.[
                    day
                ];


            if (!schedule) return;


            const row =
                document.createElement(
                    "tr"
                );


            if (
                day === todayName
            ) {

                row.classList.add(
                    "schedule-today"
                );

            }


            row.innerHTML = `

                <td>
                    ${dayLabels[day]}
                </td>

                <td>
                    ${schedule.location}
                </td>

                <td>
                    ${schedule.open}
                    –
                    ${schedule.close}
                </td>

            `;


            scheduleList.appendChild(
                row
            );

        }
    );

}


// =========================================
// TAHUN
// =========================================

function renderCurrentYear() {

    const yearElement =
        document.getElementById(
            "current-year"
        );


    if (!yearElement) return;


    yearElement.textContent =
        new Date().getFullYear();

}


// =========================================
// UPDATE OTOMATIS SETIAP MENIT
// =========================================

setInterval(
    () => {

        updateAutomaticStatus();

    },
    60 * 1000
);


// =========================================
// START
// =========================================

loadWebsiteData();