const blocklist = ["covid-19","covid","covid19","bolsonaro"];

function apply_regexes(text){
    let result = blocklist.map(function (regex_string) {
        let regex = new RegExp(regex_string,'gim');
        return regex.test(text);
    })
    return ! result.includes(true);
}

function remove_tweets(details){
    let filter = browser.webRequest.filterResponseData(details.requestId);
    let decoder = new TextDecoder("utf-8");
    let encoder = new TextEncoder();
    let string = '';

    filter.ondata = event => {
        string += decoder.decode(event.data, {stream: true});
    };

    filter.onstop = event => {
        try {
            let json = JSON.parse(string);
            let tweets = json["globalObjects"]["tweets"];
            let allowed_tweets = {};
            for(var key in tweets) {
                let tweet = tweets[key]
                if (apply_regexes(tweet["full_text"])) {
                    allowed_tweets[key] = tweet;
                }
            }
            json["globalObjects"]["tweets"] = allowed_tweets;
            let response = JSON.stringify(json)
            filter.write(encoder.encode(response));
            filter.close();
        }
        catch (e) {
            console.log(string)
            console.log(e)
        }
    }
    return {};
} 

browser.webRequest.onBeforeRequest.addListener( remove_tweets, { urls: [ 'https://api.twitter.com/2/timeline/home.json?*', 'https://api.twitter.com/2/search/adaptive.json?*' ] } , ['blocking']);
