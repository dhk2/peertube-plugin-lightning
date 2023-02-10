const axios = require('axios');
const crypto = require('crypto');
const { channel } = require('diagnostics_channel');
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
  const router = getRouter();
  router.use('/walletinfo', async (req, res) => {
    console.log("█Request for wallet info\n", req.query)
    /*  seems a little suss for the instance to take the tip money this way
    if (Object.keys(req.query).length === 0) {
      console.log("returning instance wallet for donation");
      return res.status(200).send(hostWalletData);
    }
    */
    if (req.query.address) {
      console.log("updating wallet info");
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
    }
    console.log("channel", channel, "instance", instance, instanceUrl);
    if (!instance) {
      instanceUrl = base;
    }
    let apiUrl = instanceUrl + "/api/v1/video-channels/" + channel;
    let channelData;
    try {
      channelData = await axios.get(apiUrl);
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
    apiUrl = base + "/plugins/lightning/router/walletinfo?channel=" + req.query.channel;
    let lightningData
    try {
      lightningData = await axios.get(apiUrl);
    } catch {
      console.log("unable to load lightning wallet info for channel", apiUrl);
      lightningData = { data: {} };
    }
    console.log("loaded wallet information for channel", apiUrl, lightningData.data);
    let pubKey, tag, customKey, customValue;
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
    for (line of lines) {
      counter++;
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
        fixed = fixed + spacer + '\t<itunes:email>' + 'errhead@gmail.com' + '</itunes:email>\n'
        fixed = fixed + spacer + '\t<itunes:name>' + channel + '</itunes:name>\n'
        fixed = fixed + spacer + '</itunes:owner>\n';
        fixed = fixed + spacer + '<itunes:author>' + displayName + '</itunes:author>\n'
        if (pubKey) {
          fixed = fixed + spacer + '<podcast:value type="lightning" method="' + tag + '" suggested="0.00000000069">\n';
          fixed = fixed + spacer + '\t<podcast:valueRecipient name="' + displayName + '" type="node" address="' + pubKey + '"';
          if (customKey) {
            fixed = fixed + ' customKey="' + customKey + '" customValue="' + customValue + '"'
          }
          fixed = fixed + ' split="100" />\n';
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
      console.log("█retrieved split info", req.query.key, "\n", storedSplitData);
      if (storedSplitData) {
        console.log("returning stored data", storedSplitData);
        return res.status(200).send(storedSplitData);
      } else {
        
        console.log("stored split data not found");
        if (req.query.video) {
          console.log("base",base);
          var apiCall = base + "/api/v1/videos/" + req.query.video;
          console.log("█ getting video data", apiCall);
          let videoData;
          try {
            videoData = await axios.get(apiCall);
          } catch {
            console.log("failed to pull information for provided video id", apiCall);
          }
          if (videoData) {
            let videoHost = "https://"+videoData.data.channel.host;
            if (videoHost != base){
              remoteWalletApi=videoHost+"/plugins/lightning/router/getspit?channel="+channel.name;
              let remoteSplitData;
              try {
                remoteSplitData = await axios.get(remoteWalletApi);
              } catch {
                console.log("failed to pull remote split info", apiCall);
              }
              if (remoteSplitData){
                return res.status(200).send(remoteSplitData);
              }
            }
            let split
            console.log(videoData.data.channel);
            let foundLightningAddress = await findLightningAddress(videoData.data.description + " " + videoData.data.support+" "+videoData.data.channel.description+" "+videoData.data.channel.support+" "+videoData.data.account.description);
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
                if (walletData.keysend){
                  if (walletData.address.indexOf("fountain.fm")>0){
                    walletData.keysend = null;
                  }
                }
                var splitData=new Array();
                walletData.split =100;
                splitData.push(walletData);
                if (hostWalletData) {
                  splitData[0].split=100 - hostWalletData.split;
                } 
                splitData.push(hostWalletData);
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
        return res.status(400).send();
      }
    } else if (req.query.channel) {
      var storedSplitData;
      //var storedSplitData = await storageManager.getData("lightningsplit" + "-" + req.query.channel);
      console.log("█retrieved chaNNEL split info", req.query.channel, "\n", storedSplitData);
      if (storedSplitData) {
        console.log("returning stored data", storedSplitData);
        return res.status(200).send(stored.storedSplitData);
      } else {
        console.log("stored split data not found");
        if (req.query.channel) {


          var apiCall = base + "/api/v1/video-channels/" + req.query.channel;
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
                if (walletData.keysend){
                  if (walletData.address.indexOf("fountain.fm")>0){
                    walletData.keysend = null;
                  }
                }
                var splitData = new Array;
                
                walletData.split =100;
                splitData.push(walletData);
                if (hostWalletData) {
                  splitData[0].split=100 - hostWalletData.split;
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
          }
        }
        return res.status(400).send();
      }
    }
    console.log("no key to lookup split info for");
    return res.status(400).send();
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

async function unregister() {
  return
}
module.exports = {
  register,
  unregister
}
