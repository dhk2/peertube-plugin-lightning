const axios = require('axios');

async function register({
  registerHook,
  registerSetting,
  getRouter,
  peertubeHelpers,
  settingsManager,
  storageManager,
  videoCategoryManager,
  videoLicenceManager,
  videoLanguageManager
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
  let lightningAddress = await settingsManager.getSetting("lightning-address");
  let walletHost = lightningAddress.substring(lightningAddress.indexOf('@') + 1);
  let walletUser = lightningAddress.substring(0, lightningAddress.indexOf('@'));
  console.log("-------------------\n wallet host:", walletHost, "\n wallet user", walletUser);
  let apiRequest = "https://" + walletHost + "/.well-known/keysend/" + walletUser
  let walletData = await axios.get(apiRequest)
  //console.log("-------------------\n Api data:",walletData);
  if (walletData.data.status != "OK") {
    console.log("------------------ \n Error getting lightning address data");
    return;
  }
  let pubKey = walletData.data.pubkey;
  let tag = walletData.data.tag;
  let customKey = walletData.data.customData[0].customKey;
  let customValue = walletData.data.customData[0].customValue;
  const router = getRouter();
  router.use('/tip', async (req, res) => {

    var tipHtml = "<html>\n<head>\n";
    tipHtml = tipHtml + '<meta name=”lightning” content=”lnurlp:”' + lightningAddress + '/>';
    tipHtml = tipHtml + '<meta property=”og:image” content=”https://commons.wikimedia.org/wiki/File:Logopeertube.png” /> '
    tipHtml = tipHtml + "</head>\n";
    tipHtml = tipHtml + "<body>key " + pubKey + "<br>tag " + tag + "<br> custom key " + customKey + "<br> custom value " + customValue;
    tipHtml
    tipHtml = tipHtml + "\n</body>\n</html>";
    return res.status(200).send(tipHtml);

  })

  router.use('/walletinfo', async (req, res) => {
    console.log("█Request for wallet info\n", req.query)
    //console.log("███wrecked", req);
    if (req.query.video) {
      apiCall = "https://lawsplaining.peertube.biz/api/v1/videos/" + req.query.video;
      console.log("█", apiCall);
      let videoData = await axios.get(apiCall);
      //console.log("███",accountData);
      let bolt = await findLightningAddress(videoData.data.description);
      console.log("[" + bolt + ']');
      let boltParts = bolt.toString().split("@");
      console.log("boltparts",boltParts);
      if (boltParts[1]) {
        console.log("possible valid lighting address:", boltParts);
        let walletHost = boltParts[1];
        let walletUser = boltParts[0];
        console.log("-------------------\n wallet host:", walletHost, "\n wallet user", walletUser);
        let apiRequest = "https://" + walletHost + "/.well-known/keysend/" + walletUser
        console.log(apiRequest);
        let wallet = await axios.get(apiRequest);
        console.log(wallet.data);
        return res.status(200).send(wallet.data);
      }
      if (!req.query.channel) {
        req.query.channel = videoData.channel.name;
      }
      if (!req.query.account) {
        req.query.account = videoData.account.name;
      }
    }
    if (req.query.channel) {
      apiCall = "https://lawsplaining.peertube.biz/api/v1/video-channels/" + req.query.channel;
      console.log("█", apiCall);
      let channelData = await axios.get(apiCall);
      //console.log("███",accountData);
      let bolt = await findLightningAddress(channelData.data.description);
      let boltParts = bolt.split("@");
      console.log("boltparts:",boltParts);
      if (boltParts[1]) {
        console.log("possible valid lighting address:", boltParts);
        let walletHost = boltParts[1];
        let walletUser = boltParts[0];
        console.log("-------------------\n wallet host:", walletHost, "\n wallet user", walletUser);
        let apiRequest = "https://" + walletHost + "/.well-known/keysend/" + walletUser
        let wallet = await axios.get(apiRequest);
        console.log(wallet.data);
        return res.status(200).send(wallet.data);
      }
      if (!req.query.account) {
        //req.query.account = channelData.
      }
    }
    if (req.query.account) {
      apiCall = "https://lawsplaining.peertube.biz/api/v1/accounts/" + req.query.account;
      console.log("█", apiCall);
      let accountData = await axios.get(apiCall);
      //console.log("███",accountData);
      let bolt = await findLightningAddress(accountData.data.description);
      console.log("returned address",bolt);
      let boltParts = bolt.split("@");
      if (boltParts[1]) {
        console.log("possible valid lighting address:", boltParts);
        let walletHost = boltParts[1];
        let walletUser = boltParts[0];
        console.log("-------------------\n wallet host:", walletHost, "\n wallet user", walletUser);
        let apiRequest = "https://" + walletHost + "/.well-known/keysend/" + walletUser
        let wallet = await axios.get(apiRequest);
        console.log(wallet.data);
        return res.status(200).send(wallet.data);
      }
    }
    return res.status(200).send(walletData.data);
    /*
    if (req.query.account) {
      if (req.query.account == 'nick') {
        return res.status(200).send({ "status": "OK", "tag": "keysend", "pubkey": "030a58b8653d32b99200a2334cfe913e51dc7d155aa0116c176657a4f1722677a3", "customData": [{ "customKey": "696969", "customValue": "LgG0L9WZICAZvKaJKKQS" }] });
      } else {
        return res.status(404).send({ "status": "404 not found" });
      }
    }
    
    */
  })
  async function findLightningAddress(textBlock) {
    bolt = textBlock.indexOf('⚡️');
    console.log(bolt);
    let hack = textBlock.substring(bolt + 2);
    console.log('[' + hack + ']');
    let hack2 = await hack.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);
    console.log('[' + hack2 + ']');
    return hack2.toString();
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
