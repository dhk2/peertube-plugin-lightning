const axios = require('axios');
const crypto = require('crypto');
const { channel } = require('diagnostics_channel');
const { version } = require('./package.json');
async function register({
  registerHook,
  registerSetting,
  getRouter,
  peertubeHelpers,
  settingsManager,
  storageManager,
}) {
  /*
    registerSetting({
      name: 'lightning-custom-key',
      label: 'Custom Key',
      type: 'input',
      private: true
    })
  
    registerSetting({
      name: 'lightning-custom-value',
      label: 'Custom Value',
      type: 'input',
      private: true
    })
  
    registerSetting({
      name: 'lightning-node-address',
      label: 'Node Address',
      type: 'input',
      private: true
    })
  */
  registerSetting({
    name: 'lightning-address',
    label: 'Lightning address',
    type: 'input',
    private: false
  })
  registerSetting({
    name: 'lightning-split',
    label: 'Requires split for host',
    type: 'input',
    private: false
  })
  registerSetting({
    name: 'lightning-tipVerb',
    label: 'Verb to use for tipping',
    type: 'input',
    private: false
  })
  var base = peertubeHelpers.config.getWebserverUrl();
  let lightningAddress = await settingsManager.getSetting("lightning-address");
  if (!lightningAddress) {
    console.log("No wallet configured for system");
    lightningAddress = "errhead@getalby.com"
  }
  if (lightningAddress.indexOf("@") < 1) {
    console.log("malformed wallet address for system", lightningAddress);
    lightningAddress = "errhead@getalby.com"
  }
  let hostSplit = await settingsManager.getSetting("lightning-split");
  console.log("hostsplit", hostSplit);
  let hostWalletData = {};
  hostWalletData.address = lightningAddress;
  hostWalletData.name = lightningAddress;
  let hostKeysendData = await getKeysendInfo(lightningAddress);
  if (!hostKeysendData) {
    console.log("failed to get system wallet data from provider");
  } else {
    hostWalletData.keysend = hostKeysendData;
    console.log("█setting hostwallet keysnd\n", hostKeysendData);
  }
  if (hostSplit > 0 || hostSplit <= 100) {
    console.log("setting host split to ", hostSplit);
    hostWalletData.split = parseInt(hostSplit);
  }
  hostWalletData.fee = true;
  //TODO add lnurl for hostwallet for wallet browsers without keysend support
  const router = getRouter();
  router.use('/walletinfo', async (req, res) => {
    console.log("█Request for wallet info\n", req.query)
    if (req.query.address) {
      console.log("getting wallet info");
      let address = req.query.address;
      let keysendData = await getKeysendInfo(address);
      let lnurlData = await getLnurlInfo(address);
      if (lnurlData || keysendData) {
        let walletData = {};
        walletData.address = address;
        if (keysendData) {
          walletData.keysend = keysendData;
          console.log("successfully retrieved keysend data for ", address, keysendData);
        }
        if (lnurlData) {
          walletData.lnurl = lnurlData;
          console.log("successfully retrieved lnurl data for ", address, lnurlData);
        }
        return res.status(200).send(walletData);
      } else {
        console.log("lightning address passed in query does not resolve", address);
      }
    }
    if (req.query.video) {
      apiCall = base + "/api/v1/videos/" + req.query.video;
      console.log("█ getting video data", apiCall);
      let videoData;
      try {
        videoData = await axios.get(apiCall);
      } catch {
        console.log("failed to pull information for provided video id", apiCall);
      }
      if (videoData) {
        let foundLightningAddress = await findLightningAddress(videoData.data.description + " " + videoData.data.support);
        if (foundLightningAddress) {
          console.log("lightning address found in video description [" + foundLightningAddress + ']');
          let keysendData = await getKeysendInfo(foundLightningAddress);
          let lnurlData = await getLnurlInfo(foundLightningAddress);
          if (lnurlData || keysendData) {
            let walletData = {};
            walletData.address = foundLightningAddress;
            if (keysendData) {
              walletData.keysend = keysendData;
              console.log("successfully retrieved keysend data for wallet in video", videoData.data.channel.name, keysendData);
              //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);
            }
            if (lnurlData) {
              walletData.lnurl = lnurlData;
              console.log("successfully retrieved lnurl data for wallet in video", videoData.data.channel.name, lnurlData);
              //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);

            }
            return res.status(200).send(walletData);
          } else {
            console.log("lightning address in video description does not resolve", foundLightningAddress);
          }
        } else {
          console.log("no lightning address found in video description");
        }
      }
    }
    if (req.query.channel) {
      apiCall = base + "/api/v1/video-channels/" + req.query.channel;
      console.log("█ getting channel data", apiCall);
      let channelData;
      try {
        channelData = await axios.get(apiCall);
      } catch {
        console.log("failed to pull information for provided channel id", apiCall);
      }
      if (channelData) {
        let foundLightningAddress = await findLightningAddress(channelData.data.description + " " + channelData.data.support);
        if (foundLightningAddress) {
          console.log("lightning address found in channel description [" + foundLightningAddress + ']');
          let keysendData = await getKeysendInfo(foundLightningAddress);
          let lnurlData = await getLnurlInfo(foundLightningAddress);
          if (lnurlData || keysendData) {
            let walletData = {};
            walletData.address = foundLightningAddress;
            if (keysendData) {
              walletData.keysend = keysendData;
              console.log("successfully retrieved keysend data for wallet in channel", channelData.data.name, keysendData);
            }
            if (lnurlData) {
              walletData.lnurl = lnurlData;
              console.log("successfully retrieved lnurl data for wallet in channel", channelData.data.name, lnurlData);
            }
            return res.status(200).send(walletData);
          } else {
            console.log("lightning address in channel description does not resolve", foundLightningAddress);
          }
        } else {
          console.log("no lightning address found in channel description");
        }
      }
    }
    if (req.query.account) {
      apiCall = base + "/api/v1/accounts/" + req.query.account;
      console.log("█ getting account data", apiCall);
      let accountData;
      try {
        accountData = await axios.get(apiCall);
      } catch {
        console.log("failed to pull information for provided account id", apiCall);
      }
      if (accountData) {
        let foundLightningAddress = await findLightningAddress(accountData.data.description);
        if (foundLightningAddress) {
          console.log("lightning address found in account description [" + foundLightningAddress + ']');
          let keysendData = await getKeysendInfo(foundLightningAddress);
          let lnurlData = await getLnurlInfo(foundLightningAddress);
          if (lnurlData || keysendData) {
            let walletData = {};
            walletData.address = foundLightningAddress;
            if (keysendData) {
              walletData.keysend = keysendData;
              console.log("successfully retrieved keysend data for wallet in account", accountData.data.name, keysendData);
            }
            if (lnurlData) {
              walletData.lnurl = lnurlData;
              console.log("successfully retrieved lnurl data for wallet in account", accountData.data.name, lnurlData);
            }
            return res.status(200).send(walletData);
          } else {
            console.log("lightning address in account description does not resolve", foundLightningAddress);
          }
        } else {
          console.log("no lightning address found in account description");
        }

      }
    }
    console.log("no lightning address found at all");
    return res.status(400).send();
  })
  router.use('/podcast2', async (req, res) => {
    console.log("█████████████████ podcast2 request ██████████████");
    if (req.query.channel == undefined) {
      console.log("no channel requested", req.query);
      return res.status(400).send();
    }
    let channel = req.query.channel
    let instance, instanceUrl;
    if (channel.indexOf("@") > 1) {
      let channelParts = channel.split("@");
      instance = channelParts[1];
      instanceUrl = "https://" + instance;
      channel = channelParts[0];
    } else {
      instanceUrl = base;
    }
    console.log("channel", channel, "instance", instance, instanceUrl);
    let apiUrl = instanceUrl + "/api/v1/video-channels/" + channel;
    let mirrorUrl = instanceUrl + `/api/v1/server/redundancy/videos?target=my-videos`;
    let channelData;
    try {
      channelData = await axios.get(apiUrl);
      //console.log("want some ",await axios.get(mirrorUrl).data);
    } catch {
      console.log("unable to load channel info", apiUrl);
      return res.status(400).send();
    }
    console.log("loaded channel data from", apiUrl);
    let rssUrl = instanceUrl + "/feeds/videos.xml?videoChannelId=" + channelData.data.id;
    let rssData;
    try {
      rssData = await axios.get(rssUrl)
    } catch {
      console.log("unable to load rss feed for channel", rssUrl);
      return res.status(400).send();
    }
    console.log("loaded rss feed from", rssUrl);
    apiUrl = base + "/plugins/lightning/router/getsplit?channel=" + req.query.channel;
    let lightningData
    let splitData;
    try {
      splitData = await axios.get(apiUrl);
    } catch {
      console.log("unable to load lightning wallet info for channel", apiUrl);
      splitData = { data: {} };
    }
    console.log("loaded wallet information for channel", apiUrl, splitData.data.length);
    /*let pubKey, tag, customKey, customValue;
    if (lightningData.data.keysend) {
      pubKey = lightningData.data.keysend.pubkey;
      tag = lightningData.data.keysend.tag;
      if (lightningData.data.keysend.customData[0]) {
        customKey = lightningData.data.keysend.customData[0].customKey;
        customValue = lightningData.data.keysend.customData[0].customValue;
      }
    } else {
      console.log("no keysend data available for wallet")
    }
    */
    let splits = splitData.data;
    let keysend = false;
    for (let s in splits) {
      console.log("checking splits", keysend, splits[s]);
      if (splits[s].keysend) {
        keysend = true;
      }
    }
    console.log("keysend", keysend, split);
    let channelGuid;
    apiUrl = base + "/plugins/lightning/router/getchannelguid?channel=" + req.query.channel;
    try {
      guidData = await axios.get(apiUrl);
      if (guidData.data) {
        console.log("channel guid", guidData.data);
        channelGuid = guidData.data;
      }
    } catch {
      console.log("unable to load channel guid", apiUrl);
    }

    let counter = 0;
    let fixed = "";
    let spacer = "";
    let rss = rssData.data;
    let lines = rss.split('\n');
    let newLine = "";
    let resolution = "";
    let displayName = channelData.data.displayName;
    for (var line of lines) {
      counter++;
      //console.log(counter,line);
      if (counter == 2) {
        line = `<rss version="2.0" xmlns:podcast="https://github.com/Podcastindex-org/podcast-namespace/blob/main/docs/1.0.md" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">`
      }
      if (line.indexOf("<enclosure") > 0) {
        continue;
      }
      if ((line.indexOf("media:content") > 0) && (line.indexOf('height="0"') < 1)) {
        continue;
      }
      if ((line.indexOf("media:content") > 0)) {
        cut = line.substring(line.indexOf('fileSize') + 9, line.indexOf("framerate"));
        console.log(cut);
        newLine = '<enclosure type="video/mp4" length=' + cut + "/>";
        console.log(newLine);
      }
      if (line.indexOf('atom:link') > 0) {
        spacer = (line.substring(0, line.indexOf('<')));

        fixed = fixed + "\n" + spacer + '<podcast:locked owner="' + req.query.channel + '">no</podcast:locked>';
        fixed = fixed + '\n' + spacer + '<itunes:owner>\n'
        //fixed = fixed + spacer + '\t<itunes:email>' + 'errhead@gmail.com' + '</itunes:email>\n'
        fixed = fixed + spacer + '\t<itunes:name>' + channel + '</itunes:name>\n'
        fixed = fixed + spacer + '</itunes:owner>\n';
        fixed = fixed + spacer + '<itunes:author>' + displayName + '</itunes:author>\n'
        if (keysend) {
          fixed = fixed + spacer + '<podcast:value type="lightning" method="keysend" suggested="0.00000000069">\n';
          for (var split of splits) {
            if (split.keysend) {
              fixed = fixed + spacer + '\t<podcast:valueRecipient name="' + split.name + '" type="node" address="' + split.keysend.pubkey + '"';
              if (split.keysend.customData) {
                let cv = split.keysend.customData[0].customValue
                let ck = split.keysend.customData[0].customKey;
                if (cv) {
                  fixed = fixed + ' customValue="' + cv + '"'
                }
                if (ck) {
                  fixed = fixed + ' customKey="' + ck + '"'
                }
              }
              fixed = fixed + ` split="` + split.split + `" />\n`;
            }
          }
          fixed = fixed + spacer + '</podcast:value>\n';
        } else {
          console.log("no pubkey value");
        }
        if (channelGuid) {
          fixed = fixed + spacer + '<podcast:guid>' + channelGuid + '</podcast:guid>\n'
        } else {
          console.log("no channel guid available");
        }
      }
      if (line.indexOf("<url>") > 0) {
        spacer = (line.substring(0, line.indexOf('<')));
        let avatar = channelData.data.avatar
        if (avatar != null) {
          line = spacer + '<url>' + instanceUrl + avatar.path + '</url>';
        }
      }
      if (line.indexOf("media:thumbnail") > 0) {
        spacer = (line.substring(0, line.indexOf('<')));
        let cut = line.substring(line.indexOf('url=') + 5);
        cut = cut.substring(0, cut.indexOf('"'));

        fixed = fixed + "\n" + spacer + '<itunes:image>' + cut + '</itunes:image>';
      }
      if (line.indexOf('media:title') > 0) {
        spacer = (line.substring(0, line.indexOf('<')));
        fixed = fixed + '\n' + spacer + newLine;
      }
      if (line.indexOf('guid>') > 0) {
        spacer = (line.substring(0, line.indexOf('<')));

        let cut = line.substring(line.indexOf('<guid>') + 6);
        cut = cut.substring(0, cut.indexOf('</guid>'));
        console.log("cut", cut);
        urlPieces = cut.split("/");
        let id = urlPieces[urlPieces.length - 1];
        console.log("id", id);
        apiUrl = base + "/plugins/lightning/router/getchannelguid?channel=" + req.query.channel;
        let captionApi = base + "/api/v1/videos/" + id + "/captions";
        let captionResult;
        try {
          captionResult = await axios.get(captionApi);
        } catch (err) {
          console.log("failed requesting transcript data", err);
        }

        //TODO go through all captions available and add with language
        if (captionResult && captionResult.data && captionResult.data.total > 0) {
          console.log("caption result", captionResult.data);
          captionPath = instanceUrl+captionResult.data.data[0].captionPath
          if (captionPath.indexOf("vtt") > 1) {
            fixed = fixed + "\n" + spacer + `<podcast:transcript url="` + captionPath + `" type="text/vtt" rel="captions"/>`;
          } else {
            fixed = fixed + "\n" + spacer + `<podcast:transcript url="` + captionPath + `" type="text/plain" rel="captions"/>`;

          }

        }
        //fixed = fixed + "\n" + spacer + '<podcast:socialInteract protocol="activitypub" uri="' + cut + '"/>';
        //console.log("█████████████████ user account", channelData.data.ownerAccount);
        //fixed = fixed + "\n" + spacer + '<podcast:socialInteract protocol="activitypub" uri="https://lawsplaining.peertube.biz/videos/watch/9b31d490-7c3b-4fab-81e6-302cf48320b4" accountId="@' + channelData.data.ownerAccount.name + '" accountUrl="' + channelData.data.ownerAccount.url + '"/>';
        fixed = fixed + "\n" + spacer + '<podcast:socialInteract protocol="activitypub" uri="' + cut + '" accountId="@' + channelData.data.ownerAccount.name + '" accountUrl="' + channelData.data.ownerAccount.url + '"/>';

      }


      fixed = fixed + '\n' + line;
    }
    res.status(200).send(fixed);
    //console.log(rssResult.data);
    return;

  })
  router.use('/setWallet', async (req, res) => {
    if (!req.query.key) {
      return res.status(400).send("missing key");
    }
    if (req.query.address) {
      let walletInfo = getKeysendInfo(req.query.address);
      if (walletInfo) {
        let lightning = {};
        lightning.address = req.query.address;
        lightning.data = newData
        console.log("███saving wallet data", req.query.key, lightning);
        //storageManager.storeData("lightning" + "-" + req.query.key, lightning);
        return res.status(200).send(lightning);
      } else {
        console.log("failed to get wallet info for provided address", req.query.address);
        return res.status(400).send();
      }
    }

    if (!req.query.pubkey) {
      return res.status(400).send("missing pubkey");
    }
    if (!req.query.tag) {
      return res.status(400).send("missing tag");
    }
    let newData = {
      status: "OK",
      tag: req.query.tag,
      pubkey: req.query.pubkey,
    }

    if (req.query.customvalue) {
      if (!req.query.customkey) {
        req.query.customkey = "696969";
      }
      let customData = {
        customKey: req.query.customkey,
        customValue: req.query.customvalue,
      }
      let customDataArray = [];
      customDataArray.push(customData);
      newData.customData = customDataArray;
    }
    let lightning = {};
    lightning.data = newData
    console.log("███saving wallet data", req.query.key, lightning);
    //storageManager.storeData("lightning" + "-" + req.query.key, lightning);
    return res.status(200).send(lightning);
  })
  router.use('/getinvoice', async (req, res) => {
    //  console.log(req);
    console.log("███ getting lnurl invoice", req.query.name, req.query.amount, req.query.callback);
    //let callback = decodeURI(req.query.callback);
    //let name=encodeURIComponent(req.query.name);
    let message = encodeURIComponent(req.query.message);
    let invoiceRequest = req.query.callback + "?amount=" + req.query.amount + "&comment=" + message;
    console.log("███invoice request url", invoiceRequest);
    let result;
    try {
      result = await axios.get(invoiceRequest);
    } catch (err) {
      console.log("failed to get invoice", err);
      return res.status(400).send(err);
    }
    console.log(result.data);
    return res.status(200).send(result.data);
  })
  router.use('/getfeedid', async (req, res) => {
    console.log("███getting feed id", req.query.channel);
    let channel = req.query.channel;
    let feed;
    if (channel) {
      try {
        feed = await storageManager.getData("podcast" + "-" + channel)
      } catch (err) {
        console.log("error getting feedid", channel);
      }
    }
    console.log("feed", feed);
    if (feed) {
      return res.status(200).send(feed.toString());
    } else {
      return res.status(400).send();
    }
  })
  router.use('/setfeedid', async (req, res) => {
    console.log("███setting feed id", req.query.channel);
    let channel = req.query.channel;
    let feedID = req.query.feedid;
    if (channel) {
      try {
        await storageManager.storeData("podcast" + "-" + channel, feedID);
        return res.status(200).send();
      } catch (err) {
        console.log("error getting feedid", channel);
        return res.status(400).send();
      }
    }
  })
  router.use('/getitemid', async (req, res) => {
    console.log("███getting item id", req.query.uuid);
    let uuid = req.query.uuid;
    let item;
    if (uuid) {
      try {
        item = await storageManager.getData("podcast" + "-" + uuid);
      } catch (err) {
        console.log("error getting itemid", uuid);
      }
    }
    console.log("item", item);
    if (item) {
      return res.status(200).send(item.toString());
    } else {
      return res.status(400).send();
    }
  })
  router.use('/getlnurl', async (req, res) => {
    console.log("███getting lnrul info", req.query.address);
    let result = getLnurlInfo(req.query.address);
    if (result) {
      return res.status(200).send(result);
    } else {
      return res.status(400).send();
    }
  })
  router.use('/setitemid', async (req, res) => {
    console.log("███setting item id", req.query.uuid);
    let uuid = req.query.uuid;
    let itemID = req.query.itemid;
    if (uuid) {
      try {
        await storageManager.storeData("podcast" + "-" + uuid, itemID);
        return res.sendStatus(200);
      } catch (err) {
        console.log("error setting item id", uuid);
        return res.sendStatus(400).send();
      }
    }
  })
  router.use("/getAllWallets", async (req, res) => {
    console.log("███getting all wallet info for channel");
    let channel = req.query.channel;
    let fullWalletData;
    if (channel) {
      try {
        fullWalletData = await storageManager.getData("fullWalletData" + "-" + channel)
      } catch (err) {
        console.log("error getting all wallet data", channel);
      }
    }
    console.log("all wallet data", fullWalletData);
    if (fullWalletData) {
      return res.status(200).send(fullWalletData);
    } else {
      return res.status(400).send();
    }
  })
  router.use("/setAllWallets", async (req, res) => {
    console.log("███setting all wallets for a channel");
    let channel = req.query.channel;
    let wallets = req.body.wallets;
    if (channel && wallets) {
      try {
        await storageManager.storeData("fullwallets" + "-" + channel, wallets);
        return res.sendStatus(200);
      } catch (err) {
        console.log("error storing full wallets", channel, wallets);
        return res.sendStatus(400).send();
      }
    }
  })
  router.use('/getchannelguid', async (req, res) => {
    console.log("███getting channel guid");
    let channel = req.query.channel;
    let channelGuid;
    if (channel) {
      try {
        channelGuid = await storageManager.getData("channelguid" + "-" + channel)
      } catch (err) {
        console.log("error getting channel guid", channel);
        return res.status(400).send();
      }
    }
    console.log("channel guid", channelGuid);
    if (channelGuid) {
      return res.status(200).send(channelGuid);
    } else {
      channelGuid = crypto.randomUUID();
      if (channelGuid) {
        console.log("Setting channel guid", channelGuid);
        await storageManager.storeData("channelguid" + "-" + channel, channelGuid);
        return res.status(200).send(channelGuid);
      } else {
        return res.status(400).send();
      }
    }
  })
  router.use('/getsplit', async (req, res) => {
    console.log("█Request for split info\n", req.query)
    var storedSplitData;
    if (req.query.video) {
      //var storedSplitData = await storageManager.getData("lightningsplit" + "-" + req.query.video);
      console.log("█retrieved split info", req.query.video, "\n", storedSplitData);
      if (storedSplitData) {
        console.log("returning video split info", req.query.key);
        return res.status(200).send(storedSplitData);
      }
      console.log("stored split data not found for video");
      if (!req.query.channel) {
        console.log("base", base);
        var apiCall = base + "/api/v1/videos/" + req.query.video;
        console.log("█ getting video data", apiCall);
        let videoData;
        try {
          videoData = await axios.get(apiCall);
        } catch {
          console.log("failed to pull information for provided video id", apiCall);
        }
        if (videoData) {
          console.log("videodata", videoData.streamingPlaylists);
          let videoChannel = videoData.data.channel.name;
          storedSplitData = await storageManager.getData("lightningsplit" + "-" + videoChannel);
          console.log("█retrieved chaNNEL split info", videoChannel, storedSplitData.length);
          if (storedSplitData) {
            console.log("returning stored channel split", req.query.channel);
            //TODO save video split info?
            return res.status(200).send(storedSplitData);
          }
          let videoHost = "https://" + videoData.data.channel.host;
          if (videoHost != base) {
            remoteWalletApi = videoHost + "/plugins/lightning/router/getsplit?channel=" + channel.name;
            let remoteSplitData;
            try {
              remoteSplitData = await axios.get(remoteWalletApi);
            } catch {
              console.log("failed to pull remote split info", apiCall);
            }
            if (remoteSplitData) {
              return res.status(200).send(remoteSplitData);
            }
          }
          //let split
          console.log(videoData.data.channel);
          let foundLightningAddress = await findLightningAddress(videoData.data.description + " " + videoData.data.support + " " + videoData.data.channel.description + " " + videoData.data.channel.support + " " + videoData.data.account.description);
          if (foundLightningAddress) {
            console.log("lightning address found in video description [" + foundLightningAddress + ']');
            let keysendData = await getKeysendInfo(foundLightningAddress);
            let lnurlData = await getLnurlInfo(foundLightningAddress);
            if (lnurlData || keysendData) {
              let walletData = {};
              walletData.address = foundLightningAddress;
              if (keysendData) {
                walletData.keysend = keysendData;
                console.log("successfully retrieved keysend data for wallet in video", videoData.data.channel.name, keysendData);
                //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);
              }
              if (lnurlData) {
                walletData.lnurl = lnurlData;
                console.log("successfully retrieved lnurl data for wallet in video", videoData.data.channel.name, lnurlData);
                //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);

              }
              if (walletData.keysend) {
                if (walletData.address.indexOf("fountain.fm") > 0) {
                  walletData.keysend = null;
                }
              }
              var splitData = new Array();
              walletData.split = 100;
              splitData.push(walletData);
              if (hostWalletData && (videoHost == base)) {
                splitData[0].split = 100 - hostWalletData.split;
                splitData.push(hostWalletData);
              }
              await storageManager.storeData("lightningsplit" + "-" + req.query.video, splitData);
              return res.status(200).send(splitData);
            } else {
              console.log("lightning address in video description does not resolve", foundLightningAddress);
            }
          } else {
            console.log("no lightning address found in video description");
          }
        }
      }
      //console.log("unable to find any split info in video data");
      //return res.status(400).send();
    }
    if (req.query.channel) {
      var storedSplitData;
      var storedSplitData = await storageManager.getData("lightningsplit" + "-" + req.query.channel);

      if (storedSplitData) {
        console.log("█retrieved chaNNEL split info", req.query.channel, "\n", storedSplitData.length);
        console.log("returning stored data", storedSplitData.length);
        return res.status(200).send(storedSplitData);
      }
      console.log("stored split data not found");
      let remoteHost, remoteChannel;
      if (req.query.channel.indexOf("@") > 1) {
        let channelParts = req.query.channel.split("@");
        remoteHost = channelParts[1];
        remoteChannel = channelParts[0];
      }
      var apiCall;
      if (remoteHost) {
        console.log("getting remote data");
        apiCall = "https://" + remoteHost + "/plugins/lightning/router/getsplit?channel=" + remoteChannel;
        let remoteSplit;
        try {
          remoteSplit = await axios.get(apiCall);
        } catch {
          console.log("unable to fetch remote split data", apiCall);
        }
        if (remoteSplit) {
          console.log("returning remote split", apiCall, remoteSplit.data);
          return res.status(200).send(remoteSplit.data);
        }
      }


      apiCall = base + "/api/v1/video-channels/" + req.query.channel;
      console.log("█ getting channel data", apiCall);
      let channelData;
      try {
        channelData = await axios.get(apiCall);
      } catch {
        console.log("failed to pull information for provided channel id", apiCall);
      }
      if (channelData) {
        //console.log("channeldata",channelData);
        let foundLightningAddress = await findLightningAddress(channelData.data.description + " " + channelData.data.support);
        if (foundLightningAddress) {
          console.log("lightning address found in channel description [" + foundLightningAddress + ']');
          let keysendData = await getKeysendInfo(foundLightningAddress);
          let lnurlData = await getLnurlInfo(foundLightningAddress);
          if (lnurlData || keysendData) {
            let walletData = {};
            walletData.address = foundLightningAddress;
            if (keysendData) {
              walletData.keysend = keysendData;
              console.log("successfully retrieved keysend data for wallet in channel", channelData.data.name, keysendData);
              //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);
            }
            if (lnurlData) {
              walletData.lnurl = lnurlData;
              console.log("successfully retrieved lnurl data for wallet in channel", channelData.data.name, lnurlData);
              //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);

            }
            if (walletData.keysend) {
              if (walletData.address.indexOf("fountain.fm") > 0) {
                walletData.keysend = null;
              }
            }
            var splitData = new Array;

            walletData.split = 100;
            splitData.push(walletData);
            if (hostWalletData) {
              splitData[0].split = 100 - hostWalletData.split;
            }
            splitData.push(hostWalletData);
            await storageManager.storeData("lightningsplit" + "-" + req.query.video, splitData);
            return res.status(200).send(splitData);
          } else {
            console.log("lightning address in channel description does not resolve", foundLightningAddress);
          }
        } else {
          console.log("no lightning address found in channel description");
        }
        return res.status(400).send();
      }
    }
    console.log("unable to lookup split info for", req.query);
    return res.status(400).send();
  })
  router.use('/addsplit', async (req, res) => {
    console.log("█add split called\n", req.query)
    var storedSplitData;
    var split = new Array();
    var newAddress = req.query.splitaddress;
    var newSplit = req.query.split;
    var channel = req.query.channel
    var name = req.query.name;
    var customKey = req.query.customkey;
    var customValue = req.query.customvalue;
    var node = req.query.node;
    var customKeysend = req.query.customkeysend;
    if (req.query.video) {
      storedSplitData = await storageManager.getData("lightningsplit" + "-" + req.query.video);
      console.log("█retrieved split info", req.query.key, "\n", storedSplitData);
      if (!storedSplitData) {
        console.log("stored split data not found");
        if (req.query.video) {
          console.log("base", base);
          var apiCall = base + "/api/v1/videos/" + req.query.video;
          console.log("█ getting video data", apiCall);
          let videoData;
          try {
            videoData = await axios.get(apiCall);
          } catch {
            console.log("failed to pull information for provided video id", apiCall);
          }
          if (videoData) {
            console.log(videoData.data.channel);
            let foundLightningAddress = await findLightningAddress(videoData.data.description + " " + videoData.data.support + " " + videoData.data.channel.description + " " + videoData.data.channel.support + " " + videoData.data.account.description);
            if (foundLightningAddress) {
              console.log("lightning address found in video description [" + foundLightningAddress + ']');
              let keysendData = await getKeysendInfo(foundLightningAddress);
              let lnurlData = await getLnurlInfo(foundLightningAddress);
              if (lnurlData || keysendData) {
                let walletData = {};
                walletData.address = foundLightningAddress;
                if (keysendData) {
                  walletData.keysend = keysendData;
                  console.log("successfully retrieved keysend data for wallet in video", videoData.data.channel.name, keysendData);
                  //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);
                }
                if (lnurlData) {
                  walletData.lnurl = lnurlData;
                  console.log("successfully retrieved lnurl data for wallet in video", videoData.data.channel.name, lnurlData);
                  //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);

                }
                if (walletData.keysend) {
                  if (walletData.address.indexOf("fountain.fm") > 0) {
                    walletData.keysend = null;
                  }
                }
                var splitData = new Array();
                walletData.split = 100;
                splitData.push(walletData);
                if (hostWalletData) {
                  splitData[0].split = 100 - hostWalletData.split;
                }
                splitData.push(hostWalletData);
                //await storageManager.storeData("lightningsplit" + "-" + req.query.video, splitData);
                return res.status(200).send(splitData);
              } else {
                console.log("lightning address in video description does not resolve", foundLightningAddress);
              }
            } else {
              console.log("no lightning address found in video description");
            }
          }
        }
        console.log("Unable to add split", req.query);
        return res.status(400).send();

      } else {
        split = storedSplitData;
      }
    } else if (req.query.channel) {
      storedSplitData = await storageManager.getData("lightningsplit" + "-" + req.query.channel);
      if (storedSplitData) {
        console.log("█add split retrieved chaNNEL split info", req.query.channel, "\n", storedSplitData.length);
        split = storedSplitData;
        /* } /*else {
          console.log("████stored split data not found, generating channel split data", req.query.channel);
          if (req.query.channel) {
            var apiCall = base + "/api/v1/video-channels/" + req.query.channel;
            console.log("█ add split getting channel data", apiCall);
            let channelData;
            try {
              channelData = await axios.get(apiCall);
            } catch {
              console.log("failed to pull information for provided channel id", apiCall);
            }
            if (channelData) {
              //console.log("channeldata",channelData);
              let foundLightningAddress = await findLightningAddress(channelData.data.description + " " + channelData.data.support);
              if (foundLightningAddress) {
                console.log("lightning address found in channel description [" + foundLightningAddress + ']');
                let keysendData = await getKeysendInfo(foundLightningAddress);
                let lnurlData = await getLnurlInfo(foundLightningAddress);
                if (lnurlData || keysendData) {
                  let walletData = {};
                  walletData.address = foundLightningAddress;
                  if (keysendData) {
                    walletData.keysend = keysendData;
                    console.log("successfully retrieved keysend data for wallet in channel", channelData.data.name, keysendData);
                  }
                  if (lnurlData) {
                    walletData.lnurl = lnurlData;
                    console.log("successfully retrieved lnurl data for wallet in channel", channelData.data.name, lnurlData);
  
                  }
                  var splitData = new Array;
                  walletData.split = 100;
                  splitData.push(walletData);
                  if (hostWalletData) {
                    splitData[0].split = 100 - hostWalletData.split;
                  }
                  splitData.push(hostWalletData);
                  split = splitData;
                } else {
                  console.log("lightning address in channel description does not resolve", foundLightningAddress);
                }
              } else {
                console.log("no lightning address found in channel description");
              }
            }
          }
          */
      } else {
        console.log("no stored split, unable to add", req.query);
        return res.status(400).send();
      }
    }
    console.log("split", split);
    console.log("Attempt to add new address [" + newAddress + ']');
    let walletData = { "keysend": { "tag": "keysend", "customData": [{}] } };
    if (newAddress) {
      walletData.address = newAddress;
    } else {
      walletData.address = "custom"
    }
    if (name) {
      walletData.name = name;
    } else {
      walletData.name = "anon";
    }
    if (newSplit) {
      walletData.split = parseInt(newSplit);
    }
    if (customKeysend) {
      walletData.customKeysend = true;
      if (node) {
        walletData.keysend.pubkey = node;
      }

      if (customKey) {
        walletData.keysend.customData[0].customKey = customKey;
        //  split[slot].customKeysend = true;
      }
      if (customValue) {
        walletData.keysend.customData[0].customValue = customValue;
        //   split[slot].customKeysend = true;
      }
    } else {
      let keysendData = await getKeysendInfo(newAddress);
      let lnurlData = await getLnurlInfo(newAddress);
      if (lnurlData || keysendData) {
        if (keysendData) {
          walletData.keysend = keysendData;
          console.log("successfully retrieved keysend data for wallet in channel", channel, keysendData);
          //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);
        }
        if (lnurlData) {
          walletData.lnurl = lnurlData;
          console.log("successfully retrieved lnurl data for wallet in channel", channel, lnurlData);
          //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);

        }
      }
    }
    //var splitData = new Array;
    split.push(walletData);
    let otherSplit = 0
    for (i = 1; i < split.length; i++) {
      console.log("split", i, split[i]);
      otherSplit = otherSplit + split[i].split;
    }
    console.log("othersplit", otherSplit);

    let creatorSplit = split[0].split - newSplit
    split[0].split = parseInt(creatorSplit);
    console.log("split about to be written to storage manager", split);
    storageManager.storeData("lightningsplit" + "-" + channel, split);
    return res.status(200).send(split);
  })
  router.use('/updatesplit', async (req, res) => {
    console.log("█updating split info\n", req.query)
    var storedSplitData;
    var split;
    var newAddress = req.query.splitaddress
    var video = req.query.video;
    var newSplit = req.query.split;
    var channel = req.query.channel;
    var slot = req.query.slot;
    var name = req.query.name;
    var customKey = req.query.customkey;
    var customValue = req.query.customvalue;
    var node = req.query.node;
    var customKeysend = req.query.customkeysend;
    if (!slot) {
      return res.status(400).send();
    }
    if (video && !channel) {
      storedSplitData = await storageManager.getData("lightningsplit" + "-" + video);
      console.log("█retrieved split info for video ", video, "\n", storedSplitData.length);
      if (!storedSplitData) {
        console.log("stored split data not found");
        console.log("base", base);
        var apiCall = base + "/api/v1/videos/" + req.query.video;
        console.log("█ getting video data", apiCall);
        let videoData;
        try {
          videoData = await axios.get(apiCall);
        } catch {
          console.log("failed to pull information for provided video id", apiCall);
          return res.status(400).send();
        }
        if (videoData && !channel) {
          console.log("getting channel split instead", videoData.data.channel.name);
          channel = videoData.data.channel.name;
        } else {
          console.log("failed to find video data", apiCall);
          return res.status(400).send();
        }
      } else {
        split = storedSplitData;
      }
    }
    if (channel) {
      if (!storedSplitData) {
        storedSplitData = await storageManager.getData("lightningsplit" + "-" + channel);
        console.log("█retrieved chaNNEL split info", channel, "\n", storedSplitData.length);
      }
      if (storedSplitData) {
        //TODO may need to relook at this
        //if (!storedSplitData[slot].customKeysend) {
        keysendData = await getKeysendInfo(newAddress);
        //}
        //let lnurlData = await getLnurlInfo(newAddress);
        split = storedSplitData;
        console.log(`updating from`, split[slot]);
        if (newAddress) {
          split[slot].address = newAddress;
        }
        if (newSplit) {
          split[slot].split = parseInt(newSplit);
        }
        if (customKeysend) {
          console.log("custom keysend enabled")
          split[slot].customKeysend = true;
          if (node) {
            split[slot].keysend.pubkey = node;
            //split[slot].customKeysend = true;
          }
          if (customKey != split[slot].keysend.customData[0].customKey) {
            split[slot].keysend.customData[0].customKey = customKey;
            //  split[slot].customKeysend = true;
          }
          if (customValue != split[slot].keysend.customData[0].customValue) {
            split[slot].keysend.customData[0].customValue = customValue;
            //   split[slot].customKeysend = true;
          }
        } else {
          console.log("regular lightning address keysend");
          keysendData = await getKeysendInfo(newAddress);
          split[slot].keysend = keysendData;
          split[slot].customKeysend = false;
        }
        if (name) {
          split[slot].name = name;
        }

        //split[slot].keysend = keysendData;
        //split[slot].lnurl = lnurlData;
        let otherSplit = 0;
        for (i = 1; i < split.length; i++) {
          console.log("split", i, split[i].split, split[i].address);
          otherSplit = otherSplit + parseInt(split[i].split);
        }
        console.log("othersplit", otherSplit);
        let creatorSplit = 100 - otherSplit
        split[0].split = parseInt(creatorSplit);
        console.log(split);
        if (req.query.channel) {
          await storageManager.storeData("lightningsplit" + "-" + channel, split);
        }
        if (req.query.video) {
          await storageManager.storeData("lightningsplit" + "-" + req.query.video, split);

        }
        console.log("updated slot", slot, "with", split[slot]);
        return res.status(200).send(split);
      } else {
        console.log("█████stored split data not found, nothing to update, should maybe create?");
        //TODO check channel owner account for wallet info
        return res.status(400).send();
      }
    } else {
      console.log("no channel or video to update", newAddress);
    }
    return res.status(400).send();
  })
  router.use('/removesplit', async (req, res) => {
    console.log("█updating split info\n", req.query)
    var storedSplitData;
    var split;
    var slot = req.query.slot;
    var channel = req.query.channel;
    if (!slot) {
      return res.status(400).send();
    }
    if (req.query.video) {
      var storedSplitData = await storageManager.getData("lightningsplit" + "-" + req.query.video);
      console.log("█retrieved split info", req.query.key, "\n", storedSplitData);
      if (!storedSplitData) {
        console.log("stored split data not found");
        if (req.query.video) {
          console.log("base", base);
          var apiCall = base + "/api/v1/videos/" + req.query.video;
          console.log("█ getting video data", apiCall);
          let videoData;
          try {
            videoData = await axios.get(apiCall);
          } catch {
            console.log("failed to pull information for provided video id", apiCall);
          }
          if (videoData) {
            console.log(videoData.data.channel);
            let foundLightningAddress = await findLightningAddress(videoData.data.description + " " + videoData.data.support + " " + videoData.data.channel.description + " " + videoData.data.channel.support + " " + videoData.data.account.description);
            if (foundLightningAddress) {
              console.log("lightning address found in video description [" + foundLightningAddress + ']');
              let keysendData = await getKeysendInfo(foundLightningAddress);
              let lnurlData = await getLnurlInfo(foundLightningAddress);
              if (lnurlData || keysendData) {
                let walletData = {};
                walletData.address = foundLightningAddress;
                if (keysendData) {
                  walletData.keysend = keysendData;
                  console.log("successfully retrieved keysend data for wallet in video", videoData.data.channel.name, keysendData);
                  //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);
                }
                if (lnurlData) {
                  walletData.lnurl = lnurlData;
                  console.log("successfully retrieved lnurl data for wallet in video", videoData.data.channel.name, lnurlData);
                  //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);

                }
                if (walletData.keysend) {
                  if (walletData.address.indexOf("fountain.fm") > 0) {
                    walletData.keysend = null;
                  }
                }
                var splitData = new Array();
                walletData.split = 100;
                splitData.push(walletData);
                if (hostWalletData) {
                  splitData[0].split = 100 - hostWalletData.split;
                }
                splitData.push(hostWalletData);
                //await storageManager.storeData("lightningsplit" + "-" + req.query.video, splitData);
                return res.status(200).send(splitData);
              } else {
                console.log("lightning address in video description does not resolve", foundLightningAddress);
              }
            } else {
              console.log("no lightning address found in video description");
            }
          }
        }
        return res.status(400).send();
      } else {
        split = storedSplitData;
      }
    } else if (channel) {
      storedSplitData = await storageManager.getData("lightningsplit" + "-" + channel);
      console.log("█retrieved chaNNEL split info", channel, "\n", storedSplitData);

      if (storedSplitData) {
        split = storedSplitData;
        console.log(`removing`, split[slot].address, " of ", split.length, " from ", channel);
        let otherSplit = 0
        let newSplit = new Array();
        for (i = 0; i < split.length; i++) {
          console.log("split", i, "of ", split.length, split[i].address);
          if (i == slot) {
            console.log("skipping", i)
          } else {
            newSplit.push(split[i]);
            if (i > 0) {
              otherSplit = otherSplit + split[i].split;
            }
          }
        }
        console.log("othersplit", otherSplit);
        let creatorSplit = 100 - otherSplit
        newSplit[0].split = parseInt(creatorSplit);
        console.log("split about to be writ", newSplit);
        await storageManager.storeData("lightningsplit" + "-" + channel, newSplit);
        console.log("█████ slot removed", slot, ".", newSplit.length, "splits remaining");
        return res.status(200).send(newSplit);
      } else {
        console.log("stored split data not found");
        //TODO check channel owner account for wallet info
        return res.status(400).send();
      }
    }
  })
  router.use('/getversion', async (req, res) => {
    return res.status(200).send(version);
  })
  router.use('/createsplit', async (req, res) => {
    console.log("█add split called\n", req.query)
    var storedSplitData;
    var split = new Array();
    var newAddress = req.query.splitaddress;
    var newSplit = req.query.split;
    var channel = req.query.channel
    if (req.query.video) {
      storedSplitData = await storageManager.getData("lightningsplit" + "-" + req.query.video);
      console.log("█retrieved split info", req.query.key, "\n", storedSplitData);
      if (!storedSplitData) {
        console.log("stored split data not found");
        if (req.query.video) {
          console.log("base", base);
          var apiCall = base + "/api/v1/videos/" + req.query.video;
          console.log("█ getting video data", apiCall);
          let videoData;
          try {
            videoData = await axios.get(apiCall);
          } catch {
            console.log("failed to pull information for provided video id", apiCall);
          }
          if (videoData) {
            console.log(videoData.data.channel);
            let foundLightningAddress = await findLightningAddress(videoData.data.description + " " + videoData.data.support + " " + videoData.data.channel.description + " " + videoData.data.channel.support + " " + videoData.data.account.description);
            if (foundLightningAddress) {
              console.log("lightning address found in video description [" + foundLightningAddress + ']');
              let keysendData = await getKeysendInfo(foundLightningAddress);
              let lnurlData = await getLnurlInfo(foundLightningAddress);
              if (lnurlData || keysendData) {
                let walletData = {};
                walletData.address = foundLightningAddress;
                if (keysendData) {
                  walletData.keysend = keysendData;
                  console.log("successfully retrieved keysend data for wallet in video", videoData.data.channel.name, keysendData);
                  //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);
                }
                if (lnurlData) {
                  walletData.lnurl = lnurlData;
                  console.log("successfully retrieved lnurl data for wallet in video", videoData.data.channel.name, lnurlData);
                  //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);

                }
                if (walletData.keysend) {
                  if (walletData.address.indexOf("fountain.fm") > 0) {
                    walletData.keysend = null;
                  }
                }
                var splitData = new Array();
                walletData.split = 100;
                splitData.push(walletData);
                if (hostWalletData) {
                  splitData[0].split = 100 - hostWalletData.split;
                }
                splitData.push(hostWalletData);
                //await storageManager.storeData("lightningsplit" + "-" + req.query.video, splitData);
                return res.status(200).send(splitData);
              } else {
                console.log("lightning address in video description does not resolve", foundLightningAddress);
              }
            } else {
              console.log("no lightning address found in video description");
            }
          }
        }
        console.log("Unable to add split", req.query);
        return res.status(400).send();

      } else {
        split = storedSplitData;
      }
    } else if (req.query.channel) {
      storedSplitData = await storageManager.getData("lightningsplit" + "-" + req.query.channel);
      if (storedSplitData) {
        console.log("█add split retrieved chaNNEL split info", req.query.channel, "\n", storedSplitData.length);
        console.log('already existing splitData for', req.query.channel, storedSplitData);
        return res.status(400).send();
      } else {
        console.log("████stored split data not found, generating channel split data", req.query.channel);
        //return res.status(400).send();
      }
    }
    console.log("split", split);
    console.log("Attempt to add new address [" + newAddress + ']');
    let keysendData = await getKeysendInfo(newAddress);
    let lnurlData = await getLnurlInfo(newAddress);
    let walletData = {};
    if (lnurlData || keysendData) {

      walletData.address = newAddress;
      walletData.split = parseInt(newSplit);
      if (keysendData) {
        walletData.keysend = keysendData;
        console.log("successfully retrieved keysend data for wallet in channel", channel, keysendData);
        //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);
      }
      if (lnurlData) {
        walletData.lnurl = lnurlData;
        console.log("successfully retrieved lnurl data for wallet in channel", channel, lnurlData);
        //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);

      }
      //var splitData = new Array;
      walletData.name = newAddress;
      split.push(walletData);
      if (hostWalletData) {
        split[0].split = 100 - hostWalletData.split;
        split.push(hostWalletData);
      }
      storageManager.storeData("lightningsplit" + "-" + channel, split);
      return res.status(200).send(split);
    } else {
      console.log("lightning address in channel description does not resolve", newAddress);
      return res.status(400).send("Lightning address failed to resolve");
    }
    return res.status(400).send("failed to update");
  })

  async function getKeysendInfo(address) {
    if (!address) { return };

    //var storageIndex = "lightning" + "-" + address
    //periods are apparently not legal characters for an index value.
    var storageIndex = "lightning-" + address.replace(/\./g, "-");
    console.log("█Getting Address", address, storageIndex);
    //console.log(await storageManager.getData(storageIndex));
    var storedLightning;
    //TODO fix local caching to remove circular loop errors
    storedLightning = await storageManager.getData(storageIndex);
    if (storedLightning) {
      console.log("███returning stored lightning address", storageIndex);
      return storedLightning;
    } else {
      console.log("███no stored data", storageIndex, storedLightning)
    }
    console.log("█ getting wallet data", address);
    address = address.toString();
    let walletParts = address.split("@");
    let walletHost = walletParts[1];
    let walletUser = walletParts[0];
    let apiRequest = "https://" + walletHost + "/.well-known/keysend/" + walletUser
    console.log("requesting wallet data from provider", apiRequest);
    let walletData;
    try {
      walletData = await axios.get(apiRequest);
    } catch (err) {
      console.log("error attempting to get wallet info", apiRequest, err.message)
      return;
    }
    if (walletData.data.status != "OK") {
      console.log("------------------ \n Error in lightning address data", walletData.data);
      return;
    }
    console.log(walletData.data)
    let whatHappened = await storageManager.storeData(storageIndex, walletData.data);
    console.log("stored keysend data", whatHappened, storageIndex, walletData.data);

    return walletData.data;
  }
  /*
  router.use('/getsplit', async (req, res) => {
    console.log("█Request for split info\n", req.query)
    if (req.query.key) {
      var splitData =new Array;
      splitData  = await storageManager.getData("lightningsplit" + "-" + req.query.key);
      console.log("█retrieved split info", req.query.key,"\n",splitData);
      if (splitData) {
        console.log("returning stored data", splitData);
        return res.status(200).send(splitData);
      } else {
        console.log("stored split data not found");
         
   
        return res.status(400).send();
      }
    }
    console.log("no key to lookup split info for");
    return res.status(400).send();
  })
  router.use('/setWallet', async (req, res) => {
    if (!req.query.key) {
      return res.status(400).send("missing key");
    }
    if (req.query.address) {
      let walletInfo = getWalletInfo(req.query.address);
      if (walletInfo) {
        let lightning = {};
        lightning.address = req.query.address;
        lightning.data = newData
        console.log("███saving wallet data", req.query.key, lightning);
        storageManager.storeData("lightning" + "-" + req.query.key, lightning);
        return res.status(200).send(lightning);
      } else {
        console.log("failed to get wallet info for provided address", req.query.address);
        return res.status(400).send();
      }
    }
  })
   
  */
  async function getLnurlInfo(address) {
    if (!address) { return };
    console.log("█ getting ln url data", address);
    address = address.toString();
    let walletParts = address.split("@");
    let walletHost = walletParts[1];
    let walletUser = walletParts[0];
    let apiRequest = "https://" + walletHost + "/.well-known/lnurlp/" + walletUser
    console.log("requesting lnurlp data from provider", apiRequest);
    let walletData;
    try {
      walletData = await axios.get(apiRequest);
    } catch {
      console.log("error attempting to get lnurlp info", apiRequest)
      return;
    }
    if (!walletData.data.callback) {
      console.log("------------------ \n Error in lightning address data", walletData.data);
      return;
    }
    return walletData.data;
  }
  async function findLightningAddress(textblock) {
    if (!textblock) {
      return;
    }
    text = textblock.toString();
    const match = text.match(
      /((⚡|⚡️):?|lightning:|lnurl:)\s?([\w-.]+@[\w-.]+[.][\w-.]+)/i
    );
    if (match) return match[3];
    const matchAlbyLink = text.match(
      /http(s)?:\/\/(www[.])?getalby\.com\/p\/(\w+)/
    );
    if (matchAlbyLink) {

      return matchAlbyLink[3] + "@getalby.com";
    }
  }
  async function findLinks(textblock) {
    if (!textblock) {
      return;
    }
    text = textblock.toString();

    var regex = /(https:[/][/]|http:[/][/]|www.)[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(:[a-zA-Z0-9]*)?\/?([a-zA-Z0-9\-\._\?\,\'/\\\+&amp;%\$#\=~])/g;
    if (regex.test(text)) {
      let result = text.match(regex);
      console.log("urls found", result);
      return result;
    }
    return;
  }
}
async function unregister() {
  return
}

module.exports = {
  register,
  unregister
}

