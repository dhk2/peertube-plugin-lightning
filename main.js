const axios = require('axios');

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
    private: true
  })
  var base = peertubeHelpers.config.getWebserverUrl();
  let lightningAddress = await settingsManager.getSetting("lightning-address");
  if (!lightningAddress) {
    console.log("No wallet configured for system");
    return;
  }
  if (lightningAddress.indexOf("@") < 1) {
    console.log("malformed wallet address for system", lightningAddress);
    return;
  }
  let hostWalletData = await getWalletInfo(lightningAddress);
  if (!hostWalletData) {
    console.log("failed to get system wallet data from provider");
    return;
  }
  /*
  let pubKey = walletData.pubkey;
  let tag = walletData.tag;
  let customKey = walletData.customData[0].customKey;
  let customValue = walletData.customData[0].customValue;
  */
  const router = getRouter();
  router.use('/walletinfo', async (req, res) => {
    console.log("█Request for wallet info\n", req.query)
    if (Object.keys(req.query).length === 0) {
      console.log("returning instance wallet for donation");
      return res.status(200).send(hostWalletData);
    }
    //console.log("███wrecked", req);
    if (req.query.account && !req.query.update) {
      var accountLightning = await storageManager.getData("lightning" + "-" + req.query.account);
      console.log("█retrieved stored account lighting info", accountLightning);
      if (accountLightning) {
        if (accountLightning.data) {
          console.log("returning stored data", accountLightning.data);
          return res.status(200).send(accountLightning.data);
        } else {
          if (accountLightning.address) {
            let walletData = await getWalletInfo(accountLightning.address);
            if (!walletData) {
              console.log("stored address configured for account, but failed to get data from provider", accountLightning.address);
            } else {
              if (walletData.status == "OK") {
                accountLightning.data = walletData;
                console.log("storing account lighting info", accountLightning);
                storageManager.storeData("lightning" + "-" + req.query.account, accountLightning);
                return res.status(200).send(walletData);
              } else {
                console.log("error returned from provider for stored account address", accountLightning);
              }
            }
          }
        }
      }
    }
    if (req.query.channel && !req.query.update) {
      var channelLightning = await storageManager.getData("lightning" + "-" + req.query.channel);
      console.log("█retrieved stored channel lightning info", channelLightning);
      if (channelLightning) {
        if (channelLightning.data) {
          return res.status(200).send(channelLightning.data);
        } else {
          if (channelLightning.address) {
            let walletData = await getWalletInfo(channelLightning.address);
            if (!walletData) {
              console.log("stored address configured for channel, but failed to get data from provider", accountLightning.address);
            } else {
              if (walletData.status == "OK") {
                channelLightning.data = walletData;
                storageManager.storeData("lightning" + "-" + req.query.account, channelLightning);
                return res.status(200).send(walletData);
              } else {
                console.log("error returned from provider for stored channel address", channelLightning);
              }
            }
          }
        }
      }
    }
    // no stored info, check description and support for info
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
        let bolt = await findLightningAddress(videoData.data.description + videoData.data.support);
        if (bolt) {
          console.log("lightning address found in video description [" + bolt + ']');
          let walletData = await getWalletInfo(bolt);
          if (walletData) {
            let videoLightning = {};
            videoLightning.address = bolt;
            videoLightning.data = walletData;
            console.log("successfully retrieved data for wallet in video", videoData.data.channel.name, videoLightning);
            storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);
            return res.status(200).send(walletData);
          } else {
            console.log("failed to get wallet info from address in video", bolt);
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
        let bolt = await findLightningAddress(channelData.data.description + channelData.data.support);
        if (bolt) {
          console.log("lightning address found in channel description [" + bolt + ']');
          let walletData = await getWalletInfo(bolt);
          if (walletData) {
            let channelLightning = {};
            channelLightning.address = bolt;
            channelLightning.data = walletData;
            console.log("successfully retrieved data for wallet in channel", channelLightning);
            storageManager.storeData("lightning" + "-" + channelData.data.name, channelLightning);
            return res.status(200).send(walletData);
          } else {
            console.log("failed to get wallet info from address in channel", bolt);
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
        let bolt = await findLightningAddress(accountData.data.description);
        if (bolt) {
          console.log("lightning address found in account description [" + bolt + ']');
          let walletData = await getWalletInfo(bolt);
          if (walletData) {
            let accountLightning = {};
            accountLightning.address = bolt;
            accountLightning.data = walletData;
            storageManager.storeData("lightning" + "-" + req.query.account, accountLightning);
            console.log("successfully retrieved data for wallet in account", accountLightning);
            return res.status(200).send(walletData);
          } else {
            console.log("failed to get wallet info from address in account", bolt);
          }
        } else {
          console.log("no lightning address found in account description");
        }
      }
    }
    console.log("no address found at all, sucka");
    return res.status(400).send();
  })
  router.use('/podcast2', async (req, res) => {
    console.log("█████████████████ Testes ██████████████");
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
    let rssUrl = instanceUrl + "/feeds/videos.xml?videoChannelId=" + channelData.data.id;
    let rssData;
    try {
      rssData = await axios.get(rssUrl)
    } catch {
      console.log("unable to load rss feed for channel", rssUrl);
      return res.status(400).send();
    }
    apiUrl = base + "/plugins/lightning/router/walletinfo?channel=" + req.query.channel;
    let lightningData
    try {
      lightningData = await axios.get(apiUrl);
    } catch {
      console.log("unable to load lightning wallet info for channel", apiUrl);
    }
    console.log(lightningData);
    let pubKey, tag, customKey, customValue;
    if (lightningData) {
      pubKey = lightningData.data.pubkey;
      tag = lightningData.data.tag;
      customKey = lightningData.data.customData[0].customKey;
      customValue = lightningData.data.customData[0].customValue;
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
        fixed = fixed + spacer + '\t<itunes:email>' + req.query.channel + '</itunes:email>\n'
        fixed = fixed + spacer + '\t<itunes:name>' + channel + '</itunes:name>\n'
        fixed = fixed + spacer + '</itunes:owner>\n';
        fixed = fixed + spacer + '<itunes:author>' + displayName + '</itunes:author>\n'
        if (lightningData) {
          fixed = fixed + spacer + '<podcast:value type="lightning" method="' + tag + '" suggested="0.00000000069">\n';
          fixed = fixed + spacer + '\t<podcast:valueRecipient name="' + displayName + '" type="node" address="' + pubKey + '" customKey="' + customKey + '" customValue="' + customValue + '" split="100" />\n';
          fixed = fixed + spacer + '</podcast:value>';
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
    storageManager.storeData("lightning" + "-" + req.query.key, lightning);
    return res.status(200).send(lightning);
  })
  /*
  router.use('/splitinfo', async (req, res) => {
    console.log("█Request for split info\n", req.query)
    if (req.query.key) {
      var splitData[] = await storageManager.getData("lightningsplit" + "-" + req.query.key);
      console.log("█retrieved split info", key);
      if (splitData) {
        console.log("returning stored data", splitData);
        return res.status(200).send(splitData);
      } else {
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


  async function getWalletInfo(address) {
    if (!address) { return };
    console.log("█ getting wallet data", address);
    address = address.toString();
    let walletParts = address.split("@");
    let walletHost = walletParts[1];
    let walletUser = walletParts[0];
    let apiRequest = "https://" + walletHost + "/.well-known/keysend/" + walletUser
    //console.log("requesting wallet data from provider",apiRequest);
    let walletData;
    try {
      walletData = await axios.get(apiRequest);
    } catch {
      console.log("error attempting to get wallet info", apiRequest)
      return;
    }
    if (walletData.data.status != "OK") {
      console.log("------------------ \n Error in lightning address data", walletData.data);
      return;
    }
    return walletData.data;
  }
  async function findLightningAddress(textBlock) {
    if (!textBlock) { return };
    bolt = textBlock.indexOf('⚡️');
    console.log(bolt);
    let hack = textBlock.substring(bolt + 2);
    console.log('[' + hack + ']');
    // regex found on stack overflow, it's all black magic to me, but works better than my attempt
    let hack2 = await hack.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);
    console.log('[' + hack2 + ']');
    return hack2;
    /*
    let space = hack.indexOf(' ');
    if (space > 0) {
      hack = hack.substring(0, space);
    }
    let eol = hack.indexOf('\n');
    if (eol > 0) {
      hack = hack.substring(0, eol);
    }
    console.log('[' + hack + '}');
    return hack;
  */

  }
}

async function unregister() {
  return
}

module.exports = {
  register,
  unregister
}
