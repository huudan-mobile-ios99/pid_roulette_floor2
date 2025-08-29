const express = require('express');
const router = express.Router();
const dboperation = require('./dboperation');
const { sendRequestToServer, checkServerConnectivity } = require('./socket');


// Middleware to log requests
router.use((req, res, next) => {
    console.log(`middleware! router - ${req.method} ${req.url}`);
    next();
});
// Define the GET endpoint
router.route('/').get(async (req, res, next) => {
    try {
        res.json('Novastar H-Series Controller APIs.');
    } catch (error) {
        next(error);
    }
});

router.route('/enum').get(async (req, res, next) => {
    try {
        res.json({"rl1": "1", "rl2": "2", "bc3": "3", "bc4": "40", "ads": "5"});
    } catch (error) {
        next(error);
    }
});

// Load preset by preset ID
router.route('/loadPreset').post(async (req, res, next) => {
    checkServerConnectivity();
    const { presetId } = req.body;
    const requestData = [
        {
            "cmd": "W0605",
            "deviceId": 0,
            "screenId": 0,
            "presetId": presetId
        }
    ];
    try {
        sendRequestToServer(requestData);
        res.json(`load preset ${presetId} successfully`);
    } catch (error) {
        next(error);
    }
});

// Machine Roulette online status
router.route('/machine_online_status').post((request, response) => {
    const { date } = request.body;
    dboperation.getMachineOnlineStatus(date).then(result => { response.json(result) });
});

// Machine slot online status
router.route('/slot_online_status').post((request, response) => {
    const { date } = request.body;
    dboperation.getSlotOnlineStatus(date).then(result => { response.json(result) });
});

//User Info
router.route('/user_info').post((request, response) => {
    let {number} = request.body;
    dboperation.getUserInfo(number).then(result => {
       response.json(result);
    });
});


router.route('/slot_online_status_info').post(async (request, response) => {
    const { date } = request.body;
    try {
        const slotOnlineStatus = await dboperation.getSlotOnlineStatus(date);
        const mergedData = [];
        for (const slot of slotOnlineStatus) {
            let { Number } = slot;
            console.log('Number:', Number);
            // Convert Number to string if necessary
            if (Number !== null && Number !== undefined) {
                Number = String(Number);
                // console.log('Converted Number:', Number);
            } else {
                // console.log('Invalid Number:', Number);
                Number = ''; // Or handle appropriately
            }
            // Fetch user info based on the Number from the slot
            let userInfo = null;
            if (Number) {
                try {
                    userInfo = await dboperation.getUserInfo(Number);
                    // console.log('User Info: ', userInfo);
                } catch (userInfoError) {
                    console.error('An error occurred while fetching user info:', userInfoError);
                }
            }
            // If userInfo is found and has data, merge it with the slot data
            if (userInfo && userInfo.data && userInfo.data.length > 0) {
                slot.userInfo = userInfo.data[0]; // Add user info to the slot object
            } else {
                slot.userInfo = null; // If no user info is found, set it as null
            }
            // Add the merged object to the final data array
            mergedData.push(slot);
        }
        // Send the merged data as the response
        response.json(mergedData);
    } catch (error) {
        console.error('Error fetching data:', error);
        response.status(500).json({ error: 'Failed to fetch data' });
    }
});



// Machine online status
router.route('/stop_cron').get((req, res) => {
    cron.stopCronJob();
    res.json('Cron job stopped.');
});

// Machine online status
router.route('/restart_cron').get((req, res) => {
    cron.reStartCronJob();
    res.json('Cron job re-started.');
});




// Debounce function to prevent multiple calls
function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

// Apply debounce to your cron job actions
const debounceRestartCronJob = debounce(() => {
    cron.reStartCronJob();
}, 300); // 300ms debounce

const debounceStopCronJob = debounce(() => {
    cron.stopCronJob();
}, 300); // 300ms debounce


module.exports = router; 