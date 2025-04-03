const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
var configArr = require('../services/config');
const pool = configArr.pool;
writeLogFile = configArr.writeLogFile;

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Fetch user from PostgreSQL
        const query = 'SELECT "User_id","Access_Level", "User_Email", "User_Pass", "First_Name" FROM public."Mst_tblUsers" WHERE "User_Email" = $1';
        const { rows } = await pool.query(query, [email]);


        // Check if user exists
        if (rows.length === 0) {
            return res.status(403).json({ message: 'Auth failed: email or password is wrong', success: false });
        }

        const user = rows[0];

        // Compare password
        const isPassEqual = await bcrypt.compare(password, user.User_Pass);
        if (!isPassEqual) {
            return res.status(403).json({ message: 'Auth failed: email or password is wrong', success: false });
        }

        // Generate JWT token
        const jwtToken = jwt.sign(
            { email: user.User_Email, userId: user.User_id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login Success",
            success: true,
            jwtToken,
            email: user.User_Email,
            name: user.First_Name,
            Access_Level: user.Access_Level,
            User_Name: user.User_Namem,
            User_id: user.User_id
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({
            message: "Internal server error",
            success: false
        });
    }
}
const signup = async (req, res) => {
    try {
        res.status(201)
            .json({
                message: "Signup successfully",
                success: true
            })
    } catch (err) {
        res.status(500)
            .json({
                message: "Internal server errror",
                success: false
            })
    }
}

module.exports = {
    signup,
    login
}