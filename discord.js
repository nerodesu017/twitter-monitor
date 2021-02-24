const discord_config = require('./config.json')["discord"];

const request = require('request');

const util = require('util');

const post = util.promisify(request.post);
const sleep = util.promisify(setTimeout);


async function sendWebhook(username, tweet_link) {
    await post({ url: discord_config["webhook"], headers: { "Content-Type": "application/json" }, body: JSON.stringify({ 'content': `**${username}** just tweeted ${tweet_link}` }) });
    await sleep(discord_config["timeout"]);
}

module.exports = {
    sendWebhook
}

