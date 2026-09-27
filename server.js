const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "data.json");

// ================================
// ADMIN
// ================================

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;


// ================================
// MIDDLEWARE
// ================================

app.use(cors());
app.use(express.json());


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
// ADMIN AUTH
// ================================

function checkAdmin(req, res, next) {
    const token =
        req.headers["x-admin-token"];

    if (!token || token !== ADMIN_TOKEN) {
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
        } = req.body;

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
                data: data
            });

        } catch (error) {

            console.error(error);

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

            saveData(newData);

            res.json({
                success: true,
                message:
                    "Data berhasil disimpan.",
                data: newData
            });

        } catch (error) {

            console.error(error);

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