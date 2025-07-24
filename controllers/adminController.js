// visitors/backend/controllers/adminController.js

const Visitor = require('../models/Visitor');

const getAllVisitors = async (req, res) => {
    try {
        // NEW: Add sorting by createdAt in descending order (newest first)
        const visitors = await Visitor.find({}).sort({ createdAt: -1 }); // Added .sort()
        console.log();
        
        res.status(200).json({
            message: "Successfully retrieved all visitor data.",
            data: visitors
        });
    } catch (error) {
        console.error("Error fetching all visitors:", error);
        res.status(500).json({ message: "Failed to retrieve visitor data.", error: error.message });
    }
};

const updateVisitor = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, personalPhoneNumber, companyPhoneNumber, address, otpVerified } = req.body;

        if (!personalPhoneNumber) {
            return res.status(400).json({ success: false, message: "Personal Mobile Number is required." });
        }

        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(personalPhoneNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid personal mobile number format (10 digits, starts with 6-9).'
            });
        }
        if (companyPhoneNumber && !/^[0-9]{10,15}$/.test(companyPhoneNumber)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid company phone number format (10-15 digits).'
            });
        }

        const updatedVisitor = await Visitor.findByIdAndUpdate(
            id,
            {
                name: name || '',
                personalPhoneNumber,
                companyPhoneNumber: companyPhoneNumber || '',
                address: address || '',
                otpVerified,
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );

        if (!updatedVisitor) {
            return res.status(404).json({ success: false, message: "Visitor not found." });
        }

        res.status(200).json({
            success: true,
            message: "Visitor updated successfully!",
            data: updatedVisitor
        });

    } catch (error) {
        console.error("Error updating visitor:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: 'Validation error: ' + error.message });
        }
        res.status(500).json({ success: false, message: "Server error during update. Please try again." });
    }
};

// NEW: Controller function to delete a visitor
const deleteVisitor = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedVisitor = await Visitor.findByIdAndDelete(id);

        if (!deletedVisitor) {
            return res.status(404).json({ success: false, message: "Visitor not found." });
        }

        res.status(200).json({ success: true, message: "Visitor deleted successfully!", data: deletedVisitor });

    } catch (error) {
        console.error("Error deleting visitor:", error);
        res.status(500).json({ success: false, message: "Server error during deletion. Please try again." });
    }
};

module.exports = {
    getAllVisitors,
    updateVisitor,
    deleteVisitor // Export the new function
};