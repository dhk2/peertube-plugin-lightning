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
    console.log(req.query);
    if (Object.keys(req.query).length === 0){
      console.log("returning instance wallet for donation");
      return res.status(200).send(hostWalletData);
    }
    //console.log("███wrecked", req);
    if (req.query.account && !req.query.update) {
      var accountLightning = await storageManager.getData("lightning" + "-" + req.query.account);
      console.log("retrieved stored lighting info", accountLightning);
      if (accountLightning) {
        if (accountLightning) {
          return res.status(200).send(accountLightning);
        } else {
          if (accountLightning.address) {
            let walletData = await getWalletInfo(accountLightning.address);
            if (!walletData) {
              console.log("stored address configured, but failed to get data from provider", accountLightning.address);
            } else {
              if (walletData.status == "OK") {
                storageManager.storeData("lightning" + "-" + req.query.account, walletData);
                return res.status(200).send(walletData);
              } else {
                console.log("error returned from provider for stored address", walletData);
              }
            }
          }
        }
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
        let bolt = await findLightningAddress(videoData.data.description);
        if (bolt) {
          console.log("lightning address found in video description [" + bolt + ']');
          let walletData = await getWalletInfo(bolt);
          if (walletData) {
            console.log("successfully retrieved data for wallet in video", videoData.data.account.name, walletData);
            storageManager.storeData("lightning" + "-" + videoData.data.account.name, walletData);
            return res.status(200).send(walletData);
          } else {
            console.log("failed to get wallet info from address in video",bolt);
          }
        } else {
          console.log("no lightning address found in video description");
        }
      }
    }
    if (req.query.channel) {
      apiCall = base+"/api/v1/video-channels/" + req.query.channel;
       console.log("█ getting channel data", apiCall);
      let channelData;
      try {
         channelData = await axios.get(apiCall);
      } catch {
        console.log("failed to pull information for provided channel id", apiCall);
      }
      if (channelData) {
        let bolt = await findLightningAddress(channelData.data.description);
        if (bolt) {
          console.log("lightning address found in channel description [" + bolt + ']');
          let walletData = await getWalletInfo(bolt);
          if (walletData) {
            console.log("successfully retrieved data for wallet in channel", channelData.data.name, walletData);
            return res.status(200).send(walletData);
          } else {
            console.log("failed to get wallet info from address in channel",bolt);
          }
        } else {
          console.log("no lightning address found in channel description");
        }
      }
    }
    if (req.query.account) {
      apiCall = base+"/api/v1/accounts/" + req.query.account;
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
            storageManager.storeData("lightning" + "-" + req.query.account, walletData);
            console.log("successfully retrieved data for wallet in account", req.query.account, walletData);
            return res.status(200).send(walletData);
          } else {
            console.log("failed to get wallet info from address in account",bolt);
          }
        } else {
          console.log("no lightning address found in account description");
        }
      }
    }
    console.log("no address found at all, sucka");
    return res.status(400).send();
  })
  async function getWalletInfo(address) {
    if (!address){return};
    console.log(address);
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
    if (!textBlock){return};
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
