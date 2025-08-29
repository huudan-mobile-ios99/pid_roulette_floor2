const express = require('express');
const axios = require('axios');
const cron = require('node-cron');

const router = express.Router();

// Function to send signal to FastAPI and log the result
const sendSignalToFastAPI = async (signal) => {
    try {
        const response = await axios.post('http://127.0.0.1:3000/send-signal/', null, {
            params: { signal }
        });

        const status = response.data.status;
        if (status === 1) {
            console.log('Received signal from FastAPI: Audio is playing');
        } else if (status === 0) {
            console.log('Received signal from FastAPI: No audio playing');
        } else {
            console.log('Received signal from FastAPI: Signal is null or empty');
        }
    } catch (error) {
        console.error('Error sending signal to FastAPI:', error.message);
    }
};



// Function to fetch the current signal from FastAPI and log it
const fetchSignalFromFastAPI = async () => {
    try {
        // Sending a GET request to fetch the current signal value
        const response = await axios.get('http://127.0.0.1:3000/get-signal/');
        const signal = response.data.current_signal;

        if (signal === 1) {
            console.log('Audio playing');
        } else if (signal === 0 ) {
            console.log('No playing');
        } else if (signal === 2) {
            console.log('Signal null or empty');
        } else {
            console.log('Unknown signal');
        }
    } catch (error) {
        console.error('Error fetching signal from FastAPI:', error.message);
    }
};



// Cron job to trigger FastAPI every 5 seconds and log the result
cron.schedule('*/5 * * * * *', async () => {
    try {
        // Trigger FastAPI to get the signal
        await fetchSignalFromFastAPI();
    } catch (error) {
        console.error('Error during cron job execution:', error.message);
    }
});

// Listening for signals from the FastAPI server
router.post('/signal-receiver', (req, res) => {
    const { signal } = req.body;
    if (signal === '1') {
        console.log('Received signal: Audio is playing');
    } else if (signal === '0') {
        console.log('Received signal: No audio playing');
    } else {
        console.log('Received signal: Signal is null or empty');
    }
    res.status(200).json({ message: 'Signal received' });
});

module.exports = router;