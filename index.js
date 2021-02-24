const { sendWebhook } = require('./discord');
const { twitter } = require('./config.json');
const util = require('util');
const request = require('request');
const qs = require('qs');

const get = util.promisify(request.get);
const sleep = util.promisify(setTimeout);

const bearer_token = twitter.api.bearer_token;
const endpointURL = new URL('https://api.twitter.com/2/tweets/search/recent');
let bearer_header = {
    'authorization': `Bearer ${bearer_token}`
}

const username = twitter.username;
const params = {
    // 'max_results': 1,
    'start_time': 0,
    'query': `from:${username} -is:retweet -is:reply`
};
// const userTweetTimelineURL = `https://api.twitter.com/2/users/${user_id}/tweets`;
// const tweetsFromUserURL = `https://api.twitter.com/2/tweets/search/recent`;
let tweet_link = (id) => `https://twitter.com/${username}/status/${id}`;
const timeout = twitter.timeout;
const initial_timeout = twitter.initial_timeout;

(async () => {
    // return;
    // Do first run and find first tweet
    let last_id = false;
    let date = undefined;
    let state = undefined;
    // state = 0 for no new tweets
    // state = 1 for new tweets

    while (true) {
        try {
            await sleep(timeout);
            // when making the first req, you need to make it with at least 10 seconds before the current time
            // we use 11s because I was getting the 10s error even tho I used to substract 10s (10000 ms)
            if(date == undefined)date = new Date(Date.now() - 11000).toISOString();

            // if we don't have a previous id of a tweet we know it s the first run
            // we will request based on time
            if(last_id == false){
                params["start_time"] = date;
            }

            const req = await get({ url: endpointURL, headers: { ...bearer_header }, qs: params, json: true });

            // the state variable keeps count if the last time we fetched the tweets
            // if we've gathered any new tweets
            // it's like a switch
            // i don't think it s that needed since we already check for new tweets based on id
            // BAD IMPLEMENTATION most prolly by me
            if (req["body"]["meta"]["result_count"] == 0) {
                if(state != 0)console.log("No new tweets found!");
                state = 0;
                continue;
            }
            // if we found any new tweets we have to remember the id of the latest tweet
            // and also send it to discord
            else {
                let id;
                console.log(`Found ${req["body"]["meta"]["result_count"]} new tweets`);
                for (let i = 0; id > last_id, i < req.body.data.length; i++) {
                    id = req.body.data[i].id;
                    if(id == last_id)break;
                    console.log(`${i+1}. Tweet id: ${id}`);
                    state = 1;
                    await sendWebhook(username, tweet_link(id));
                }
                last_id = true;
                delete params["start_time"];
                params["since_id"] = req["body"]["meta"]["newest_id"];
            }
            
            

        } catch (e) {
            console.error(e);
            // process.exit(-1);
        }
    }
    process.exit();
})();