const SUPABASE_URL = process.env.SUPABASE_URL;

const SUPABASE_KEY =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        return res.status(500).json({
            success: false,
            message: "Konfigurasi Supabase belum tersedia."
        });
    }

    try {
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/website_data?select=id,data`,
            {
                method: "GET",
                headers: {
                    apikey: SUPABASE_KEY,
                    Authorization: `Bearer ${SUPABASE_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        const result = await response.json();

        if (!response.ok) {
            console.error("Supabase error:", result);

            return res.status(500).json({
                success: false,
                message: "Supabase menolak permintaan.",
                supabaseStatus: response.status,
                supabaseError: result
            });
        }

        if (!result.length) {
            return res.status(500).json({
                success: false,
                message: "Supabase terhubung, tetapi tidak mengembalikan data.",
                rows: result.length
            });
        }

        return res.status(200).json({
            success: true,
            data: result[0].data
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan saat menghubungi Supabase.",
            error: error.message
        });
    }
}