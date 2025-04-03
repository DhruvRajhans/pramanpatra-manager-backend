var md5 = require('md5');
var configArr = require('../services/config');
var pool = configArr.pool;
writeLogFile = configArr.writeLogFile;

// Controller method for fetching paginated certificate data

module.exports.getPramanpatraData = (req, res) => {
    try {
        const page = parseInt(req.query.page) || 0;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const offset = page * pageSize;

        pool.query('SELECT COUNT(*) as total FROM public.mst_tblpramanpatra', (countErr, countResult) => {
            if (countErr) {
                writeLogFile(countErr, 'getPramanpatraData-count');
                return res.status(400).send("Error fetching certificate count: " + countErr);
            }

            pool.query(`SELECT ROW_NUMBER() OVER (ORDER BY updated_dt DESC) AS INDEX,
                        pramanpatra_id as प्रमाणपत्र_क्रमांक,
                        prakalp_grast_nav as प्रकल्पग्रस्ताचे_नाव,
                        prakalpa_nav as प्रकल्पाचे_नाव,
                        (
                            SELECT  CONCAT(fm->>'name', ' (', fm->>'relation', ')')
                            FROM jsonb_array_elements(familymembers) AS fm
                            WHERE (fm->'pramanpatradharak')::jsonb = 'true'::jsonb
                            LIMIT 1
                        ) AS प्रमाणपत्र_धारक,
                        shet_jamin_gav as शेत_जमिनीचे_गाव ,
                        shet_jamin_serve_gut as शेत_जमिन_सर्वे_गट_क्रमांक ,
                        shet_jamin_shetra as शेत_जमिन_क्षेत्र,
                        budit_malmata_gav as बुडीत_मालमतेचे_गाव ,
                        budit_malmata_ghar_number as बुडीत_मालमतेचा_घर_क्रमांक ,
                        budit_malmata_shetra as बुडीत_मालमतेचे_क्षेत्र ,
                        issue_dt
                    FROM public.mst_tblpramanpatra
                    ORDER BY updated_dt DESC;`, (dataErr, dataResult) => {
                if (dataErr) {
                    writeLogFile(dataErr, 'getPramanpatraData-data');
                    return res.status(400).send("Error fetching certificate data" + dataErr);
                }

                res.status(200).json({
                    total: parseInt(countResult.rows[0].total),
                    data: dataResult.rows,
                    page,
                    pageSize
                });
            });
        });
    } catch (error) {
        writeLogFile(error, 'getPramanpatraData');
        res.status(500).send("Server error while fetching certificate data");
    }
};


module.exports.get_pramanpatra_to_edit = (req, res) => {
    try {
        pool.query(`SELECT *
                    FROM public.mst_tblpramanpatra
                    WHERE pramanpatra_id = $1 `, [req.query.rowId], (dataErr, dataResult) => {
            if (dataErr) {
                writeLogFile(dataErr, 'get_pramanpatra_to_edit-data');
                return res.status(400).send("Error fetching pramanpatra_to_edit data" + dataErr);
            }

            res.status(200).json({
                data: dataResult.rows
            });
        });
    } catch (error) {
        writeLogFile(error, 'get_pramanpatra_to_edit');
        res.status(500).send("Server error while fetching pramanpatra_to_edit data");
    }
};


