const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const { Dropbox } = require('dropbox');
const fetch = require('node-fetch');
const cron = require('node-cron');
const fs = require('fs');
//const port = 2000
const port = process.env.PORT || 2000;

const app = express();
app.use(express.urlencoded({ extended: true }))

const dbx = new Dropbox({
    accessToken: 'sl.u.AFh-W-7K21-TmFFMlN6udsOxIZbTgDRlekyNMx9NhgeXlSkCxuXOTdQfOXGChYMdSP7iFNGD80hW5_MOX94EzLmqV0jNc2PQMJbCe_w51e-YxMAQNlG5NEHNKo1optRNbe-ZyKLeLynCNTN15yOQFSG4IQrwNpCoarNGDuyNSkRazCgqYeExF_lQee3pLqxKKqH56Faqq3Hi0sqXYAf2_KSAMOJRxP77-HRT7ztjTaH0T7Pkc06wz4d9b6eGxf0xr07kncQAnzBWX-YxQBtRmabW5wYl2vl6CkLyxbcPnk1ec9Ixr-ZJQXtO--gcVt-3S3mMary7HkY8Jled6OYEgDp8eW4_dBLeh0eT44xJ3VP7HBvBida6FvjS50RYswMvl_PpkU22Epu-Hb_HBcgGZwmpvZjdwSGXIn-u0ckr91ZmZu5u918XOLa0y7-QyVSmhl37vjLcPVRSOSLHBjGNfG-Mbw9-haoLPgypp1XlqdEQ4IPYEDdYb61GhW44ZTR_I6ZEVBBAcK3-wiPMXZfzhClaOx-W-8LjIhNy4Y8-foq2RMMvE-FUVgh0V1-WtaxeBq49nVBdWYoEoeBZS6jpaOVL2tT18o29l_Z9GZaYeKcKl-MV5Y4H0rgaLD-xZAzywbomxmh7n0O92PWAvrG5-T9sbQWKe--mtux6jbLANuJF-yjmenWbHTLPqTSTOf_38flYo6tuUC5FLLrfLmmhC-ncjjz02aeAFb5ZwnUwqUFpe2EjpXMdVmVlD6tY4Kf_hdiNa-YYvJuSR04EuTlUzpXpz-5UzeQB4XGqaNp_ZoLE2zxywl_uh9YfLP4pAEEGhjN-rcjBLh-ObevEbckfRzGn3sfdDr8ErYOGuEU1A_Jt-TnayvJL4HPor4Kmf1R5M0UfObscLR8lrElKxbqBPwcX1SYOOy2A4GNlyUsP64JbUIIm4ILPMn8sjfEcwA-1a4ZX_9doiFPuuIAE563Peiv1XeFeHAuesLdEn-1G3rek8ZLgV0w9dcpnFBMmyw-AdZJUA4grs6ngs8MDRx2LwaLGF9yQeVESsnSKA29pHrR2ug_yIo0aSap2dMq9O-iyMNa1_AreM3GY0p0Bu6aesnG4cGtHbeh9kHp_BDkoRhjbptyI1pFgLcWrVzuXf7QR_8uYJatGsewsxY5VGLQFn441n64zwWmsg4xkZW4N0q-GbvnRppQalCatzPXn8gmTS71Bq5R16Xo9LLMtVb297_Cp8t5P2ROL85uEF_HjzegGl1FyU82pIEGqYhJjWU3Ovkw',
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
                    <h1>Invalid employee ID</h1>
                    <a href="/"><u>Try again</u></a>
                </body>
                </html>
            `);
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
        console.log('Employee ID from URL:', employee_id);
 
        // Fetch the current appointment
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
 
        // Helper function to convert dates
        function toLocalYMD(dateObj) {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
 
        const oldDateObj = new Date(currentAppointment.date);
        const oldDateStr = toLocalYMD(oldDateObj);
        const newDateObj = new Date(date);
        const newDateStr = toLocalYMD(newDateObj);
 
        const oldTimeStr = currentAppointment.time;
        const newTimeStr = time;
 
        if (oldDateStr === newDateStr && oldTimeStr === newTimeStr) {
            // return res
            //   .status(400)
            //   .send("<h1>You have selected the same date and time as your current appointment. No changes made.</h1>");
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
                    <h1>You have selected the same date and time as your current appointment. No changes made</h1>
                    <a href="/reschedule-appointment/${employee_id}"><u>Back to reschedule appointment</u></a>
                </body>
                </html>
            `);
        }
 
        const oldSlot = await Appointment.findOne({
            date: oldDateStr,
            time: oldTimeStr
        });
 
        // --------------------------------------------------
        // 4) INCREMENT THE NEW SLOT'S currentPatients
        // --------------------------------------------------
        let newSlot = await Appointment.findOne({
            date: newDateStr,
            time: newTimeStr
        });
 
        if (!newSlot) {
            newSlot = new Appointment({
                date: newDateStr,
                time: newTimeStr,
                maxPatients: 5,
                currentPatients: 0
            });
        }
 
        if (newSlot.currentPatients >= newSlot.maxPatients) {
            //return res.status(400).send("<h1>No available slots for the selected appointment.</h1>");
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
 
        // Decrement the old slot's currentPatients only if the reschedule succeeds
        if (oldSlot) {
            oldSlot.currentPatients = Math.max(0, oldSlot.currentPatients - 1);
            await oldSlot.save();
        }
 
        newSlot.currentPatients += 1;
        await newSlot.save();
 
        if (newSlot.currentPatients === newSlot.maxPatients) {
            const mailOptions = {
                from: 'corphassg@gmail.com',
                to: 'parkwaypantaisg@gmail.com',
                subject: 'Appointment Slot Full Notification',
                html: `
                    <h1>Appointment Slot Full Notification</h1>
                    <p>Dear Admin,</p>
                    <p>The following appointment slot has reached its maximum capacity:</p>
                    <ul>
                        <li>Date: ${newDateObj.toDateString()}</li>
                        <li>Time: ${time}</li>
                        <li>Current Patient Count: ${newSlot.maxPatients}</li>
                    </ul>
                    <p>Please make the necessary arrangements. Thank you!</p>
                `,
            };
 
            await transporter.sendMail(mailOptions)
                .then(info => console.log('Email sent successfully:', info.response))
                .catch(error => console.error('Error sending email:', error));
        }
 
        currentAppointment.date = date;
        currentAppointment.time = time;
        currentAppointment.reason = reason;
        currentAppointment.specialRequests = specialRequests;
        await currentAppointment.save();
 
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
                        <li>Date: ${previousAppointment.date.toDateString()}</li>
                        <li>Time: ${previousAppointment.time}</li>
                        <li>Reason: ${previousAppointment.reason}</li>
                        <li>Special Requests: ${previousAppointment.specialRequests}</li>
                    </ul>
                    <p><strong>New Appointment Details:</strong></p>
                    <ul>
                        <li>Date: ${newDateObj.toDateString()}</li>
                        <li>Time: ${time}</li>
                        <li>Reason: ${reason}</li>
                        <li>Special Requests: ${specialRequests || 'None'}</li>
                    </ul>
                    <p>Thank you for using our service.</p>
                `,
            };
 
            await transporter.sendMail(mailOptions);
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

// Email Reminder 1 Hour Before Appointment
cron.schedule('* * * * *', async () => {
    console.log('Running email reminder job to check for appointments one hour in advance.');
 
    try {
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000); // Add 1 hour
 
        // Format the date and time for matching appointments
        const targetDate = oneHourLater.toISOString().split('T')[0];
        const targetTime = `${String(oneHourLater.getHours()).padStart(2, '0')}:${String(oneHourLater.getMinutes()).padStart(2, '0')}`;
 
        // Fetch appointments one hour later from the current time
        const appointments = await PatientAppointmentBooking.find({ date: targetDate, time: targetTime });
 
        for (const appointment of appointments) {
            const employee = await Employee.findOne({ employee_id: appointment.employee_id });
 
            if (employee) {
                const mailOptions = {
                    from: 'corphassg@gmail.com',
                    to: employee.email,
                    subject: 'Appointment Reminder',
                    html: `
                        <h1>Your Appointment Reminder</h1>
                        <p>Dear ${employee.name},</p>
                        <p>This is a reminder for your appointment scheduled for:</p>
                        <ul>
                            <li>Date: ${new Date(appointment.date).toDateString()}</li>
                            <li>Time: ${appointment.time}</li>
                        </ul>
                        <p>Please ensure your availability. Thank you!</p>
                    `,
                };
 
                await transporter.sendMail(mailOptions);
                console.log(`Reminder email sent to: ${employee.email}`);
            }
        }
    } catch (error) {
        console.error('Error sending reminder emails:', error);
    }
});

app.listen(port, () => {
    console.log("server started")
})