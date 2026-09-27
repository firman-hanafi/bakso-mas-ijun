const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({
            success: false,
            message: "Konfigurasi Supabase belum tersedia."
        });
    }

    try {
        if (req.method === "GET") {
            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/website_data?id=eq.1&select=data`,
                {
                    headers: {
                        apikey: SUPABASE_KEY,
                        Authorization: `Bearer ${SUPABASE_KEY}`
                    }
                }
            );

            const result = await response.json();

            if (!response.ok || !result.length) {
                return res.status(500).json({
                    success: false,
                    message: "Data website tidak ditemukan."
                });
            }

            return res.status(200).json({
                success: true,
                data: result[0].data
            });
        }

        if (req.method === "PUT") {
            const token = req.headers["x-admin-token"];

            if (
                !token ||
                token !== process.env.ADMIN_TOKEN
            ) {
                return res.status(401).json({
                    success: false,
                    message: "Akses admin ditolak."
                });
            }

            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/website_data?id=eq.1`,
                {
                    method: "PATCH",
                    headers: {
                        apikey: SUPABASE_KEY,
                        Authorization: `Bearer ${SUPABASE_KEY}`,
                        "Content-Type": "application/json",
                        Prefer: "return=representation"
                    },
                    body: JSON.stringify({
                        data: req.body,
                        updated_at: new Date().toISOString()
                    })
                }
            );

            const result = await response.json();

            if (!response.ok) {
                console.error(result);

                return res.status(500).json({
                    success: false,
                    message: "Gagal menyimpan data ke Supabase."
                });
            }

            return res.status(200).json({
                success: true,
                message: "Data berhasil disimpan.",
                data: req.body
            });
        }

        return res.status(405).json({
            success: false,
            message: "Method tidak diizinkan."
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server."
        });
    }
}