module.exports.savePramanpatra = async (req, res) => {
    try {
        const query = `
    INSERT INTO public.mst_tblpramanpatra (
        issue_dt,
        prakalp_grast_nav,
        prakalpa_nav,
        grast_gav,
        grast_taluka,
        grast_jilha,
        familymembers,
        grast_pin_code,
        shet_jamin_gav,
        shet_jamin_taluka,
        shet_jamin_jilha,
        shet_jamin_pin_code,
        shet_jamin_serve_gut,
        shet_jamin_shetra,
        budit_malmata_gav,
        budit_malmata_taluka,
        budit_malmata_jilha,
        budit_malmata_pin_code,
        budit_malmata_ghar_number,
        budit_malmata_shetra,
        updated_by,
        created_by,
        updated_dt,
        created_dt,
        isactive
    ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 
        $15, $16, $17, $18, $19, $20, $21, $22, NOW(), NOW(), true
    ) RETURNING *;
`;

        const values = [
            req.body.issue_dt,               // $1
            req.body.prakalp_grast_nav,      // $2
            req.body.prakalpa_nav,           // $3
            req.body.grast_gav,              // $4
            req.body.grast_taluka,           // $5
            req.body.grast_jilha,            // $6
            JSON.stringify(req.body.familymembers || []),          // $7 ( JSONB)
            req.body.grast_pin_code,         // $8
            req.body.shet_jamin_gav,         // $9
            req.body.shet_jamin_taluka,      // $10
            req.body.shet_jamin_jilha,       // $11
            req.body.shet_jamin_pin_code,    // $12
            req.body.shet_jamin_serve_gut,   // $13
            req.body.shet_jamin_shetra,      // $14
            req.body.budit_malmata_gav,      // $15
            req.body.budit_malmata_taluka,   // $16
            req.body.budit_malmata_jilha,    // $17
            req.body.budit_malmata_pin_code, // $18
            req.body.budit_malmata_ghar_number, // $19
            req.body.budit_malmata_shetra,   // $20
            req.body.updated_by,             // $21
            req.body.created_by              // $22
        ];

        const result = await pool.query(query, values);

        res.status(200).json({
            message: "Certificate added successfully",
            data: result.rows[0],  // Returning inserted data
        });
    } catch (error) {
        writeLogFile(error, 'savePramanpatra');
        res.status(500).json({ error: "Server error while adding certificate data" + error });
    }
};

module.exports.updateCertificate = async (req, res) => {
    try {
        const result = await pool.query(
            `UPDATE public.mst_tblpramanpatra
            SET issue_dt = $1,
                prakalp_grast_nav = $2,
                prakalpa_nav = $3,
                grast_gav = $4,
                grast_taluka = $5,
                grast_jilha = $6,
                familymembers = $7,
                grast_pin_code = $8,
                shet_jamin_gav = $9,
                shet_jamin_taluka = $10,
                shet_jamin_jilha = $11,
                shet_jamin_pin_code = $12,
                shet_jamin_serve_gut = $13,
                shet_jamin_shetra = $14,
                budit_malmata_gav = $15,
                budit_malmata_taluka = $16,
                budit_malmata_jilha = $17,
                budit_malmata_pin_code = $18,
                budit_malmata_ghar_number = $19,
                budit_malmata_shetra = $20,
                updated_dt = NOW(),
                updated_by = $21
            WHERE pramanpatra_id = $22`,
            [
                req.body.issue_dt,
                req.body.prakalp_grast_nav,
                req.body.prakalpa_nav,
                req.body.grast_gav,
                req.body.grast_taluka,
                req.body.grast_jilha,
                JSON.stringify(req.body.familymembers || []), // Assuming this is stored as JSONB
                req.body.grast_pin_code,
                req.body.shet_jamin_gav,
                req.body.shet_jamin_taluka,
                req.body.shet_jamin_jilha,
                req.body.shet_jamin_pin_code,
                req.body.shet_jamin_serve_gut,
                req.body.shet_jamin_shetra,
                req.body.budit_malmata_gav,
                req.body.budit_malmata_taluka,
                req.body.budit_malmata_jilha,
                req.body.budit_malmata_pin_code,
                req.body.budit_malmata_ghar_number,
                req.body.budit_malmata_shetra,
                req.body.updated_by,
                req.body.pramanpatra_id,
            ]
        );
        res.json({ message: "Certificate updated successfully!" });
    } catch (error) {
        console.error("Error updating certificate:", error);
        res.status(500).json({ error: "Database update failed" });
    }
};