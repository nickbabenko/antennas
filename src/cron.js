const cron = require('node-cron');

const updateEpg = require('./cron/updateEpg');

module.exports = () => {
    cron.schedule('*/10 * * * *', updateEpg);
};