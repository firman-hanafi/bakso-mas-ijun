const fs = require("fs");
const path = require("path");

module.exports = (req, res) => {
    if (req.method !== "GET") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan."
        });
    }

    try {
        const dataPath = path.join(
            process.cwd(),
            "data.json"
        );

        const data = JSON.parse(
            fs.readFileSync(
                dataPath,
                "utf8"
            )
        );

        res.setHeader(
            "Cache-Control",
            "no-store"
        );

        return res.status(200).json({
            success: true,
            data: data
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message:
                "Gagal membaca data website."
        });
    }
};