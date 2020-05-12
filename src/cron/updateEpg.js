const fs = require('fs');
const request = require('request-promise-native');
const getAPIOptions = require('../api_options');

const XML_HEADER = `<?xml version="1.0" encoding="utf-8"?>
    <tv generator-info-name="antenna" generator-info-url="antenna.co.uk">`
const epgFile = __dirname + '/../../tmp/epg.xml'

const LIMIT = 1000;

async function getEpgEvents(start = 0) {
    const options = getAPIOptions(`/api/epg/events/grid?start=${start}&limit=${LIMIT}`);
    try {
        let response = await request(options);
        response = response.replace(//g, ''); // replace weird whitespace invisible character that breaks JSON parse
        const parsedResponse = JSON.parse(response);
        return {
            entries: parsedResponse.entries,
            totalCount: parsedResponse.totalCount,
            start,
        };
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function getEpgChannels() {
    const options = getAPIOptions('/api/channel/grid?start=0&limit=999999');
    try {
        const response = await request(options);
        return response.entries;
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function writeChannels() {
    const channels = await getEpgChannels();
    channels.forEach(channel => {
        fs.appendFileSync(epgFile, `        <channel id="${channel.uuid}">`);
        fs.appendFileSync(epgFile, `            <display-name>${channel.name}</display-name>`);
        fs.appendFileSync(epgFile, '        </channel>');
    });
}

async function writeProgrammes(offset = 0) {
    const programmes = await getEpgEvents();
    programmes.entries.forEach(programme => {
        fs.appendFileSync(epgFile, `        <programme start="${programme.start}" stop="${programme.stop}" channel="${programme.channelUuid}">`);
        fs.appendFileSync(epgFile, `            <title lang="en">${programme.title}</title>`);
        if ('summary' in programme) {
            fs.appendFileSync(epgFile, `            <desc lang="en">${programme.summary}</title>`);
        }
        fs.appendFileSync(epgFile, '        </programme>');
    });
    if (programmes.offset + LIMIT < programmes.totalCount) {
        await writeProgrammes(programmes.offset + LIMIT);
    }
}

module.exports = async () => {
    console.log('Rebuilding EPG');
    fs.writeFileSync(epgFile, XML_HEADER);
    await writeChannels();
    await writeProgrammes();
    fs.appendFileSync(epgFile, '    </tv>');
    console.log('EPG rebuilt');
};