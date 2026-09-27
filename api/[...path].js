const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(
    process.cwd(),
    "data.json"
);

function readData() {
    const file = fs.readFileSync(
        DATA_FILE,
        "utf8"
    );

    return JSON.parse(file);
}

module.exports = async (req, res) => {
    res.setHeader(
        "Cache-Control",
        "no-store"
    );

    const requestPath =
        req.url.split("?")[0];

    // GET /api/data
    if (
        req.method === "GET" &&
        requestPath === "/api/data"
    ) {
        try {
            const data = readData();

            return res.status(200).json({
                success: true,
                data
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                success: false,
                message:
                    "Gagal membaca data."
            });
        }
    }

    // GET /api/status
    if (
        req.method === "GET" &&
        requestPath === "/api/status"
    ) {
        return res.status(200).json({
            success: true,
            message:
                "Server Mas Ijun aktif."
        });
    }

    return res.status(404).json({
        success: false,
        message: "API tidak ditemukan."
    });
};