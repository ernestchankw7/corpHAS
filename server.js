const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');
const fs = require('fs');
//const port = 2000
const port = process.env.PORT || 2000;

const app = express();
app.use(express.urlencoded({ extended: true }))

const dbx = new Dropbox({
    accessToken: 'sl.u.AFgVsNLtpSUJBeKqKKEB-ngsYz5v5tpJOnLCd3KQ7XqYdDK1WTDjboGD52CX_R1oZquDS6uNsVbBrXl5wYxPZQF-BOMGIrAuoVFcqL9ktmPR2cOR4QMjq_kqr3g__ZisbNknTiiolsTZEO79hiiynMpG7o8TT_1a5hOo2NtR80IX10JPl4L6RzMjkeuq_NAYShvkOoXIHhJqJalSVNfi4KfZZSY_JOhDm3ds6tq38u_886l190JoJWdK0ijxtacFOqUVlsYiIZr8TICzk8WWSC9ka6ksjdSk8caoLLL1Q4EG0a4XgAYXflPlRlq0DSVSE56Ky5u_sZ9CkkAI03JHXlp3V7S3I9SeHSP4557DZca6i5cafB1Ms0NuwkCSHHRm4tL8gME9nbh3Fj-zzdQMFvvFmYkNjKOakVDNh_AVppxT2T7J-TemHs_dk4qHovUVpjkIiGAMXkaiTrUg3l9a79u1dr_O6KTDCxco_I6K-NYUiNCinWe4neiCM2Ro_s9UXREiDastIAs0w7ehH_CJHdJ6tNxo4B5CxHXVHDGqH_g61EBV9hYaVSONY21PXGvY9DiLFrodSPDUjjBKvrK0-KLarVHpwMSkO34S1RbRSC6hi0-4wYsALhp4pE7-fkglE7fwjnph1UxD9P5bNRXsJVbZFTuNe4jtqVnXok8TA9yIb3IV27Bch3d6Ea7OtAcQ_gzUoEeG9BhByTdxzMT_FiVJ7pZv07rZ9jyMVP0pN-PQeOOo3ntltSaBQ3Cg6lQn7a4siA2-LIMX0Nc-t5CLkt5ErmFpTAbK1MZedbuPftyvz78f77YJXHv2W_aZ-bLjckzIq_NPQF6BAyNDtttmeRiiPJ4DGrjfm39fYCVcqkfzawGcIDPEFy87EA88GbezRbmm4D0OLe8WRq4WObWaMr0uYE4LzvlrehHugGfkqOX6BO9WDhzauYFCosVBQ-a9ZRuBPGRr3AYbcZd3xZxF14vKPWgsIYMseP2p-cl89UMq2qn_8TQ7I7pFY82MVOTzKH8d0QCVDNGVd__MYBbt1Hni-uGDnaPoPEhb-lgt6e8ZmGbXEn_Hy3NZjmrMJab1JhfgV9tO2CifvUc2mOL65Urki5VwOUjnc5l5RA9mVCbUjbh2NKK3aP6x2gPgJhvOFlAOh8TUEEIUUxDAZoPVf-ZwIVdPV81qZvhET3zIKJMY6-3Rnyb7m6vR4Bb-XI_ndHO87FCgfrlv2oQY_HWmrJzHDr44i3ZWTmRPcO6IKgKZPklp0yCyP3r0aCB9xvjnfao',
    fetch: fetch
});


var bodyParser = require('body-parser');
 
// configure the app to use bodyParser()
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

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

const TestItemsSchema = new mongoose.Schema({
    employee_id: String,
    items: Array,
});

const TestItem = mongoose.model('TestItems', TestItemsSchema)

const appointmentSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    time: { type: String, required: true }, // e.g., "10:00 AM"
    maxPatients: { type: Number, default: 5 }, // Maximum patients for this slot
    currentPatients: { type: Number, default: 0 }, // Current number of booked patients
});

