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

            const query = `SELECT 
                            ROW_NUMBER() OVER (ORDER BY updated_dt DESC) AS क्रमांक,
                            pramanpatra_id AS प्रमाणपत्र_क्रमांक,
                            prakalp_grast_nav AS प्रकल्पग्रस्ताचे_नाव,
                            prakalpa_nav AS प्रकल्पाचे_नाव,
                            familymembers,
                            '' AS प्रमाणपत्र_धारक,
                            shet_jamin_gav AS शेत_जमिनीचे_गाव,
                            shet_jamin_serve_gut AS शेत_जमिन_सर्वे_गट_क्रमांक,
                            shet_jamin_shetra AS शेत_जमिन_क्षेत्र,
                            budit_malmata_gav AS बुडीत_मालमतेचे_गाव,
                            budit_malmata_ghar_number AS बुडीत_मालमतेचा_घर_क्रमांक,
                            budit_malmata_shetra AS बुडीत_मालमतेचे_क्षेत्र,
                            issue_dt
                        FROM mst_tblpramanpatra
                        ORDER BY updated_dt DESC
                        LIMIT ? OFFSET ?;
`;
            pool.query(query, [pageSize, offset], (dataErr, dataResult) => {
                if (dataErr) {
                    writeLogFile(dataErr, 'getPramanpatraData-data');
                    return res.status(400).send("Error fetching certificate data: " + dataErr);
                }
                const parsedData = dataResult.map(({ familymembers, ...rest }) => {
                    const familyArray = familymembers ? JSON.parse(familymembers) : [];
                    const certificateHolder = familyArray.find(member => member.pramanpatradharak === true);
                    return {
                        ...rest,
                        प्रमाणपत्र_धारक: certificateHolder
                            ? `${certificateHolder.name} (${certificateHolder.relation})`
                            : ''
                    };
                });
                res.status(200).json({
                    total: parseInt(countResult[0].total),
                    data: parsedData,
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
    const connection = await pool.promise().getConnection();
    try {
        await connection.beginTransaction();

        const { pramanpatra_id } = req.body;

        // Step 1: Fetch current row from main table
        const [rows] = await connection.query(
            'SELECT * FROM mst_tblpramanpatra WHERE pramanpatra_id = ?',
            [pramanpatra_id]
        );

        if (rows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: "Certificate not found!" });
        }

        const currentRow = rows[0];

        // Step 2: Insert current row into history table
        const historyQuery = `
            INSERT INTO mst_tblpramanpatra_history (
                pramanpatra_number, issue_dt, prakalp_grast_nav, prakalpa_nav,
                pramanpatra_sankhya, regeneration_reason, isactive,
                grast_gav, grast_taluka, grast_jilha, familymembers, grast_pin_code,
                shet_jamin_gav, shet_jamin_taluka, shet_jamin_jilha, shet_jamin_pin_code, shet_jamin_serve_gut, shet_jamin_shetra,
                budit_malmata_gav, budit_malmata_taluka, budit_malmata_jilha, budit_malmata_pin_code, budit_malmata_ghar_number, budit_malmata_shetra
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await connection.query(historyQuery, [
            currentRow.pramanpatra_number,
            currentRow.issue_dt,
            currentRow.prakalp_grast_nav,
            currentRow.prakalpa_nav,
            currentRow.pramanpatra_sankhya,
            currentRow.regeneration_reason,
            currentRow.isactive,
            currentRow.grast_gav,
            currentRow.grast_taluka,
            currentRow.grast_jilha,
            currentRow.familymembers,
            currentRow.grast_pin_code,
            currentRow.shet_jamin_gav,
            currentRow.shet_jamin_taluka,
            currentRow.shet_jamin_jilha,
            currentRow.shet_jamin_pin_code,
            currentRow.shet_jamin_serve_gut,
            currentRow.shet_jamin_shetra,
            currentRow.budit_malmata_gav,
            currentRow.budit_malmata_taluka,
            currentRow.budit_malmata_jilha,
            currentRow.budit_malmata_pin_code,
            currentRow.budit_malmata_ghar_number,
            currentRow.budit_malmata_shetra,
        ]);

        // Step 3: Update the main table
        const updateQuery = `
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
            WHERE pramanpatra_id = ?
        `;

        const values = [
            req.body.issue_dt,
            req.body.prakalp_grast_nav,
            req.body.prakalpa_nav,
            req.body.grast_gav,
            req.body.grast_taluka,
            req.body.grast_jilha,
            JSON.stringify(req.body.familymembers || []),
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
            pramanpatra_id
        ];

        const [result] = await pool.promise().query(updateQuery, values);

        // const [result] = await pool.query(query, values);

        await connection.commit();

        res.json({ message: "Certificate updated successfully!" });
    } catch (error) {
        await connection.rollback();
        console.error("Error updating certificate:", error);
        res.status(500).json({ error: "Database update failed" + error });
    } finally {
        connection.release();
    }
};
