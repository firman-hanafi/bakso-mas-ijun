const RAW_SUPABASE_URL = process.env.SUPABASE_URL;

const SUPABASE_KEY =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

const SUPABASE_URL = RAW_SUPABASE_URL
    ?.replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "");

const MAX_BODY_SIZE = 100 * 1024; // 100 KB

export default async function handler(req, res) {

    // ================================
    // KONFIGURASI SERVER
    // ================================

    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error(
            "Konfigurasi Supabase belum tersedia."
        );

        return res.status(500).json({
            success: false,
            message: "Terjadi kesalahan server."
        });
    }


    try {

        // ================================
        // METHOD YANG DIIZINKAN
        // ================================

        if (
            req.method !== "GET" &&
            req.method !== "PUT"
        ) {
            return res.status(405).json({
                success: false,
                message: "Method tidak diizinkan."
            });
        }


        // ================================
        // GET DATA WEBSITE
        // ================================

        if (req.method === "GET") {

            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/website_data?select=id,data`,
                {
                    method: "GET",
                    headers: {
                        apikey: SUPABASE_KEY,
                        Authorization:
                            `Bearer ${SUPABASE_KEY}`,
                        "Content-Type":
                            "application/json"
                    }
                }
            );


            const result =
                await response.json();


            if (!response.ok) {

                console.error(
                    "Supabase GET error:",
                    result
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Gagal mengambil data website."
                });
            }


            if (
                !Array.isArray(result) ||
                !result.length ||
                !result[0].data
            ) {

                console.error(
                    "Data website tidak ditemukan."
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Data website tidak ditemukan."
                });
            }


            res.setHeader(
                "Cache-Control",
                "no-store"
            );


            return res.status(200).json({
                success: true,
                data: result[0].data
            });
        }


        // ================================
        // PUT DATA WEBSITE
        // ================================

        if (req.method === "PUT") {

            // ============================
            // CEK ADMIN TOKEN
            // ============================

            const token =
                req.headers["x-admin-token"];


            if (
                !token ||
                !process.env.ADMIN_TOKEN ||
                token !== process.env.ADMIN_TOKEN
            ) {

                return res.status(401).json({
                    success: false,
                    message:
                        "Akses admin ditolak."
                });
            }


            // ============================
            // CEK UKURAN BODY
            // ============================

            const bodyString =
                JSON.stringify(req.body ?? {});


            if (
                Buffer.byteLength(
                    bodyString,
                    "utf8"
                ) > MAX_BODY_SIZE
            ) {

                return res.status(413).json({
                    success: false,
                    message:
                        "Data terlalu besar."
                });
            }


            // ============================
            // VALIDASI DATA UTAMA
            // ============================

            const data = req.body;


            if (
                !data ||
                typeof data !== "object" ||
                Array.isArray(data)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Format data tidak valid."
                });
            }


            // ============================
            // VALIDASI BUSINESS
            // ============================

            if (
                !data.business ||
                typeof data.business !== "object" ||
                Array.isArray(data.business)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Data business tidak valid."
                });
            }


            if (
                typeof data.business.name !== "string" ||
                typeof data.business.description !== "string" ||
                typeof data.business.whatsapp !== "string" ||
                typeof data.business.scheduleNote !== "string"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Format data business tidak valid."
                });
            }


            // ============================
            // VALIDASI MENU
            // ============================

            if (
                !Array.isArray(data.menu)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Data menu tidak valid."
                });
            }


            if (data.menu.length > 100) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Jumlah menu terlalu banyak."
                });
            }


            const menuIds = new Set();
            const menuNames = new Set();


            for (const item of data.menu) {

                if (
                    !item ||
                    typeof item !== "object" ||
                    Array.isArray(item)
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Format menu tidak valid."
                    });
                }


                if (
                    !Number.isInteger(item.id) ||
                    item.id < 1
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "ID menu tidak valid."
                    });
                }


                if (menuIds.has(item.id)) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "ID menu tidak boleh duplikat."
                    });
                }

                menuIds.add(item.id);


                if (
                    typeof item.name !== "string" ||
                    item.name.trim().length < 1 ||
                    item.name.length > 200
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Nama menu tidak valid."
                    });
                }


                const normalizedName =
                    item.name.trim().toLowerCase();


                if (
                    menuNames.has(normalizedName)
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Nama menu tidak boleh duplikat."
                    });
                }

                menuNames.add(normalizedName);


                if (
                    !Number.isInteger(item.price) ||
                    item.price < 0 ||
                    item.price > 100000000
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Harga menu tidak valid."
                    });
                }


                if (
                    typeof item.image !== "string" ||
                    item.image.length > 500
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Gambar menu tidak valid."
                    });
                }


                if (
                    typeof item.available !== "boolean"
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Status ketersediaan menu tidak valid."
                    });
                }
            }


            // ============================
            // VALIDASI SCHEDULE
            // ============================

            if (
                !data.schedule ||
                typeof data.schedule !== "object" ||
                Array.isArray(data.schedule)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Data schedule tidak valid."
                });
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

                    return res.status(400).json({
                        success: false,
                        message:
                            `Schedule ${day} tidak valid.`
                    });
                }


                if (
                    typeof schedule.location !== "string" ||
                    typeof schedule.open !== "string" ||
                    typeof schedule.close !== "string" ||
                    typeof schedule.maps !== "string"
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            `Format schedule ${day} tidak valid.`
                    });
                }


                if (
                    schedule.location.length > 300 ||
                    schedule.open.length > 20 ||
                    schedule.close.length > 20 ||
                    schedule.maps.length > 1000
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            `Data schedule ${day} terlalu panjang.`
                    });
                }
            }


            // ============================
            // VALIDASI ANNOUNCEMENT
            // ============================

            if (
                typeof data.announcement !== "string"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Announcement tidak valid."
                });
            }


            if (
                data.announcement.length > 1000
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Announcement terlalu panjang."
                });
            }


            // ============================
            // VALIDASI STATUS
            // ============================

            if (
                !data.status ||
                typeof data.status !== "object" ||
                Array.isArray(data.status)
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Data status tidak valid."
                });
            }


            if (
                typeof data.status.type !== "string" ||
                typeof data.status.message !== "string"
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Format status tidak valid."
                });
            }


            if (
                data.status.type.length > 50 ||
                data.status.message.length > 500
            ) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Data status terlalu panjang."
                });
            }


            // ============================
            // SIMPAN KE SUPABASE
            // ============================

            const response = await fetch(
                `${SUPABASE_URL}/rest/v1/website_data?id=eq.1`,
                {
                    method: "PATCH",
                    headers: {
                        apikey: SUPABASE_KEY,
                        Authorization:
                            `Bearer ${SUPABASE_KEY}`,
                        "Content-Type":
                            "application/json",
                        Prefer:
                            "return=representation"
                    },
                    body: JSON.stringify({
                        data,
                        updated_at:
                            new Date().toISOString()
                    })
                }
            );


            const result =
                await response.json();


            if (!response.ok) {

                console.error(
                    "Supabase PUT error:",
                    result
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Gagal menyimpan data ke Supabase."
                });
            }


            return res.status(200).json({
                success: true,
                message:
                    "Data berhasil disimpan.",
                data
            });
        }


    } catch (error) {

        console.error(
            "API data error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Terjadi kesalahan server."
        });
    }
}