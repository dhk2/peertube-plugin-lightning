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
    private: false
  })
  registerSetting({
    name: 'lightning-node-split',
    label: 'Requires split for host',
    type: 'input',
    private: false
  })
  registerSetting({
    name: 'lightning-node-tipVerb',
    label: 'Verb to use for tipping',
    type: 'input',
    private: false
  })
  var base = peertubeHelpers.config.getWebserverUrl();
  let lightningAddress = await settingsManager.getSetting("lightning-address");
  if (!lightningAddress) {
    console.log("No wallet configured for system");
  }
  if (lightningAddress.indexOf("@") < 1) {
    console.log("malformed wallet address for system", lightningAddress);
  }
  let hostWalletData = await getKeysendInfo(lightningAddress);
  if (!hostWalletData) {
    console.log("failed to get system wallet data from provider");
  }
  const router = getRouter();
  router.use('/walletinfo', async (req, res) => {
    console.log("█Request for wallet info\n", req.query)
    if (Object.keys(req.query).length === 0) {
      console.log("returning instance wallet for donation");
      return res.status(200).send(hostWalletData);
    }
    if (req.query.address) {
      console.log("updating wallet info");
      let address=req.query.address;
      let keysendData = await getKeysendInfo(address);
      let lnurlData = await getLnurlInfo(address);
      if (lnurlData || keysendData) {
        let walletData = {};
        walletData.address = address;
        if (keysendData) {
          walletData.keysend = keysendData;
          console.log("successfully retrieved keysend data for ", address,keysendData);
        } 
        if (lnurlData) {
            walletData.lnurl = lnurlData;
            console.log("successfully retrieved lnurl data for ", address, lnurlData);
          }
        return res.status(200).send(walletData);
      } else {
        console.log("lightning address in channel description does not resolve",address);
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
        let foundLightningAddress = await findLightningAddress(videoData.data.description +" "+ videoData.data.support);
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
            console.log("lightning address in video description does not resolve",foundLightningAddress);
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
        let foundLightningAddress = await findLightningAddress(channelData.data.description +" "+ channelData.data.support);
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
            console.log("lightning address in channel description does not resolve",foundLightningAddress);
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
            console.log("lightning address in account description does not resolve",foundLightningAddress);
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
    if (lightningData.data.keysend) {
      pubKey = lightningData.data.keysend.pubkey;
      tag = lightningData.data.keysend.tag;
      customKey = lightningData.data.keysend.customData[0].customKey;
      customValue = lightningData.data.keysend.customData[0].customValue;
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
      let walletInfo = getKeysendInfo(req.query.address);
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
  router.use('/getinvoice', async (req, res) => {
  //  console.log(req);
  console.log("███ getting lnurl invoice",req.query.name,req.query.amount, req.query.callback);
  //let callback = decodeURI(req.query.callback);
  //let name=encodeURIComponent(req.query.name);
  let message=encodeURIComponent(req.query.message);
  let invoiceRequest = req.query.callback+"?amount="+req.query.amount+"&comment="+message;
  console.log("invoice request url",invoiceRequest);
  let result;
  try {
    result = await axios.get(invoiceRequest);
  } catch (err) {
    console.log("failed to get invoice",err);
    return res.status(400).send(err);
  }
  console.log(result.data);
  return res.status(200).send(result.data);
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


  async function getKeysendInfo(address) {
    if (!address) { return };
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
    if (!textblock){
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
    if (matchAlbyLink) return matchAlbyLink[3] + "@getalby.com";

  }
}

async function unregister() {
  return
}

module.exports = {
  register,
  unregister
}
