// visitors/backend/controllers/authController.js

const adminLogin = (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required." });
    }

    // Check credentials against environment variables
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        // On successful login, send back the API key
        return res.status(200).json({
            message: "Admin login successful!",
            adminApiKey: process.env.ADMIN_API_KEY
        });
    } else {
        return res.status(401).json({ message: "Invalid credentials." });
    }
};

const verifyAdminApiKey = (req, res, next) => {
    const adminApiKey = req.headers['admin-api-key'];

    if (!adminApiKey) {
        return res.status(401).json({ message: "Access Denied: No API Key provided." });
    }

    if (adminApiKey === process.env.ADMIN_API_KEY) {
        next(); // API key is valid, proceed to the next middleware/route handler
    } else {
        return res.status(403).json({ message: "Access Denied: Invalid API Key." });
    }
};


module.exports = {
    adminLogin,
    verifyAdminApiKey
};