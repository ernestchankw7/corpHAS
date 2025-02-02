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
            return res.status(400).send("<h1>No available slots for this appointment.</h1>");
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
            return res.status(400).send("<h1>No available slots for the selected appointment.</h1>");
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

// Route to generate PDF dynamically
app.post('/generate-pdf/:employeeID', async (req, res) => {
    const { employeeID } = req.params;

    try {
        // Fetch the required data
        const employee = await Employee.findOne({ employee_id: employeeID });
        const appointment = await PatientAppointmentBooking.findOne({ employee_id: employeeID }).sort({ date: -1, time: -1 });
        const testResult = await TestResult.findOne({ employeeId: employeeID });

        // Process results
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

        // Create a new PDF document
        const doc = new PDFDocument();
        const filename = `Employee_TestResult_Report_${employeeID}.pdf`;

        // Set headers for file download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

        // Pipe the PDF to the response
        doc.pipe(res);

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
        if (processedResults.counterResults.length > 0) {
            processedResults.counterResults.forEach(result => {
                doc.moveDown().text(`Test Name: ${result.testName}`);
                Object.entries(result.result).forEach(([key, value]) => {
                    doc.text(`${key}: ${value}`);
                });
            });
        } else {
            doc.text('No Standard Test Results Available.');
        }

        if (processedResults.addOnCounters.length > 0) {
            doc.moveDown().text('Additional Tests:', { underline: true });
            processedResults.addOnCounters.forEach(counter => {
                doc.moveDown().text(`Test Name: ${counter.testName}`);
                
                if (counter.results.length > 0) {
                    counter.results.forEach(test => {
                        const resultValue = (test.result === null || test.result === undefined || test.result === "") 
                            ? "null" 
                            : test.result;
                        doc.text(`${test.testName}: ${resultValue}`);
                    });
                } else {
                    doc.text("Result: null"); // Ensures "null" is displayed when there are no results
                }
            });
        } else {
            doc.text('No Additional Test Results Available.');
        }

        // End the PDF document
        doc.end();
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Server error while generating PDF.');
    }
});

// Handle saving the test items
app.post('/test-items/save/:employee_id', async (req, res) => {
    const { employee_id } = req.params;
    const { details, cartSummary } = req.body;
    const items = cartSummary.items; // Directly use the items from cartSummary
 
    try {
        // Log the incoming data for debugging
        console.log('Employee ID from URL:', employee_id);
        console.log('CartSummary:', cartSummary);
 
        // Check if a record already exists for this employee_id
        const existingRecord = await TestItem.findOne({ employee_id });
 
        if (existingRecord) {
            // Filter out duplicate items
            const existingItemSet = new Set(existingRecord.items.map(item => JSON.stringify(item)));
            const uniqueNewItems = items.filter(item => !existingItemSet.has(JSON.stringify(item)));
 
            if (uniqueNewItems.length > 0) {
                existingRecord.items.push(...uniqueNewItems); // Append only unique items
                await existingRecord.save();
                console.log(`Updated items for employee_id: ${employee_id}`);
            } else {
                console.log(`No new unique items to add for employee_id: ${employee_id}`);
            }
        } else {
            // If no record exists, create a new one
            const testItem = new TestItem({
                employee_id,
                items,
            });
            await testItem.save();
            console.log(`Created new record for employee_id: ${employee_id}`);
        }
 
        // Return a 200 response to mark success
        res.sendStatus(200);
    } catch (error) {
        console.error('Error:', error.stack);
        res.status(500).send(`Server error while saving items: ${error.message}`);
    }
});

app.listen(port, () => {
    console.log("server started")
})