export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan."
        });
    }


    const { username, password } =
        req.body || {};


    if (
        typeof username !== "string" ||
        typeof password !== "string"
    ) {
        return res.status(400).json({
            success: false,
            message: "Username dan password wajib diisi."
        });
    }


    if (
        username.length > 100 ||
        password.length > 200
    ) {
        return res.status(400).json({
            success: false,
            message: "Data login tidak valid."
        });
    }


    if (
        username === process.env.ADMIN_USERNAME &&
        password === process.env.ADMIN_PASSWORD
    ) {
        return res.status(200).json({
            success: true,
            token: process.env.ADMIN_TOKEN
        });
    }


    return res.status(401).json({
        success: false,
        message: "Username atau password salah."
    });
}