const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Consent = require('../models/Consent');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// @route   POST api/consent/request
// @desc    Doctor requests access to a patient's records
// @access  Private (Doctor only)
router.post('/request', [auth, roleCheck(['doctor', 'admin'])], async (req, res) => {
    const { patientId } = req.body;

    try {
        const patient = await User.findById(patientId);
        if (!patient) {
            return res.status(404).json({ msg: 'Patient not found' });
        }

        // Find the Doctor profile associated with the logged-in user
        // Assuming req.user.id links to a User, we need to find the Doctor profile
        // Strategy: We can either look up Doctor by user ID if they are linked, or 
        // if the User IS the doctor (same collection or linked). 
        // Based on previous files, Doctor is a separate model.
        // Let's assume for this MVP that the User 'role'='doctor' is sufficient to *act* as a doctor,
        // but we need a Doctor ID for the Consent model.
        // For now, let's look for a Doctor document that might share the email or user ID.
        // *Correction*: The Doctor model doesn't strictly link to User (it has 'hospital' ref).
        // Let's assume req.user.id IS the doctor's User ID, and we'll store that.
        // Wait, Consent model has `doctor: { type: ObjectId, ref: 'Doctor' }`. 
        // We'll search for a Doctor profile with the same email as the logged-in user.
        
        const user = await User.findById(req.user.id);
        const doctorProfile = await Doctor.findOne({ contact: user.email }); // makeshift link via email/contact

        if (!doctorProfile) {
            // Fallback: If no specific Doctor profile, maybe the User ID is used?
            // But Consent schema expects ref: 'Doctor'.
            // For the sake of the simulation, let's create a temporary link or fail.
            // Let's assume for now we use the User ID but it might fail population if strict.
            // Let's return error to be safe.
             return res.status(400).json({ msg: 'Doctor profile not found for this user.' });
        }

        const newConsent = new Consent({
            patient: patientId,
            doctor: doctorProfile._id,
            status: 'pending',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default 7 days
        });

        await newConsent.save();

        // Audit Log
        await new AuditLog({
            action: 'REQUEST_ACCESS',
            performedBy: req.user.id,
            targetResource: newConsent._id,
            resourceType: 'Consent',
            details: `Doctor requested access to patient ${patient.name}`
        }).save();

        res.json(newConsent);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/consent/my-requests
// @desc    Doctor views requests they sent
// @access  Private (Doctor only)
router.get('/my-requests', [auth, roleCheck(['doctor', 'admin'])], async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const doctor = await Doctor.findOne({ contact: user.email });
        
        if (!doctor) return res.status(400).json({ msg: 'Doctor profile not found' });

        const requests = await Consent.find({ doctor: doctor._id }).populate('patient', 'name email');
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/consent/pending
// @desc    Patient views pending requests
// @access  Private (Patient only)
router.get('/pending', [auth, roleCheck(['user'])], async (req, res) => {
    try {
        const requests = await Consent.find({ 
            patient: req.user.id,
            status: 'pending' 
        }).populate('doctor', 'name specialty hospital');
        
        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/consent/:id/respond
// @desc    Patient approves or rejects a request
// @access  Private (Patient only)
router.put('/:id/respond', [auth, roleCheck(['user'])], async (req, res) => {
    const { status } = req.body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid status' });
    }

    try {
        let consent = await Consent.findById(req.params.id);

        if (!consent) return res.status(404).json({ msg: 'Consent request not found' });

        // Ensure the patient owns this request
        if (consent.patient.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        consent.status = status;
        await consent.save();

        // Audit Log
        await new AuditLog({
            action: `CONSENT_${status.toUpperCase()}`,
            performedBy: req.user.id,
            targetResource: consent._id,
            resourceType: 'Consent',
            details: `Patient ${status} access request`
        }).save();

        res.json(consent);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/consent/check/:patientId
// @desc    Check if doctor has valid access to a patient
// @access  Private (Doctor/Admin)
router.get('/check/:patientId', [auth, roleCheck(['doctor', 'admin'])], async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        const doctor = await Doctor.findOne({ contact: user.email });
        if (!doctor) return res.status(400).json({ msg: 'Doctor profile not found' });

        const consent = await Consent.findOne({
            patient: req.params.patientId,
            doctor: doctor._id,
            status: 'approved',
            expiresAt: { $gt: Date.now() }
        });

        if (consent) {
            res.json({ hasAccess: true, consent });
        } else {
            res.json({ hasAccess: false });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
