import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Member from "../models/member.js";
import multer from "multer";
import XLSX from "xlsx";

dotenv.config();
const router = express.Router();

// ✅ POST API: Create new member
router.post("/new", async (req, res) => {
  try {
    const member = new Member(req.body);
    await member.save();
    res.status(201).json({ success: true, data: member });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const members = await Member.find().sort({ createdAt: -1 }); // Sort by creation date if needed

    res.status(200).json({
      success: true,
      totalItems: members.length,
      data: members,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Edit user by ID
router.put("/edit/:id", async (req, res) => {
  try {
    const { id } = req.params; // get ID from URL
    const { subject, body } = req.body; // destructure data to update

    // Find the member by ID
    const member = await Member.findById(id);

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Update the message fields
    member.message = { subject, body };

    // Save the document
    await member.save();

    res.json({ message: "Member updated successfully", data: member });
  } catch (error) {
    console.error("Error updating member:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Existing routes in user.js
// e.g., router.get(...), router.post(...)

// ✅ New route: POST /api/excel-upload
router.post("/excel-upload", upload.single("excel_file"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    if (!data.length) {
      return res
        .status(400)
        .json({ success: false, message: "Excel file is empty" });
    }

    console.log("data first element", data[0]);

    // Validate and prepare data
    const members = data.map((row, index) => {
      const { name, email, state, number, field, licensedBy, licenseNumber } =
        row;

      if (
        !name ||
        !email ||
        !state ||
        !number ||
        !field ||
        !licensedBy ||
        !licenseNumber
      ) {
        throw new Error(`Missing required fields at row ${index + 2}`);
      }

      return {
        name: name.toString().trim(),
        email: email.toString().trim(),
        state: state.toString().trim(),
        number: number.toString().trim(),
        field: field.toString().trim(),
        licensedBy: licensedBy.toString().trim(),
        licenseNumber: licenseNumber.toString().trim(),
        message: {
          subject: "subject",
          body: "this is body",
        },
      };
    });

    await Member.insertMany(members);

    res.json({
      success: true,
      message: "Excel file uploaded successfully",
      count: members.length,
    });
  } catch (error) {
    console.error("Error processing Excel file:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ✅ Send Email API
router.put("/send-email", async (req, res) => {
  try {
    // Find all members who haven't been sent an email yet (or you can apply other filters)
    const members = await Member.find({ email_sent: false });

    if (members.length === 0) {
      return res
        .status(404)
        .json({ message: "No members found to send emails to." });
    }

    // Setup nodemailer transporter
    let transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let emailsSent = 0;
    let errors = [];

    for (const member of members) {
      let mailOptions = {
        from: process.env.EMAIL_USER,
        to: member.email,
        subject: "Important Message",
        text: `Hello ${member.name},\n\nThis is a message from your team.`,
      };

      try {
        await transporter.sendMail(mailOptions);

        // Update email_sent field after successful email
        member.email_sent = true;
        await member.save();

        emailsSent++;
      } catch (emailError) {
        console.error(`Error sending email to ${member.email}:`, emailError);
        errors.push({ email: member.email, error: emailError.message });
      }
    }

    res.json({
      message: `Bulk email process completed. Emails sent: ${emailsSent}`,
      errors: errors.length ? errors : null,
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
