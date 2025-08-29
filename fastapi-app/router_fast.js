require('dotenv').config(); // Load environment variables

const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
const router = express.Router();
const dboperation = require('../dboperation');  // Adjust the path as needed

 

let delay = 2000; // Initial delay in milliseconds (5 seconds)
let nextFetchTime = Date.now(); // Track the next fetch time
let logCount = 1; // Initialize log count
let previousSignal = null; // Variable to track the previous signal value



const apiUrl2 = process.env.API_URL2;



const myFunctionStart = () => {
    console.log(`[Start] : Started Playing.`);
    dboperation.loadPreset(5);
    
};

const myFunctionEnd = () => {
    console.log(`[End] : Finished.`);
    dboperation.loadPreset(1);
};


// Function to fetch the current signal from FastAPI and log it
const fetchSignalFromFastAPI = async () => {
    try {
        // Sending a GET request to fetch the current signal value
        const response = await axios.get('http://127.0.0.1:3000/get-signal/');
        const signal = response.data.current_signal;

        let message;
        if (signal === 1) {
            if (previousSignal !== 1) {
                myFunctionStart(); 
                delay = 1000; // Set delay to 1 seconds
                
            }
            message = 'Playing';
        } else if (signal === 0 || signal === 2) {
            if (previousSignal === 1) {
                myFunctionEnd();
                delay = 2000; // Reset delay to 5 seconds
            }
            message = 'No Play';
        } else {
            message = 'Unknown';
            delay = 2000; // Default delay
        }

        // Update previousSignal to the current signal
        previousSignal = signal;
        // Log with timestamp and count
        if(signal===1){
            console.log(`${message} (${logCount++}) : ${new Date().toISOString()}`);
        }
        console.log(`${message} (${logCount++}) : ${new Date().toISOString()}`);
    } catch (error) {
        console.error('Error fetching signal from FastAPI:', error.message);
    }
};

// Function to schedule and handle the dynamic delay
const scheduleFetch = () => {
    cron.schedule('* * * * * *', async () => {
        if (Date.now() >= nextFetchTime) {
            await fetchSignalFromFastAPI();
            nextFetchTime = Date.now() + delay; // Update next fetch time based on delay
        }
    });
};

scheduleFetch();

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