const TestResult = mongoose.model('TestResult', new mongoose.Schema({}, { strict: false })); // Flexible schema

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
                <!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>No Available Slots</title>
                <style>
                    body {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        font-family: 'Lora', serif;
                        background-color: #aad9d8;
                        text-align: center;
                    }
                    h1 {
                        color: #005A9C;
                        font-size: 2rem;
                        margin-bottom: 20px;
                    }
                    a {
                        text-decoration: none;
                        color: black;
                        font-size: 1rem;
                    }
                </style>
                </head>
                <body>
                    <h1>Employee details updated successfully!</h1>
                    <a href="/check-employee-profile/${updatedEmployee.employee_id}"><u>Back to home</u></a>
                </body>
                </html>
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
 
        const existingBooking = await PatientAppointmentBooking.findOne({ employee_id, date: parsedDate });
        if (existingBooking) {
            return res.status(400).send(`<h1>You have already booked an appointment on this date.</h1><a href="/check-employee-profile/${employee_id}">Back to Home</a>`);
        }
 
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
 
        // Check if the slot is already full
        if (appointment.currentPatients >= appointment.maxPatients) {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>No Available Slots</title>
                <style>
                    body {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        font-family: 'Lora', serif;
                        background-color: #aad9d8;
                        text-align: center;
                    }
                    h1 {
                        color: red;
                        font-size: 2rem;
                        margin-bottom: 20px;
                    }
                    a {
                        text-decoration: none;
                        color: black;
                        font-size: 1rem;
                    }
                </style>
                </head>
                <body>
                    <h1>No available slots for this appointment.</h1>
                    <a href="/booking-form/${employee_id}"><u>Back to book appointment</u></a>
                </body>
                </html>
            `);
        }
 
        const patientAppointment = new PatientAppointmentBooking({
            employee_id,
            date: parsedDate,
            time,
            reason,
            specialRequests,
        });
 
        await patientAppointment.save();
        appointment.currentPatients += 1;
        await appointment.save();
 
        // Send email when exactly 5 patients have booked
        if (appointment.currentPatients === appointment.maxPatients) {
            const mailOptions = {
                from: 'corphassg@gmail.com',
                to: 'parkwaypantaisg@gmail.com',
                subject: 'Appointment Slot Full Notification',
                html: `
                    <h1>Appointment Slot Full Notification</h1>
                    <p>Dear Admin,</p>
                    <p>The following appointment slot has reached its maximum capacity:</p>
                    <ul>
                        <li>Date: ${parsedDate.toDateString()}</li>
                        <li>Time: ${time}</li>
                        <li>Current Patient Count: ${appointment.maxPatients}</li>
                    </ul>
                    <p>Please make the necessary arrangements. Thank you!</p>
                `,
            };
 
            await transporter.sendMail(mailOptions)
                .then(info => console.log('Email sent successfully:', info.response))
                .catch(error => console.error('Error sending email:', error));
        }
 
        const employee = await Employee.findOne({ employee_id });
        if (employee) {
            const mailOptions = {
                from: 'corphassg@gmail.com',
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
 
            await transporter.sendMail(mailOptions);
            console.log('Confirmation email sent to:', employee.email);
        }

        res.send(` 
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Appointment Rescheduled</title>
                <style>
                    body {
                        font-family: 'Lora', serif; 
                        height: 100vh;
                        margin: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background-color: #aad9d8;
                        color: #fff;
                        text-align: center;
                    }
                    .container {
                        background-color: rgba(236, 239, 241, 0.9);
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
                        width: 80%;
                        max-width: 500px;
                    }
                    h1 {
                        color: #005A9C;
                        margin-bottom: 20px;
                    }
                    p {
                        font-size: 16px;
                        margin-bottom: 10px;
                        color: #333;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Appointment booked successfully!</h1> 
                    <p>Date: ${parsedDate.toDateString()}</p> 
                    <p>Time: ${time}</p> 
                    <p>Reason for Visit: ${reason}</p> 
                    <p>Special Requests: ${specialRequests}</p> 
                    <a href="/check-employee-profile/${employee_id}">Back to Home</a> 
                </div>
            </body>
            </html>
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

        // Fetch existing test items
        const testItemsRecord = await TestItem.findOne({ employee_id: employeeID });
        console.log("Test Items Record:", testItemsRecord);
        const existingTestItems = testItemsRecord ? testItemsRecord.items.map(item => item.title) : [];

        if (employee) {
            // Pass employee, appointment, and existing test items to the template
            res.render('addOns', { employee, appointment, employeeID, existingTestItems, testItemsRecord });
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
 
        // Fetch the current appointment for the employee
        const currentAppointment = await PatientAppointmentBooking.findOne({ employee_id });
 
        if (!currentAppointment) {
            console.log('Appointment not found for employee:', employee_id);
            return res.status(404).send("Appointment not found");
        }
 
        // Save the previous appointment details
        const previousAppointment = {
            date: currentAppointment.date,
            time: currentAppointment.time,
            reason: currentAppointment.reason,
            specialRequests: currentAppointment.specialRequests || "None"
        };
 
        // Decrease currentPatients count for the previous time slot
        let oldTimeSlot = await Appointment.findOne({ date: currentAppointment.date, time: currentAppointment.time });
        if (oldTimeSlot) {
            oldTimeSlot.currentPatients = Math.max(0, oldTimeSlot.currentPatients - 1);
            await oldTimeSlot.save();
        }
 
        // Check if the new time slot exists and create/update it accordingly
        let newTimeSlot = await Appointment.findOne({ date, time });
        if (!newTimeSlot) {
            const defaultMaxPatients = 5;
            newTimeSlot = new Appointment({
                date,
                time,
                maxPatients: defaultMaxPatients,
                currentPatients: 0
            });
        }
 
        // Check if there are available slots in the new time slot
        if (newTimeSlot.currentPatients >= newTimeSlot.maxPatients) {
            return res.status(400).send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>No Available Slots</title>
                <style>
                    body {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        font-family: 'Lora', serif;
                        background-color: #aad9d8;
                        text-align: center;
                    }
                    h1 {
                        color: red;
                        font-size: 2rem;
                        margin-bottom: 20px;
                    }
                    a {
                        text-decoration: none;
                        color: black;
                        font-size: 1rem;
                    }
                </style>
                </head>
                <body>
                    <h1>No available slots for this appointment.</h1>
                    <a href="/reschedule-appointment/${employee_id}"><u>Back to reschedule appointment</u></a>
                </body>
                </html>
            `);
        }
 
        newTimeSlot.currentPatients += 1;
        await newTimeSlot.save();
 
        // Send email when the new time slot becomes full
        if (newTimeSlot.currentPatients === newTimeSlot.maxPatients) {
            const mailOptions = {
                from: 'corphassg@gmail.com',
                to: 'parkwaypantaisg@gmail.com',
                subject: 'Appointment Slot Full Notification',
                html: `
                    <h1>Appointment Slot Full Notification</h1>
                    <p>Dear Admin,</p>
                    <p>The following appointment slot has reached its maximum capacity:</p>
                    <ul>
                        <li>Date: ${new Date(date).toDateString()}</li>
                        <li>Time: ${time}</li>
                        <li>Current Patient Count: ${newTimeSlot.maxPatients}</li>
                    </ul>
                    <p>Please make the necessary arrangements. Thank you!</p>
                `,
            };
 
            await transporter.sendMail(mailOptions)
                .then(info => console.log('Email sent successfully:', info.response))
                .catch(error => console.error('Error sending email:', error));
        }
 
        // Update the appointment with new details
        currentAppointment.date = date;
        currentAppointment.time = time;
        currentAppointment.reason = reason;
        currentAppointment.specialRequests = specialRequests;
        await currentAppointment.save();
 
        // Send updated confirmation email with previous and new details
        const employee = await Employee.findOne({ employee_id: currentAppointment.employee_id });
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
                    <p><strong>Previous Appointment Details:</strong></p>
                    <ul>
                        <li>Date: ${new Date(previousAppointment.date).toDateString()}</li>
                        <li>Time: ${previousAppointment.time}</li>
                        <li>Reason: ${previousAppointment.reason}</li>
                        <li>Special Requests: ${previousAppointment.specialRequests}</li>
                    </ul>
                    <p><strong>New Appointment Details:</strong></p>
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
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Appointment Rescheduled</title>
                <style>
                    body {
                        font-family: 'Lora', serif; 
                        height: 100vh;
                        margin: 0;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background-color: #aad9d8;
                        color: #fff;
                        text-align: center;
                    }
                    .container {
                        background-color: rgba(236, 239, 241, 0.9);
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
                        width: 80%;
                        max-width: 500px;
                    }
                    h1 {
                        color: #005A9C;
                        margin-bottom: 20px;
                    }
                    p {
                        font-size: 16px;
                        margin-bottom: 10px;
                        color: #333;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Appointment rescheduled successfully!</h1>
                    <p><strong>Previous Details:</strong></p>
                    <p>Date: ${new Date(previousAppointment.date).toDateString()}</p>
                    <p>Time: ${previousAppointment.time}</p>
                    <p>Reason: ${previousAppointment.reason}</p>
                    <p>Special Requests: ${previousAppointment.specialRequests}</p>
                    <p><strong>New Details:</strong></p>
                    <p>Date: ${new Date(date).toDateString()}</p>
                    <p>Time: ${time}</p>
                    <p>Reason: ${reason}</p>
                    <p>Special Requests: ${specialRequests}</p>
                    <a href="/check-employee-profile/${currentAppointment.employee_id}">Back to Home</a>
                </div>
            </body>
            </html>
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

// Route to handle "report" navbar
app.get('/employee-report/:employeeID', async (req, res) => {
    const { employeeID } = req.params;

    try {
        // Fetch the employee data
        const employee = await Employee.findOne({ employee_id: employeeID });

        // Fetch the latest appointment data
        const appointment = await PatientAppointmentBooking.findOne({ employee_id: employeeID }).sort({ date: -1, time: -1 });

        // Fetch the test items for the employee
        const testItems = await TestItem.findOne({ employee_id: employeeID });

        // Fetch the test results for the given employee ID
        const testResult = await TestResult.findOne({ employeeId: employeeID });

        // Process and clean the data
        const processedResults = {
            counterResults: [],
            addOnCounters: [],
        };

        // If test results exist, process them
        if (testResult) {
            // Process counterResults
            if (testResult.counterResults) {
                for (const [counter, details] of Object.entries(testResult.counterResults)) {
                    processedResults.counterResults.push({
                        testName: details.testName,
                        result: details.result,
                    });
                }
            }

            // Process addOnCounters
            if (testResult.addOnCounters) {
                testResult.addOnCounters.forEach((counter) => {
                    const { testName, tests } = counter;
                    const results = tests.map(test => ({
                        testName: test.testName,
                        result: test.result,
                    }));

                    processedResults.addOnCounters.push({
                        testName,
                        results,
                    });
                });
            }
        }

        // Render the template with all fetched and processed data
        res.render('employeeReport', { 
            employee, 
            appointment, 
            testItems, 
            employeeID, 
            processedResults 
        });

    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Server error');
    }
});


// Handle saving the test items
app.post('/test-items/save/:employee_id', async (req, res) => {
    const { employee_id } = req.params;
    const { details, cartSummary } = req.body;
 
    // Ensure cartSummary exists and has items
    const items = cartSummary?.items || [];
 
    if (items.length === 0) {
        return res.status(400).send('No items provided in the request.');
    }
 
    try {
        console.log('Employee ID from URL:', employee_id);
        console.log('Received Items:', items);
 
        const existingRecord = await TestItem.findOne({ employee_id });
 
        if (existingRecord) {
            const existingItemSet = new Set(existingRecord.items.map(item => JSON.stringify(item)));
            const uniqueNewItems = items.filter(item => !existingItemSet.has(JSON.stringify(item)));
 
            if (uniqueNewItems.length > 0) {
                existingRecord.items.push(...uniqueNewItems);
                await existingRecord.save();
                console.log(`Updated items for employee_id: ${employee_id}`);
            } else {
                console.log(`No new unique items to add for employee_id: ${employee_id}`);
            }
        } else {
            const testItem = new TestItem({
                employee_id,
                items, // Store the items properly
            });
            await testItem.save();
            console.log(`Created new record for employee_id: ${employee_id}`);
        }
 
        // Find the employee's email
        const employee = await Employee.findOne({ employee_id });
 
        if (employee) {
            // Set up nodemailer transporter
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'corphassg@gmail.com',
                    pass: 'jtaq jhof vvro eldm', // Store this securely!
                },
            });
 
            // Format email content
            const mailOptions = {
                from: 'corphassg@gmail.com',
                to: employee.email,
                subject: 'Test Items Confirmation',
                html: `
                    <h1>Test Items Confirmation</h1>
                    <p>Dear ${employee.name},</p>
                    <p>Your test items have been successfully purchased.</p>
                    <h3>Test:</h3>
                    <ul>
                        ${items.map(item => `<li>${item.title} - $${item.price}</li>`).join('')}
                    </ul>
                    <p>Thank you for using our service.</p>
                `,
            };
 
            // Send the email
            await transporter.sendMail(mailOptions);
            console.log(`Confirmation email sent to ${employee.email}`);
        }
 
        res.sendStatus(200);
    } catch (error) {
        console.error('Error:', error.stack);
        res.status(500).send(`Server error while saving items: ${error.message}`);
    }
});

app.get('/bmidoctor/:employeeID', async (req, res) => {
    const { employeeID } = req.params;
    
    try {
        const employee = await Employee.findOne({ employee_id: employeeID });
        if (!employee) {
            return res.status(404).send('Employee not found.');
        }
        
        res.render('bmidoctor', { employee, employeeID }); // Ensure employeeID is passed
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).send('Server error.');
    }
});

app.post('/book-doctor-appointment', async (req, res) => {
    const { employee_id, clinic, date, time } = req.body;

    try {
        // Check if the employee exists
        const employee = await Employee.findOne({ employee_id });
        if (!employee) {
            return res.status(404).send("<h1>Employee not found.</h1>");
        }

        // Email content
        const mailOptions = {
            from: 'corphassg@gmail.com',
            to: employee.email,
            subject: 'Doctor Appointment Confirmation',
            html: `
                <h1>Doctor Appointment Confirmed</h1>
                <p>Dear ${employee.name},</p>
                <p>Your doctor appointment has been successfully booked.</p>
                <p><strong>Details:</strong></p>
                <ul>
                    <li><strong>Clinic:</strong> ${clinic}</li>
                    <li><strong>Date:</strong> ${new Date(date).toDateString()}</li>
                    <li><strong>Time:</strong> ${time}</li>
                </ul>
                <p>Please be on time for your appointment. Thank you.</p>
            `,
        };

        // Send confirmation email
        await transporter.sendMail(mailOptions);

        console.log('Doctor appointment email sent to:', employee.email);

        // Redirect to employee report page
        // res.redirect(`/employee-report/${employee_id}`);
        res.send(`
            <script>
                alert("Appointment booked successfully!");
                if (window.opener) {
                    window.opener.location.href = "/employee-report/${employee_id}"; // Refresh parent
                    window.close(); // Close tab
                } else {
                    window.location.href = "/employee-report/${employee_id}"; // If no parent, redirect
                }
            </script>
        `);

    } catch (error) {
        console.error("Error:", error.stack);
        res.status(500).send(`Server error while booking doctor appointment: ${error.message}`);
    }
});

//pdf-generation 
const createPDF = (doc, employee, appointment, processedResults) => {
    // Add PDF content
    doc.fontSize(16).text('Employee Test Report', { align: 'center' });
    doc.fontSize(12).moveDown();
    doc.text(`Employee ID: ${employee.employee_id}`);
    doc.text(`Name: ${employee.name}`);
    doc.text(`Email: ${employee.email}`);
    doc.text(`Phone: ${employee.phone}`);
    doc.text(`Company: ${employee.company}`);
    doc.text(`Package: ${employee.package}`);
    doc.moveDown();

    if (appointment) {
        doc.text(`Last Appointment: ${appointment.date.toDateString()} at ${appointment.time}`);
    } else {
        doc.text('No appointment details available.');
    }

    doc.moveDown().text('Test Results:', { underline: true });

    // Add counter results
    if (processedResults.counterResults.length > 0) {
        processedResults.counterResults.forEach(result => {
            doc.moveDown().text(`Test Name: ${result.testName}`);
            Object.entries(result.result).forEach(([key, value]) => {
                const resultValue = value ? value : "Pending Result"; // Fallback for empty or null values
                doc.text(`${key}: ${resultValue}`);
            });
        });
    } else {
        doc.text('No Standard Test Results Available.');
    }

    // Add add-on counters
    if (processedResults.addOnCounters.length > 0) {
        doc.moveDown().text('Additional Tests:', { underline: true });
        processedResults.addOnCounters.forEach(counter => {
            doc.moveDown().text(`Test Name: ${counter.testName}`);
            if (counter.results.length > 0) {
                counter.results.forEach(test => {
                    const resultValue = test.result ? test.result : "Pending Result"; // Fallback for empty or null values
                    doc.text(`${test.testName}: ${resultValue}`);
                });
            } else {
                doc.text("Pending Result");
            }
        });
    } else {
        doc.text('No Additional Test Results Available.');
    }
};
app.post('/generate-pdf/:employeeID', async (req, res) => {
    const { employeeID } = req.params;

    try {
        const employee = await Employee.findOne({ employee_id: employeeID });
        const appointment = await PatientAppointmentBooking.findOne({ employee_id: employeeID }).sort({ date: -1, time: -1 });
        const testResult = await TestResult.findOne({ employeeId: employeeID });

        const processedResults = {
            counterResults: [],
            addOnCounters: [],
        };

        if (testResult) {
            if (testResult.counterResults) {
                for (const [counter, details] of Object.entries(testResult.counterResults)) {
                    processedResults.counterResults.push({
                        testName: details.testName,
                        result: details.result || 'Pending Result',
                    });
                }
            }

            if (testResult.addOnCounters) {
                testResult.addOnCounters.forEach(counter => {
                    const { testName, tests } = counter;
                    const results = tests.map(test => ({
                        testName: test.testName || 'Subtest Name',
                        result: test.result || 'Pending Result',
                    }));

                    processedResults.addOnCounters.push({
                        testName,
                        results,
                    });
                });
            }
        }

        const doc = new PDFDocument();
        const filename = `Employee_TestResult_Report_${employeeID}.pdf`;

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        doc.pipe(res);

        createPDF(doc, employee, appointment, processedResults);
        doc.end(); // Finalize PDF document

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Server error while generating PDF.');
    }
});
app.post('/store-in-dropbox/:employeeID', async (req, res) => {
    const { employeeID } = req.params;

    try {
        const employee = await Employee.findOne({ employee_id: employeeID });
        if (!employee) {
            return res.status(404).send('Employee not found.');
        }

        const appointment = await PatientAppointmentBooking.findOne({ employee_id: employeeID }).sort({ date: -1, time: -1 });
        const testResult = await TestResult.findOne({ employeeId: employeeID });

        const processedResults = {
            counterResults: [],
            addOnCounters: [],
        };

        if (testResult) {
            if (testResult.counterResults) {
                for (const [counter, details] of Object.entries(testResult.counterResults)) {
                    processedResults.counterResults.push({
                        testName: details.testName,
                        result: details.result || 'Pending Result',
                    });
                }
            }

            if (testResult.addOnCounters) {
                testResult.addOnCounters.forEach(counter => {
                    const { testName, tests } = counter;
                    const results = tests.map(test => ({
                        testName: test.testName || 'Subtest Name',
                        result: test.result || 'Pending Result',
                    }));

                    processedResults.addOnCounters.push({
                        testName,
                        results,
                    });
                });
            }
        }

        const doc = new PDFDocument();
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', async () => {
            const pdfBuffer = Buffer.concat(buffers);
            const dropboxPath = `/EmployeeReports/${employee.email}_TestReport.pdf`;

            try {
                await dbx.filesUpload({
                    path: dropboxPath,
                    contents: pdfBuffer,
                    mode: 'overwrite',
                });

                console.log(`Report stored in Dropbox: ${dropboxPath}`);
                res.status(200).send('Report stored in Dropbox.');
            } catch (dropboxError) {
                console.error('Error uploading to Dropbox:', dropboxError);
                res.status(500).send('Error uploading to Dropbox.');
            }
        });

        createPDF(doc, employee, appointment, processedResults);
        doc.end(); // Finalize PDF document

    } catch (error) {
        console.error('Error generating/storing PDF:', error);
        res.status(500).send('Server error while storing report.');
    }
});

app.listen(port, () => {
    console.log("server started")
})