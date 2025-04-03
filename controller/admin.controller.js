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

        pool.query('SELECT COUNT(*) as total FROM mst_tblpramanpatra', (countErr, countResult) => {
            if (countErr) {
                writeLogFile(countErr, 'getPramanpatraData-count');
                return res.status(400).send("Error fetching certificate count: " + countErr);
            }

            const query = `
                            SELECT ROW_NUMBER() OVER (ORDER BY updated_dt DESC) AS row_index,
                                pramanpatra_id as प्रमाणपत्र_क्रमांक,
                                prakalp_grast_nav as प्रकल्पग्रस्ताचे_नाव,
                                prakalpa_nav as प्रकल्पाचे_नाव,
                                (
                                    SELECT CONCAT(
                                        JSON_UNQUOTE(JSON_EXTRACT(fm.value, '$.name')), 
                                        ' (', 
                                        JSON_UNQUOTE(JSON_EXTRACT(fm.value, '$.relation')), 
                                        ')'
                                    )
                                    FROM JSON_TABLE(familymembers, '$[*]' 
                                        COLUMNS (
                                            value JSON PATH '$'
                                        )
                                    ) AS fm
                                    WHERE JSON_UNQUOTE(JSON_EXTRACT(fm.value, '$.pramanpatradharak')) = 'true'
                                    LIMIT 1
                                ) AS प्रमाणपत्र_धारक,
                                shet_jamin_gav as शेत_जमिनीचे_गाव,
                                shet_jamin_serve_gut as शेत_जमिन_सर्वे_गट_क्रमांक,
                                shet_jamin_shetra as शेत_जमिन_क्षेत्र,
                                budit_malmata_gav as बुडीत_मालमतेचे_गाव,
                                budit_malmata_ghar_number as बुडीत_मालमतेचा_घर_क्रमांक,
                                budit_malmata_shetra as बुडीत_मालमतेचे_क्षेत्र,
                                issue_dt
                            FROM mst_tblpramanpatra
                            ORDER BY updated_dt DESC
                            LIMIT ? OFFSET ?`;
            pool.query(query, [pageSize, offset], (dataErr, dataResult) => {
                if (dataErr) {
                    writeLogFile(dataErr, 'getPramanpatraData-data');
                    return res.status(400).send("Error fetching certificate data: " + dataErr);
                }

                res.status(200).json({
                    total: parseInt(countResult[0].total),
                    data: dataResult,
                    page,
                    pageSize
                });
            });
        });
    } catch (error) {
        writeLogFile(error, 'getPramanpatraData');
        res.status(500).send("Server error while fetching certificate data" + error);
    }
};



module.exports.get_pramanpatra_to_edit = (req, res) => {
    try {
        pool.query(`SELECT *
                    FROM mst_tblpramanpatra
                    WHERE pramanpatra_id = ? `, [req.query.rowId], (dataErr, dataResult) => {
            if (dataErr) {
                writeLogFile(dataErr, 'get_pramanpatra_to_edit-data');
                return res.status(400).send("Error fetching pramanpatra_to_edit data" + dataErr);
            }
            const parsedData = dataResult.map(row => ({
                ...row,
                familymembers: row.familymembers ? JSON.parse(row.familymembers) : [] // Parse JSON, fallback to empty array if null
            }));

            res.status(200).json({
                data: parsedData
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
        INSERT INTO mst_tblpramanpatra (
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
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), true
        )`;

        const values = [
            req.body.issue_dt,
            req.body.prakalp_grast_nav,
            req.body.prakalpa_nav,
            req.body.grast_gav,
            req.body.grast_taluka,
            req.body.grast_jilha,
            JSON.stringify(req.body.familymembers || []), // Store as JSON string
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
            req.body.created_by
        ];

        // const [result] = await pool.query(query, values);
        const [result] = await pool.promise().query(query, values);

        res.status(200).json({
            message: "Certificate added successfully",
            data: result,
        });

    } catch (error) {
        console.error("Error inserting certificate:", error);
        res.status(500).json({ error: "Server error while adding certificate data" });
    }
};


module.exports.updateCertificate = async (req, res) => {
    try {
        const query = `
            UPDATE mst_tblpramanpatra
            SET issue_dt = ?,
                prakalp_grast_nav = ?,
                prakalpa_nav = ?,
                grast_gav = ?,
                grast_taluka = ?,
                grast_jilha = ?,
                familymembers = ?,
                grast_pin_code = ?,
                shet_jamin_gav = ?,
                shet_jamin_taluka = ?,
                shet_jamin_jilha = ?,
                shet_jamin_pin_code = ?,
                shet_jamin_serve_gut = ?,
                shet_jamin_shetra = ?,
                budit_malmata_gav = ?,
                budit_malmata_taluka = ?,
                budit_malmata_jilha = ?,
                budit_malmata_pin_code = ?,
                budit_malmata_ghar_number = ?,
                budit_malmata_shetra = ?,
                updated_dt = CURRENT_TIMESTAMP,
                updated_by = ?
            WHERE pramanpatra_id = ?`;

        const values = [
            req.body.issue_dt,
            req.body.prakalp_grast_nav,
            req.body.prakalpa_nav,
            req.body.grast_gav,
            req.body.grast_taluka,
            req.body.grast_jilha,
            JSON.stringify(req.body.familymembers || []), // Store as JSON string
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
        ];

        const [result] = await pool.promise().query(query, values);

        // const [result] = await pool.query(query, values);

        if (result.affectedRows > 0) {
            res.json({ message: "Certificate updated successfully!" });
        } else {
            res.status(404).json({ error: "Certificate not found!" });
        }
    } catch (error) {
        console.error("Error updating certificate:", error);
        res.status(500).json({ error: "Database update failed" });
    }
};
