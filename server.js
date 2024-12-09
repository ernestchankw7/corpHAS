const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const fs = require('fs');
//const port = 2000
const port = process.env.PORT || 2000;

const app = express();
app.use(express.urlencoded({ extended: true }))

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect('mongodb+srv://22026341:fyp1@cluster0.rtrnk.mongodb.net/fyp')
const db = mongoose.connection
db.once('open', () => {
    console.log("MongoDB connection successful")
})

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'LoginPage.html'))
})


const appointmentSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g., "10:00 AM"
    maxPatients: { type: Number, default: 5 }, // Maximum patients for this slot
    currentPatients: { type: Number, default: 0 }, // Current number of booked patients
});

// Create Model
const Appointment = mongoose.model("Appointment", appointmentSchema);

// Define Employee Schema
const employeeSchema = new mongoose.Schema({
    employee_id: String,
    name: String,
    email: String,
    phone: String,
    company: String,
    package: String,
});

// Define Patient Appointment Booking Schema
const PatientAppointmentBookingSchema = new mongoose.Schema({
    employee_id: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    reason: { type: String, required: true },
    specialRequests: { type: String }, // Optional field
});

const PatientAppointmentBooking = mongoose.model('EmployeeAppointmentBooking', PatientAppointmentBookingSchema);

const Employee = mongoose.model("Employee", employeeSchema);
console.log(Employee)

// Route to check employee ID and display details if found
app.post('/check-employee', async (req, res) => {
    const { employee_id } = req.body;

    try {
        // Search for employee by ID
        const employee = await Employee.findOne({ employee_id });

        if (employee) {
            // Render the EJS template and pass employee data
            //res.render('employeeDetails', { employee });
            res.redirect(`/check-employee-profile/${employee_id}`);
        } else {
            res.send("<h1>Employee ID not found. Please try again.</h1>");
        }
    } catch (error) {
        res.status(500).send("Server error");
    }
});

// Route to serve the update form
app.get('/update-employee/:employee_id', async (req, res) => {
    const { employee_id } = req.params;

    try {
        // Find employee by ID
        const employee = await Employee.findOne({ employee_id });

        if (employee) {
            // Render the updateemployeeDetails EJS template and pass employee data
            res.render('updateemployeeDetails', { employee });
        } else {
            res.send("<h1>Employee ID not found.</h1>");
        }
    } catch (error) {
        res.status(500).send("Server error");
    }
});

const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
        user: 'corphassg@gmail.com', // Replace with your email
        pass: 'jtaq jhof vvro eldm', // Replace with your email password or app password
    },
});

// Route to handle employee update
app.post('/update-employee/:employee_id', async (req, res) => {
    const { employee_id } = req.params;
    const { name, email, phone } = req.body; // Only update name, email, and phone

    try {
        // Update employee details in the database
        const updatedEmployee = await Employee.findOneAndUpdate(
            { employee_id },
            { name, email, phone }, // Only update allowed fields
            { new: true } // Return the updated document
        );

        if (updatedEmployee) {
            res.send(`
                <h1>Employee details updated successfully!</h1>
                <a href="/check-employee-profile/${updatedEmployee.employee_id}">Back to Profile Page</a>
            `);
        } else {
            res.send("<h1>Employee ID not found. No updates made.</h1>");
        }
    } catch (error) {
        res.status(500).send("Server error");
    }
});

// Route to view employee profile by ID
app.get('/check-employee-profile/:employee_id', async (req, res) => {
    const { employee_id } = req.params;

    try {
        // Search for employee by ID
        const employee = await Employee.findOne({ employee_id });

        if (!employee) {
            res.send("<h1>Employee ID not found. Please try again.</h1>");
        }
        const latestAppointment = await PatientAppointmentBooking.findOne({ employee_id }).sort({ date: -1, time: -1 });
        res.render('employeeDetails', { employee, appointment: latestAppointment });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).send("Server error");
    }
});

// Serve booking form
app.get('/booking-form', (req, res) => {
    res.render('bookingForm');
});

