// visitors/backend/controllers/adminController.js

const Visitor = require('../models/Visitor');

const getAllVisitors = async (req, res) => {
    try {
        const visitors = await Visitor.find({});
        res.status(200).json({
            message: "Successfully retrieved all visitor data.",
            data: visitors
        });
    } catch (error) {
        console.error("Error fetching all visitors:", error);
        res.status(500).json({ message: "Failed to retrieve visitor data.", error: error.message });
    }
};

module.exports = {
    getAllVisitors
};