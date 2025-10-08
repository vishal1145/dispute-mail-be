import express from "express";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Member from "../Models/member.js";
import multer from "multer";
import XLSX from "xlsx";
import { sendMail } from "../config/email.js";
import { parseExcel } from "../utils/excelHelper.js";

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
    const { id } = req.params;
    const { subject, body, email } = req.body;

    const member = await Member.findById(id);

    if (!member) {
      return res.status(404).json({ message: "Member not found" });
    }

    // Update fields conditionally
    if (email) {
      member.email = email.trim(); // prevent trailing spaces
    }

    if (subject || body) {
      member.message = {
        subject: subject ?? member.message?.subject,
        body: body ?? member.message?.body
      };
    }

    // Save the document
    await member.save();

    res.json({
      message: "Member updated successfully",
      data: member
    });
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
    const {sheetName, headers, data} = parseExcel(req.file.buffer);

    if (!data.length) {
      return res
        .status(400)
        .json({ success: false, message: "Excel file is empty" });
    }  

    const skipped = [];
    const inserted = [];

    // Validate and prepare data
    const members = data.map((row, index) => {
      const {
        name,
        email,
        number="",
        field="N/A",
        state = "",
        licensedBy = "",
        licenseNumber = ""
      } = row;


      return {
        name: name?.toString().trim(),
        email: email?.toString().trim(),
        state: state?.toString().trim(),
        number: number?.toString().trim(),
        field: field?.toString().trim(),
        licensedBy: licensedBy?.toString().trim(),
        licenseNumber: licenseNumber?.toString().trim(),
        message: {
          subject: "Invitation to conduct dispute resolution cases",
          body: `Dear ${name},

            Re: Invitation to conduct dispute resolution cases

            I would like to introduce myself and our Company to you, in the hope that we can be of mutual benefit to each other.

            We are a new and unique company in the dispute resolution industry. We are an aggregator of dispute cases. We intend to heavily advertise and market our services (mediation, conciliation, arbitration, facilitation and commercial negotiations) and distribute the work received to our ‘Panel’ of accredited dispute professionals such as yourself.

            We are looking for experienced and currently accredited Mediators, Conciliators, Arbitrators and Negotiators to join our Panel.

            How it Works
            • If you are qualified – join - via our website. www.disputesresolutions.com  (free and no obligation)
            • If you qualify you will become a member of our panel
            • You will have access to the ‘Jobs Schedule’ on the website, where we post all available jobs. We also notify you of new jobs by email.
            • If you see a job that you would like to do and is a suitable date for you, simply click on ‘Book’, the job will be assigned to you.
            • We will send you the ‘Intake’ information and relevant documents, as well as a summary.
            • Prior to the date of the scheduled job, you will be paid in full.
            • Payment to you is $900 for standard half-day (up to 4 hrs) and $1500 for a standard full day (up to 8 hrs)
            • All jobs are conducted on-line via Zoom.
            • There are no obligations as to how many jobs you do or which jobs you select. You are an independent contractor not an employee of the company.

            Note: 
            (a) You have no requirement to do any intake work. A summary, plus necessary information and documents will be sent to you.
            (b) You must not ‘Book’ a job unless you are sure you are available on that date and are able to do the job. No cancellations accepted (except for emergencies).

            More information about our company and our services can be seen at our website www.disputesresolutions.com. To join or view our Panel details, scroll to the bottom of the Home-page on the website and see ‘Panel Members – Join’.

            I would be happy to answer any further questions you might have by phone or email.

            Sincerely,

            Robert Oayda
            <span style="color: #6e6e6e;">(Accredited Mediator)</span>
            <span style="color: #6e6e6e;">Founder, CEO</span>

            <img src="https://disputesresolutions.com/wp-content/uploads/2024/05/DR-Logo-removebg-preview-1.png" alt="Robert Oayda" width="100" height="100">

            <span style="color: #6e6e6e;">Phone:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+61 418 220 263</span>
            <span style="color: #6e6e6e;">Email:</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #2c66dd;">robert@oayda.com</span> 
            <span style="color: #6e6e6e;">Website:</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #2c66dd;"><a href="https://disputesresolutions.com">www.disputesresolutions.com</a></span>`,
        },
      };
    });

    ///check each email one by one if exit skip 
    for (const m of members) {
      // normalize email safely
      const email = m.email ? m.email.toString().trim().toLowerCase() : null;
      if (!email) {
        skipped.push({ ...m, reason: "Missing email" });
        continue;
      }

      // check if already exists
      const existing = await Member.findOne({ email });
      if (existing) {
        skipped.push({ ...m, reason: "Email already exists" });
      } else {
        const newMember = await Member.create({ ...m, email });
        inserted.push(newMember);
      }
    }

    res.json({
      success: true,
      message: `Inserted ${inserted.length} rows, Skipped ${skipped.length} rows, Out of ${members.length}`,
      count: members.length,
    });

  } catch (error) {
    console.error("Error processing Excel file:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});


router.put("/send-email", async (req, res) => {
  try {
    const { data } = req.body;

    const emailPromises = data.map(async (item) => {
      try {
        const member = await Member.findById(item._id);

        if (!member) {
          return {
            email: item.email,
            status: "failed",
            reason: "Member not found",
          };
        }

        const name = item.name.toString().trim().split(' ')[0];

        const messageBody = `Dear ${name},

Re: Invitation to conduct dispute resolution cases

I would like to introduce myself and our Company to you, in the hope that we can be of mutual benefit to each other.

We are a new and unique company in the dispute resolution industry. We are an aggregator of dispute cases. We intend to heavily advertise and market our services (mediation, conciliation, arbitration, facilitation and commercial negotiations) and distribute the work received to our ‘Panel’ of accredited dispute professionals such as yourself.

We are looking for experienced and currently accredited Mediators, Conciliators, Arbitrators and Negotiators to join our Panel.

How it Works
• If you are qualified – join - via our website. www.disputesresolutions.com  (free and no obligation)
• If you qualify you will become a member of our panel
• You will have access to the ‘Jobs Schedule’ on the website, where we post all available jobs. We also notify you of new jobs by email.
• If you see a job that you would like to do and is a suitable date for you, simply click on ‘Book’, the job will be assigned to you.
• We will send you the ‘Intake’ information and relevant documents, as well as a summary.
• Prior to the date of the scheduled job, you will be paid in full.
• Payment to you is $900 for standard half-day (up to 4 hrs) and $1500 for a standard full day (up to 8 hrs)
• All jobs are conducted on-line via Zoom.
• There are no obligations as to how many jobs you do or which jobs you select. You are an independent contractor not an employee of the company.

Note: 
(a) You have no requirement to do any intake work. A summary, plus necessary information and documents will be sent to you.
(b) You must not ‘Book’ a job unless you are sure you are available on that date and are able to do the job. No cancellations accepted (except for emergencies).

More information about our company and our services can be seen at our website www.disputesresolutions.com. To join or view our Panel details, scroll to the bottom of the Home-page on the website and see ‘Panel Members – Join’.

I would be happy to answer any further questions you might have by phone or email.

Sincerely,

Robert Oayda
<span style="color: #6e6e6e;">(Accredited Mediator)</span>
<span style="color: #6e6e6e;">Founder, CEO</span>

<img src="https://disputesresolutions.com/wp-content/uploads/2024/05/DR-Logo-removebg-preview-1.png" alt="Robert Oayda" width="100" height="100">

<span style="color: #6e6e6e;">Phone:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+61 418 220 263</span>
<span style="color: #6e6e6e;">Email:</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #2c66dd;">robert@oayda.com</span> 
<span style="color: #6e6e6e;">Website:</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color: #2c66dd;"><a href="https://disputesresolutions.com">www.disputesresolutions.com</a></span>`;

        let mailOptions = {
          to: item.email,
          subject: "Invitation to conduct dispute resolution cases",
          body: messageBody.replace(/\n/g, "<br>"),
        };

        await sendMail(mailOptions)
 
        member.email_sent = true;
        await member.save();

        return { email: item.email, status: "success" };
      } catch (err) {
        console.error("Error sending email to:", item.email, err.message);
        return {
          email: item.email,
          status: "failed",
          reason: err.message,
        };
      }
    });

    const results = await Promise.allSettled(emailPromises);

    const formattedResults = results.map((res) =>
      res.status === "fulfilled"
        ? res.value
        : { email: "unknown", status: "failed", reason: res.reason }
    );

    res.json({
      message: "Email process completed",
      results: formattedResults,
    });
    
  } catch (error) {
    console.error("Error in send-email route:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});


export default router;