// Booking form with pre-filled employee ID
app.get('/booking-form/:employeeID', async (req, res) => {
    const { employeeID } = req.params;

    try {
        // Check if the employee already has an appointment
        const appointment = await PatientAppointmentBooking.findOne({ employee_id: employeeID });

        res.render('bookingForm', {
            employeeID,
            appointment, // Pass the appointment to the template
        });
    } catch (error) {
        console.error('Error fetching appointment:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Handle appointment booking submission
// Handle appointment booking submission 
app.post('/book-appointment', async (req, res) => {
    const { employee_id, date, time, reason, specialRequests } = req.body;

    try {
        const parsedDate = new Date(date);
        if (isNaN(parsedDate)) {
            throw new Error("Invalid date format");
        }

        // Check if the employee has already booked an appointment on the same date 
        const existingBooking = await PatientAppointmentBooking.findOne({ employee_id, date: parsedDate });
        if (existingBooking) {
            return res.status(400).send(`<h1>You have already booked an appointment on this date.</h1><a href="/check-employee-profile/${employee_id}">Back to Home</a>`);
        }

        // Find or create an appointment slot 
        let appointment = await Appointment.findOne({ date: parsedDate, time });
        if (!appointment) {
            const defaultMaxPatients = 5;
            appointment = new Appointment({
                date: parsedDate,
                time,
                maxPatients: defaultMaxPatients,
                currentPatients: 0
            });
            await appointment.save();
        }

        // Check if there are available slots 
        if (appointment.currentPatients >= appointment.maxPatients) {
            return res.status(400).send("<h1>No available slots for this appointment.</h1>");
        }

        // Save the appointment for the employee 
        const patientAppointment = new PatientAppointmentBooking({
            employee_id,
            date: parsedDate,
            time,
            reason,
            specialRequests,
        });

        await patientAppointment.save();

        // Update the current patient count for the appointment slot 
        appointment.currentPatients += 1;
        await appointment.save();

        // Fetch employee details for email
        const employee = await Employee.findOne({ employee_id });
        if (employee) {
            // Email options
            const mailOptions = {
                from: 'corphassg@gmail.com', // Replace with your email
                to: employee.email,
                subject: 'Appointment Confirmation',
                html: `
                    <h1>Appointment Confirmation</h1>
                    <p>Dear ${employee.name},</p>
                    <p>Your appointment has been successfully booked!</p>
                    <p><strong>Details:</strong></p>
                    <ul>
                        <li>Date: ${parsedDate.toDateString()}</li>
                        <li>Time: ${time}</li>
                        <li>Reason: ${reason}</li>
                        <li>Special Requests: ${specialRequests || 'None'}</li>
                    </ul>
                    <p>Thank you for using our service.</p>
                `,
            };

            // Send email
            await transporter.sendMail(mailOptions);
            console.log('Confirmation email sent to:', employee.email);
        }

        res.send(` 
            <h1>Appointment booked successfully!</h1> 
            <p>Date: ${parsedDate.toDateString()}</p> 
            <p>Time: ${time}</p> 
            <p>Reason for Visit: ${reason}</p> 
            <p>Special Requests: ${specialRequests}</p> 
            <a href="/check-employee-profile/${employee_id}">Back to Home</a> 
        `);
    } catch (error) {
        console.error("Error:", error.stack);
        res.status(500).send(`Server error while booking appointment: ${error.message}`);
    }
});

// Route to render the Add-Ons page with employee context
app.get('/add-ons/:employeeID', async (req, res) => {
    const { employeeID } = req.params;

    try {
        // Fetch the employee data
        const employee = await Employee.findOne({ employee_id: employeeID });

        // Fetch the latest appointment data
        const appointment = await PatientAppointmentBooking.findOne({ employee_id: employeeID }).sort({ date: -1, time: -1 });

        if (employee) {
            // Pass both employee and appointment to the template
            res.render('addOns', { employee, appointment, employeeID });
        } else {
            res.send("<h1>Employee ID not found.</h1>");
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send("Server error");
    }
});

app.get('/summary/:employee_id', async (req, res) => {
    const { employee_id } = req.params;

    try {
        const employee = await Employee.findOne({ employee_id });

        if (employee) {
            // Pass employee data to the summary.ejs template
            res.render('summary', { employee });
        } else {
            res.send("<h1>Employee ID not found.</h1>");
        }
    } catch (error) {
        res.status(500).send("Server error");
    }
});

app.get('/survey/:employee_id', async (req, res) => {
    const { employee_id } = req.params;

    try {
        const employee = await Employee.findOne({ employee_id });

        if (employee) {
            res.render('survey', { employee });
        } else {
            res.send("<h1>Employee ID not found.</h1>");
        }
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).send("Server error");
    }
});

app.post('/survey/:employee_id', async (req, res) => {
    const { employee_id } = req.params;

    // Just redirect to the add-ons page; logic is handled in client-side localStorage
    res.redirect(`/add-ons/${employee_id}`);
});

// Handle the reschedule submission
app.post('/reschedule-appointment/:employee_id', async (req, res) => {
    const { employee_id } = req.params;
    const { date, time, reason, specialRequests } = req.body;

    try {
        // Log the employee_id to ensure it's being passed correctly
        console.log('Employee ID from URL:', employee_id);

        // Find the latest appointment for the employee
        const updatedAppointment = await PatientAppointmentBooking.findOneAndUpdate(
            { employee_id },
            { date, time, reason, specialRequests },
            { new: true }  // Return the updated document
        );

        if (!updatedAppointment) {
            console.log('Appointment not found for employee:', employee_id);
            return res.status(404).send("Appointment not found");
        }

        // Send updated confirmation email (optional)
        const employee = await Employee.findOne({ employee_id: updatedAppointment.employee_id });
        if (employee) {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'corphassg@gmail.com',
                    pass: 'jtaq jhof vvro eldm',
                },
            });

            const mailOptions = {
                from: 'corphassg@gmail.com',
                to: employee.email,
                subject: 'Appointment Rescheduled',
                html: `
                    <h1>Appointment Rescheduled</h1>
                    <p>Dear ${employee.name},</p>
                    <p>Your appointment has been successfully rescheduled!</p>
                    <p><strong>Updated Details:</strong></p>
                    <ul>
                        <li>Date: ${new Date(date).toDateString()}</li>
                        <li>Time: ${time}</li>
                        <li>Reason: ${reason}</li>
                        <li>Special Requests: ${specialRequests || 'None'}</li>
                    </ul>
                    <p>Thank you for using our service.</p>
                `,
            };

            await transporter.sendMail(mailOptions);
        }

        // Send response confirming the reschedule
        res.send(`
            <h1>Appointment rescheduled successfully!</h1>
            <p>New Date: ${new Date(date).toDateString()}</p>
            <p>New Time: ${time}</p>
            <p>Reason for Visit: ${reason}</p>
            <p>Special Requests: ${specialRequests}</p>
            <a href="/check-employee-profile/${updatedAppointment.employee_id}">Back to Home</a>
        `);

    } catch (error) {
        console.error('Error:', error.stack);
        res.status(500).send(`Server error while rescheduling appointment: ${error.message}`);
    }
});

app.get('/reschedule-appointment/:employee_id', async (req, res) => {
    const { employee_id } = req.params;

    try {
        // Fetch the appointment based on employee_id
        const appointment = await PatientAppointmentBooking.findOne({ employee_id });

        if (appointment) {
            // Pass the appointment and employee_id to the EJS template
            res.render('rescheduleForm', { appointment, employeeID: employee_id });
        } else {
            // Handle case where no appointment is found
            res.send("<h1>No appointment found for this employee ID.</h1>");
        }
    } catch (error) {
        // Log any potential error during the query
        console.error("Error fetching appointment:", error);
        res.status(500).send("Server error");
    }
});

app.get('/reschedule-form', (req, res) => {
    res.render('rescheduleForm');
});

//temp route for report**
app.get('/generate-report/:employee_id', async (req, res) => {
    const { employee_id } = req.params;

    try {
        const employee = await Employee.findOne({ employee_id });

        if (employee) {
            res.render('tempReportGene', { employee });
        } else {
            res.send("<h1>Employee ID not found.</h1>");
        }
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).send("Server error");
    }
});
// Fetch all employees**
app.get('/api/employees', async (req, res) => {
    try {
        const employees = await Employee.find();
        res.json(employees);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// Route to generate PDF report**
app.get('/generate-pdf', async (req, res) => {
    try {
        const employees = await Employee.find();

        // Create a new PDF document
        const doc = new PDFDocument();
        const filename = `employee_report_${Date.now()}.pdf`;

        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        doc.pipe(res);

        // Title
        doc.fontSize(18).text('Employee Report', { align: 'center' });
        doc.moveDown();

        // Employee Details in Table Format
        employees.forEach(employee => {
            doc
                .fontSize(14)
                .text(`Employee ID: ${employee.employee_id || 'N/A'}`)
                .text(`Name: ${employee.name || 'N/A'}`)
                .text(`Email: ${employee.email || 'N/A'}`)
                .text(`Phone: ${employee.phone || 'N/A'}`)
                .text(`Company: ${employee.company || 'N/A'}`)
                .text(`Package: ${employee.package || 'N/A'}`)
                .moveDown();
        });

        doc.end(); // Finalize the PDF
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF');
    }
});

// Define Test Items Schema**
const testItemSchema = new mongoose.Schema({
    employeeID: { type: String, required: true },
    items: [
        {
            title: { type: String, required: true },
            // price: { type: Number, required: true },
        }
    ]
});

const TestItem = mongoose.model("TestItem", testItemSchema);

// Route to handle "Proceed" button**
app.post('/proceed', async (req, res) => {
    const { employeeID, items } = req.body;

    try {
        // Parse the items string into an array
        const parsedItems = JSON.parse(items);

        // Save the test items along with the employee ID
        const newTestItem = new TestItem({
            employeeID,
            items: parsedItems
        });
        await newTestItem.save();

        // Redirect back to employeeDetails.ejs with the employee ID
        res.redirect(`/check-employee-profile/${employeeID}`);
    } catch (error) {
        console.error('Error saving test items:', error);
        res.status(500).send('Error saving test items.');
    }
});


app.listen(port, () => {
    console.log("server started")
})