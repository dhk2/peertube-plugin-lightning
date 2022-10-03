const axios = require('axios');

async function register ({
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
  console.log("-------------------\n wallet host:",walletHost,"\n wallet user",walletUser);
  let apiRequest = "https://"+walletHost+"/.well-known/keysend/"+walletUser
  let walletData = await axios.get(apiRequest)
  //console.log("-------------------\n Api data:",walletData);
  if (walletData.data.status != "OK"){
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
    tipHtml = tipHtml +'<meta name=”lightning” content=”lnurlp:”'+lightningAddress+'/>';
    tipHtml = tipHtml +'<meta property=”og:image” content=”https://commons.wikimedia.org/wiki/File:Logopeertube.png” /> '
    tipHtml = tipHtml +"</head>\n";
    tipHtml = tipHtml + "<body>key "+pubKey+"<br>tag "+tag+"<br> custom key "+customKey+"<br> custom value "+customValue;
    tipHtml
    tipHtml =tipHtml+"\n</body>\n</html>";
    return res.status(200).send(tipHtml);

  })

  router.use('/walletinfo', async (req, res) => {
    console.log("\n\n\n Request for wallet info\n",req.query)
    if (req.query.account)
      return res.status(200).send({"status":"OK","tag":"keysend","pubkey":"030a58b8653d32b99200a2334cfe913e51dc7d155aa0116c176657a4f1722677a3","customData":[{"customKey":"696969","customValue":"LgG0L9WZICAZvKaJKKQS"}]});
    return res.status(200).send(walletData.data);
  })
  
}

async function unregister () {
  return
}

module.exports = {
  register,
  unregister
}
