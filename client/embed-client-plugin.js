function register({ registerHook }) {
    registerHook({
        target: 'action:embed.player.loaded',
        handler: async ({ player, videojs, video }) => {
            console.log("embedded within the wall", player, videojs, video);

            let x = document.getElementsByClassName("vjs-control-bar");
            console.log("menu", x[0]);
            let butt = document.createElement("span");
            butt.ariaHidden = "true"
            butt.class = `vjs-fullscreen-control vjs-control vjs-button`
            butt.type = "button";
            butt.title = "send sats to creators";

            butt.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="48" viewBox="0 0 1024 1024" class="icon" version="1.1"><path d="M257.344 385.344l209.792 119.808 25.344 14.592-163.456 435.968 327.36-341.248-0.192-0.128 96.896-101.76-228.352-128 105.92-315.392z" fill=""/><path d="M547.776 499.904L335.104 378.176l201.984-171.072-66.624 198.4 210.432 117.952-93.888 98.56-139.648 145.536z" fill="#FDFF4F"/></svg></span><span class="vjs-control-text" aria-live="polite">Zap</span>`;
            butt.id = "zap-button"
            console.log("butt", butt);
            x[0].appendChild(butt);
            let zap = document.getElementById('zap-button');
            zap.onclick = async function () {
                console.log("zap me baby");
                console.log("video.channel.host", video.channel.name);
                try {
                    let supported = await checkWebLnSupport();
                    console.log("supported value for webln in boost ", supported);
                    if (supported < 2) {
                        //await sendSats(walletData, amount, message);
                        return;
                    }
                } catch {
                    console.log("error checking for webln support in browser");
                    return;
                }
                let creator = video.channel.name + "@" + video.channel.host;
                console.log(creator);
                let wallet = await getWalletInfo(creator);
                console.log(wallet);
                let totalBoost = 1000;
                for (var split of wallet){
                    let splitAmount = (totalBoost*split.split)/100
                    await boost(split,splitAmount,totalBoost);
                }
            }
            async function checkWebLnSupport() {
                try {
                    await webln.enable()
                    if (typeof webln.keysend === 'function') {
                        console.log('✅ webln keysend support');
                        return 2;
                    } else {
                        console.log("✅ webln supported ⛔️ keysend not supported");
                        return 1;
                    }
                } catch {
                    console.log("⛔️ webln not supported");
                    return 0;
                }
            }
            async function boost(walletData, amount, totalAmount) {
                let message = "zap";
                let from = "embedded viewer";
                let channel = video.channel.name;
                let channelName = video.channel.displayName;
                let episode = video.title;
                let type = "boost";
                let itemID = 1;
                let boostTotal = totalAmount;
                let splitName = "";
                let shortUrl = "https://"+video.channel.host+"/w/"+video.shortUUID;
                let episodeGuid= shortUrl;
                console.log("embedded boost called", walletData, amount, message, from, channel, episode, type, episodeGuid, channelName, shortUrl);

                let remoteHost, remoteUser, localHost;
                if (parseInt(amount) < 1) {
                    amount = "1";
                }
                //if (channelName) {
                //    let parts = channelName.split("@");
                //    remoteUser = parts[0];
                //    if (parts.length > 1) {
                //        remoteHost = parts[1];
                //    }
                //}
                let pubKey = walletData.keysend.pubkey;
                if (!pubKey){
                    console.log("unable to find pubkey for split",walletData);
                    return;
                }
                let customKeyHack, customValue
                if (walletData.keysend.customData) {
                    customKeyHack = walletData.keysend.customData[0].customKey;
                    customValue = walletData.keysend.customData[0].customValue;
                }
                if (!splitName) {
                    splitName = channel;
                }
                if (!boostTotal) {
                    boostTotal = amount;
                }
                let version;
                /*
                try {
                    let versionResult = await axios.get(basePath + "/getversion");
                    if (versionResult && versionResult.data) {
                        version = versionResult.data;
                    }
                } catch (err) {
                    console.log("error getting software version", basePath, err);
                }
                */
                version = "4.2.0"
                const boost = {
                    action: type,
                    value_msat: amount * 1000,
                    value_msat_total: boostTotal * 1000,
                    app_name: "PeerTube",
                    app_version: version,
                    name: splitName,
                };
                if (from) {
                    boost.sender_name = from;
                }
                if (message) {
                    boost.message = message;
                }
                if (shortUrl){
                    boost.url = shortUrl;
                    boost.link = shortUrl;
                }
                //if (currentTime) {
                //    boost.ts = parseInt(currentTime.toFixed());
                //} else {
                //    console.log("no current time value for boost");
                //}
                if (channel) {
                    boost.podcast = channel;
                }
                if (episode) {
                    boost.episode = episode;
                }
                /*
                console.log("href",window.location.href);
                if (window.location.href) {
                    boost.episode_guid = window.location.href;
                    let parts = boost.episode_guid.split('/');
                    localHost = parts[2];
                    if (remoteHost) {
                        boost.episode_guid = "https://" + remoteHost + "/" + parts[3] + "/" + parts[4];
                        localHost = parts[2];
                    }
                }
                boost.boost_link = window.location.href;
                if (currentTime) {
                    boost.boost_link = boost.boost_link + "?start=" + currentTime.toFixed();
                }
                
                if (channelName) {
                    if (remoteHost) {
                        boost.url = window.location.protocol + "//" + remoteHost + "/plugins/lightning/router/podcast2?channel=" + channelName
                    } else {
                        boost.url = window.location.protocol + "//" + localHost + "/plugins/lightning/router/podcast2?channel=" + channelName
                    }

                }
                        let itemApi = basePath + "/getitemid?uuid=" + episodeGuid;
                        try {
                            let itemId = await axios.get(itemApi);
                            if (itemId) {
                                boost.itemID = itemId.data;
                            }
                        } catch (err) {
                        }
                        let feedApi = basePath + "/getfeedaid?channel=" + channelName;
                        try {
                            let feedId = await axios.get(feedApi);
                            if (feedId) {
                                boost.feedID = feedId.data;
                            }
                        } catch (err) {
                        }
                        let guid;
                        let guidApi = basePath + "/getchannelguid?channel=" + channelName;
                        try {
                            guid = await axios.get(guidApi);
                            if (guid) {
                                boost.guid = guid.data;
                            }
                        } catch (err) {
                        }
                */
                let paymentInfo;
                if (customValue) {
                    paymentInfo = {
                        destination: pubKey,
                        amount: amount,
                        customRecords: {
                            7629169: JSON.stringify(boost),
                            [customKeyHack]: customValue,
                        }
                    };
                } else {
                    paymentInfo = {
                        destination: pubKey,
                        amount: amount,
                        customRecords: {
                            7629169: JSON.stringify(boost),
                        }
                    };
                }
                console.log("payment info", paymentInfo);
                let result;
                try {
                    result = await webln.keysend(paymentInfo);
                    return result;
                } catch (err) {
                    console.log("error attempting to send sats using keysend", err.message);
                    return;
                }
            }
            async function getWalletInfo() {
                let videoName = video.name;
                let accountName = video.account.name;
                let channelName = video.channel.name;
                let instanceName = video.channel.host;
                let walletApi = "https://" + instanceName + "/plugins/lightning/router/getsplit";
                if (channelName) {
                    walletApi = walletApi + "?channel=" + channelName;
                }
                if (instanceName) {
                    walletApi = walletApi + "@" + instanceName;
                }
                console.log("api call for video wallet info", walletApi);
                let walletData;
                try {
                    let response = await fetch(walletApi);
                    console.log("first response", response);
                    let responseOK = response && response.ok;
                    if (responseOK) {
                        walletData = await response.json();
                        // do something with data
                    } else {
                        console.log("response not ok", response);
                    }
                } catch (err) {
                    console.log("client unable to fetch wallet data\n", walletApi, err);
                    return;
                }
                console.log(walletData);
                return walletData;
            }
        }

    })

}
export {
    register
}

