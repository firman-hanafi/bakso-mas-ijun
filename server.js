const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "data.json");

const MAX_BODY_SIZE = "100kb";

// ================================
// ADMIN
// ================================

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;


// ================================
// MIDDLEWARE
// ================================

app.use(
    cors({
        origin: true
    })
);

app.use(
    express.json({
        limit: MAX_BODY_SIZE
    })
);


// ================================
// STATIC WEBSITE
// ================================

app.use(express.static(__dirname));


// ================================
// ADMIN PAGE
// ================================

app.get("/admin", (req, res) => {
    res.sendFile(
        path.join(__dirname, "admin.html")
    );
});


// ================================
// DATA
// ================================

function readData() {
    const file = fs.readFileSync(
        DATA_FILE,
        "utf8"
    );

    return JSON.parse(file);
}


function saveData(data) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
            data,
            null,
            4
        ),
        "utf8"
    );
}


// ================================
// VALIDASI DATA
// ================================

function validateData(data) {

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        return "Format data tidak valid.";
    }


    // ============================
    // BUSINESS
    // ============================

    if (
        !data.business ||
        typeof data.business !== "object" ||
        Array.isArray(data.business)
    ) {
        return "Data business tidak valid.";
    }


    if (
        typeof data.business.name !== "string" ||
        typeof data.business.description !== "string" ||
        typeof data.business.whatsapp !== "string" ||
        typeof data.business.scheduleNote !== "string"
    ) {
        return "Format data business tidak valid.";
    }


    // ============================
    // MENU
    // ============================

    if (!Array.isArray(data.menu)) {
        return "Data menu tidak valid.";
    }


    if (data.menu.length > 100) {
        return "Jumlah menu terlalu banyak.";
    }


    const menuIds = new Set();
    const menuNames = new Set();


    for (const item of data.menu) {

        if (
            !item ||
            typeof item !== "object" ||
            Array.isArray(item)
        ) {
            return "Format menu tidak valid.";
        }


        if (
            !Number.isInteger(item.id) ||
            item.id < 1
        ) {
            return "ID menu tidak valid.";
        }


        if (menuIds.has(item.id)) {
            return "ID menu tidak boleh duplikat.";
        }

        menuIds.add(item.id);


        if (
            typeof item.name !== "string" ||
            item.name.trim().length < 1 ||
            item.name.length > 200
        ) {
            return "Nama menu tidak valid.";
        }


        const normalizedName =
            item.name.trim().toLowerCase();


        if (menuNames.has(normalizedName)) {
            return "Nama menu tidak boleh duplikat.";
        }

        menuNames.add(normalizedName);


        if (
            !Number.isInteger(item.price) ||
            item.price < 0 ||
            item.price > 100000000
        ) {
            return "Harga menu tidak valid.";
        }


        if (
            typeof item.image !== "string" ||
            item.image.length > 500
        ) {
            return "Gambar menu tidak valid.";
        }


        if (
            typeof item.available !== "boolean"
        ) {
            return "Status ketersediaan menu tidak valid.";
        }
    }


    // ============================
    // SCHEDULE
    // ============================

    if (
        !data.schedule ||
        typeof data.schedule !== "object" ||
        Array.isArray(data.schedule)
    ) {
        return "Data schedule tidak valid.";
    }


    const days = [
        "senin",
        "selasa",
        "rabu",
        "kamis",
        "jumat",
        "sabtu"
    ];


    for (const day of days) {

        const schedule =
            data.schedule[day];


        if (
            !schedule ||
            typeof schedule !== "object" ||
            Array.isArray(schedule)
        ) {
            return `Schedule ${day} tidak valid.`;
        }


        if (
            typeof schedule.location !== "string" ||
            typeof schedule.open !== "string" ||
            typeof schedule.close !== "string" ||
            typeof schedule.maps !== "string"
        ) {
            return `Format schedule ${day} tidak valid.`;
        }


        if (
            schedule.location.length > 300 ||
            schedule.open.length > 20 ||
            schedule.close.length > 20 ||
            schedule.maps.length > 1000
        ) {
            return `Data schedule ${day} terlalu panjang.`;
        }
    }


    // ============================
    // ANNOUNCEMENT
    // ============================

    if (
        typeof data.announcement !== "string"
    ) {
        return "Announcement tidak valid.";
    }


    if (
        data.announcement.length > 1000
    ) {
        return "Announcement terlalu panjang.";
    }


    // ============================
    // STATUS
    // ============================

    if (
        !data.status ||
        typeof data.status !== "object" ||
        Array.isArray(data.status)
    ) {
        return "Data status tidak valid.";
    }


    if (
        typeof data.status.type !== "string" ||
        typeof data.status.message !== "string"
    ) {
        return "Format status tidak valid.";
    }


    if (
        data.status.type.length > 50 ||
        data.status.message.length > 500
    ) {
        return "Data status terlalu panjang.";
    }


    return null;
}


// ================================
// ADMIN AUTH
// ================================

function checkAdmin(req, res, next) {

    const token =
        req.headers["x-admin-token"];


    if (
        !token ||
        !ADMIN_TOKEN ||
        token !== ADMIN_TOKEN
    ) {
        return res.status(401).json({
            success: false,
            message: "Akses admin ditolak."
        });
    }


    next();
}


// ================================
// LOGIN ADMIN
// ================================

app.post(
    "/api/admin/login",
    (req, res) => {

        const {
            username,
            password
        } = req.body || {};


        if (
            typeof username !== "string" ||
            typeof password !== "string"
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Username dan password wajib diisi."
            });
        }


        if (
            username.length > 100 ||
            password.length > 200
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Data login tidak valid."
            });
        }


        if (
            username === ADMIN_USERNAME &&
            password === ADMIN_PASSWORD
        ) {
            return res.json({
                success: true,
                token: ADMIN_TOKEN
            });
        }


        return res.status(401).json({
            success: false,
            message:
                "Username atau password salah."
        });
    }
);


// ================================
// DATA WEBSITE
// ================================

app.get(
    "/api/data",
    (req, res) => {

        try {

            const data = readData();


            res.set(
                "Cache-Control",
                "no-store"
            );


            res.status(200).json({
                success: true,
                data
            });

        } catch (error) {

            console.error(
                "Gagal membaca data:",
                error
            );


            res.status(500).json({
                success: false,
                message:
                    "Gagal membaca data."
            });
        }
    }
);


// ================================
// SIMPAN DATA
// ================================

app.put(
    "/api/data",
    checkAdmin,
    (req, res) => {

        try {

            const newData = req.body;


            const validationError =
                validateData(newData);


            if (validationError) {

                return res.status(400).json({
                    success: false,
                    message:
                        validationError
                });
            }


            saveData(newData);


            res.json({
                success: true,
                message:
                    "Data berhasil disimpan.",
                data: newData
            });

        } catch (error) {

            console.error(
                "Gagal menyimpan data:",
                error
            );


            res.status(500).json({
                success: false,
                message:
                    "Gagal menyimpan data."
            });
        }
    }
);


// ================================
// STATUS SERVER
// ================================

app.get(
    "/api/status",
    (req, res) => {

        res.json({
            success: true,
            message:
                "Server Mas Ijun aktif."
        });
    }
);


// ================================
// SERVER
// ================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `Server Mas Ijun berjalan di port ${PORT}`
        );
    }
);