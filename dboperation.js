var config = require('./config/dbconfig')
const DBNAME = '[neoncmsprod]';
const sql = require('mssql');
const { sendRequestToServer, checkServerConnectivity } = require('./socket');



// GET MACHINE ONLINE STATUS
async function getMachineOnlineStatus(date) {
    try {
    let pool = await sql.connect(config)
    // let query = `SELECT dbo.Machine.Number, dbo.machineplayersession.[Status] FROM ${DBNAME}.[dbo].[MachinePlayerSession] Join dbo.Machine
    //     On dbo.machine.MachineID=dbo.MachinePlayerSession.MachineID
    //     Where dbo.machineplayersession.Status='1'
    //     And dbo.machine.number IN ('603','604','906','601','602')
    //     And StartGamingDate=@input_id`;
    let query = `SELECT dbo.Machine.Number, dbo.machineplayersession.[Status] FROM ${DBNAME}.[dbo].[MachinePlayerSession] Join dbo.Machine
        On dbo.machine.MachineID=dbo.MachinePlayerSession.MachineID
        Where dbo.machineplayersession.Status='1'
        And dbo.machine.number IN ('901','902','903','904','905','906','601','602','603','604')
        And StartGamingDate=@input_id`;
    const data_query = await pool.request().input('input_id', sql.NVarChar, date).query(`${query}`)
    return data_query.recordset;
    } catch (error) {
        console.log(`An error orcur getMachineOnlineStatus: ${error}`);
    }
}


// GET MACHINE SLOT ONLINE STATUS
async function getSlotOnlineStatus(date) {
    try {
    let pool = await sql.connect(config)
    let query = `SELECT dbo.customer.Number,[UnknownPlayerID],dbo.Machine.Number as MachineNumber,[StartGamingDate],[StartDateTime],[EndDateTime],dbo.machineplayersession.[Status]
        FROM ${DBNAME}.[dbo].[MachinePlayerSession]
        Join dbo.Machine
        On dbo.machine.MachineID=dbo.MachinePlayerSession.MachineID
        Join dbo.Customer
        On dbo.customer.CustomerID=dbo.MachinePlayerSession.CustomerID
        Where dbo.machineplayersession.Status='1'
        And dbo.machine.number IN ('4001','4002','4003','4004','4005','906')  And StartGamingDate=@input_id`;
    const data_query = await pool.request().input('input_id', sql.NVarChar, date).query(`${query}`)
    return data_query.recordset;
    } catch (error) {
        console.log(`An error orcur getSlotOnlineStatus: ${error}`);
    }
}


// Load preset by preset ID function
async function loadPreset(presetId) {
    checkServerConnectivity();
    const requestData = [
        {
            "cmd": "W0605",
            "deviceId": 0,
            "screenId": 0,
            "presetId": presetId
        }
    ];
    try {
        await sendRequestToServer(requestData);
        return `Load preset ${presetId} successfully`;
    } catch (error) {
        throw new Error(`Error loading preset ${presetId}: ${error.message}`);
    }
}



//GET CUSTOMER NATIONALITY
async function getUserInfo(number) {
    const query = `SELECT [CustomerID], [Number], [Surname], [SurnameSoundsLike], [Forename], [MiddleName], [Title], [PreferredName], [Gender],
    [DateOfBirth], [HomePhone], [MobilePhone],[BusinessPhone], [EmailAddress],  [DateTimeRegistered], [MembershipTypeID], [GamingDateLastVisited],
    [PremiumPlayer],[RewardProgramID],[PremiumPlayerStatus],[CasinoHostEmployeeID],
    [PrimarySalutation],[Nationality],[ISOCode]
    FROM ${DBNAME}.[dbo].[Customer] Join dbo.Country on dbo.country.CountryID=dbo.Customer.CountryID Where number=@input_number`;
    let messageError = "not found user info";
    try {
        let pool = await sql.connect(config);
        let info = await pool.request().input('input_number', sql.NVarChar, number).query(query)
        if (info.recordset) {
            return {
                "status": true,
                "message": 'found user info',
                "data": info.recordset,
            }
        } else {
            console.log('no rows affected ');
            return {
                "status": false,
                "message": messageError,
                "data": null,
            }
        }
    } catch (error) {
        console.log(`An error orcur get user info: ${error}`)
        return  {
            "status": false,
            "message": messageError,
            "data": null,
        }
    }
}


module.exports = {
    getMachineOnlineStatus: getMachineOnlineStatus,
    getSlotOnlineStatus:getSlotOnlineStatus,
    getUserInfo:getUserInfo,
    loadPreset:loadPreset
}