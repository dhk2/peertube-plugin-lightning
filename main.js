const axios = require('axios');
//const crypto = require('crypto');
const { channel } = require('diagnostics_channel');
const { version } = require('./package.json');
const fs = require('fs');
const { Console } = require('console');
const { waitForDebugger } = require('inspector');
var v5 = require('uuidv5');
const io = require("socket.io-client");
const { enabled } = require('debug/src/browser');
async function register({
  registerHook,
  registerSetting,
  getRouter,
  peertubeHelpers,
  settingsManager,
  storageManager,
  registerVideoField,
  registerExternalAuth,
  registerClientRoute
}) {
  const milliday = 24*60*60*1000;
  registerSetting({
    name: 'lightning-address',
    label: 'Lightning address',
    type: 'input',
    descriptionHTML: 'This is a wallet for both the host split and host donations. Should be keysend compatible so getalby is a good choice',
    private: false
  })
  registerSetting({
    name: 'lightning-split',
    label: 'Requires split for host',
    default: '0',
    type: 'input',
    descriptionHTML: 'This will add a percentage split to any boostagrams or streams sent to videos hosted on this instance',
    private: false
  })
  registerSetting({
    name: 'lightning-tipVerb',
    label: 'Verb to use for tipping',
    type: 'input',
    default: 'Boost',
    descriptionHTML: 'Superchat, Zap, Boostagram, bits, spells, whatever your community would prefer.',
    private: false
  })
  registerSetting({
    name: 'alby-client-id',
    label: 'Alby Api Client ID',
    type: 'input',
    descriptionHTML: 'This is the client ID obtained from Alby. Needed to allow users to authorize payments directly from PeerTube in any browser',
    private: false
  })
  registerSetting({
    name: 'alby-client-secret',
    label: 'Alby API client secret',
    type: 'input-password',
    descriptionHTML: 'The client secret',
    private: true
  })
  registerSetting({
    name: 'boost-bot-account',
    label: 'Boost bot account user name for posting cross app comments',
    type: 'input',
    descriptionHTML: '',
    private: false
  })
  registerSetting({
    name: 'boost-bot-password',
    label: 'Password for boost bot',
    type: 'input-password',
    descriptionHTML: 'Needed to allow boost bot to post cross app comments',
    private: true
  })
  registerSetting({
    name: 'simpletip-token',
    label: 'Simpletip token',
    type: 'input-password',
    descriptionHTML: 'used to authorize connections to the simpletip boost aggregator',
    private: true
  })

  registerSetting({
    name: 'legacy-enable',
    default: true,
    label: 'Enable legacy fiat tip services',
    type: 'input-checkbox',
    descriptionHTML: 'This will search support and description fields for various third party tip providers',
    private: false
  })
  registerSetting({
    name: 'keysend-enable',
    default: true,
    label: 'Enable Keysend lightning transactions',
    type: 'input-checkbox',
    descriptionHTML: 'This will enable keysend lightning tips, with boostagram meta data',
    private: false
  })
  registerSetting({
    name: 'lnurl-enable',
    default: true,
    label: 'Enable LNURL lightning wallet transactions',
    type: 'input-checkbox',
    descriptionHTML: 'This will enable LNURL lightning wallet transactions, lacks any metadata and is much more data intensive but supports less advanced lighting wallets',
    private: false
  })
  registerSetting({
    name: 'logon-enable',
    default: false,
    label: 'Enable logging in with alby wallet',
    type: 'input-checkbox',
    descriptionHTML: 'This will allow users to authenticate and create accounts using Alby Wallet credentials',
    private: false
  })
  registerSetting({
    name: 'debug-enable',
    default: false,
    label: 'Enable diagnostic log updates',
    type: 'input-checkbox',
    descriptionHTML: 'This will create more extensive logging of program state data both client and server side for finding and resolving errors ',
    private: false
  })
  var timeCheck=new Date().getDay();
  var checking=false;
  //("⚡️⚡️⚡️⚡️ time stamp",timeCheck);
  var base = await peertubeHelpers.config.getWebserverUrl();
  var serverConfig = await peertubeHelpers.config.getServerConfig();
  var hostName = serverConfig.instance.name;
  var plugins = serverConfig.plugin.registered;
  let lightningAddress = await settingsManager.getSetting("lightning-address");
  let hostSplit = await settingsManager.getSetting("lightning-split");
  if (!lightningAddress) {
    console.log("⚡️⚡️No wallet configured for system");
  }
  
  if ((!hostSplit || !(hostSplit>0)) || !lightningAddress) {
    hostSplit = 0;
  } else {
    hostSplit = parseInt(hostSplit);
    if (!(hostSplit > 0 && hostSplit <= 100)) {
      console.log("⚡️⚡️⚡️⚡️Invalid value for hostsplit", hostSplit);
      hostSplit = 1;
    }
  }
  let tipVerb = await settingsManager.getSetting('lightning-tipVerb');
  let enableLegacy = await settingsManager.getSetting("legacy-enable");
  let enableKeysend = await settingsManager.getSetting("keysend-enable");
  let enableLnurl = await settingsManager.getSetting("lnurl-enable");
  let enableDebug = await settingsManager.getSetting("debug-enable");
  let enableAlbyAuth = await settingsManager.getSetting("logon-enable");
  let client_id = await settingsManager.getSetting("alby-client-id");
  let client_secret = await settingsManager.getSetting("alby-client-secret");
  let botAccount = await settingsManager.getSetting("boost-bot-account");
  let botPassword = await settingsManager.getSetting("boost-bot-password");
  let simpletipToken = await settingsManager.getSetting("simpletip-token");
  let botToken;
  if (botAccount && botPassword) {
    try {
      botToken = await getPeerTubeToken(botAccount, botPassword);
    } catch (err){
      console.log("⚡️⚡️⚡️⚡️ error attempting to log bot on",err);
    }
  }
  console.log("⚡️⚡️⚡️⚡️ Lightning plugin started", enableDebug);
  let hostParts= base.split('//');
  let hostDomain = hostParts.pop();
  if (enableDebug) {
    console.log("⚡️⚡️ server settings loaded", hostName, hostDomain, base, hostSplit, lightningAddress,serverConfig.plugin.registered);
  }
  let hostWalletData = {};
  let dirtyHack;
  if (enableKeysend || enableLnurl) {
    if (lightningAddress) {
      hostWalletData.address = lightningAddress;
      hostWalletData.name = lightningAddress;
      if (enableKeysend) {
        let hostKeysendData = await getKeysendInfo(lightningAddress);
        if (!hostKeysendData) {
          console.log("⚡️⚡️⚡️⚡️failed to get system wallet data from provider", lightningAddress);
        } else {
          hostWalletData.keysend = hostKeysendData;
        }
      }
      if (hostSplit >= 0 && hostSplit <= 100) {
        hostWalletData.split = parseInt(hostSplit);
      }
      hostWalletData.fee = true;
      hostWalletData.name = hostName;
    }
  }
  let podcast2;
  let hiveTube;
  for (var plugin of plugins){
    switch (plugin.npmName){
      case "peertube-plugin-podcast2" : podcast2=true;
      break;
      case "peertube-plugin-hive-tube" : hiveTube=true;
      break;
    } 
  }
  let invoices = [];
  //frequently called hook used for daily patronage processing
  registerHook({
    target: 'filter:api.video-threads.list.result',
    handler: async (result,params ) => {
      console.log("⚡️⚡️⚡️⚡️ threads", params,result);
    return(result);
  }
  })



  registerHook({
    target: 'action:activity-pub.remote-video.updated',
    handler: async (video) => {
      
      if (checking == true){
        console.log("⚡️⚡️ already checking")
        return video;
      } 
      checking =true;
      var check=new Date().getDay();
      if (timeCheck != check) {
        timeCheck = check;
        await doSubscriptions();
      } else {
      }
      checking=false;
      return video
    }
  })
  registerHook({
    target: 'action:api.video-channel.created',
    handler: async (videoChannel) => {
      let crap = videoChannel;
      console.log("⚡️⚡️ channel created", videoChannel.videoChannel.dataValues,"oahahaha", videoChannel.videoChannel.dataValues.id);
      console.log("⚡️⚡️ channel created 2",videoChannel.videoChannel);
      console.log("⚡️⚡️ channel created 3",videoChannel.videoChannel.Actor);
      console.log("⚡️⚡️ channel created 4",videoChannel.videoChannel.Actor.preferredUsername);
      console
      let accountId = videoChannel.videoChannel.dataValues.accountId;
      let channelId = videoChannel.videoChannel.dataValues.id;
      let channelName = videoChannel.videoChannel.Actor.preferredUsername;
      console.log("⚡️⚡️ game for it",accountId,channelId,channelName)
      let accountApi =base + `/api/v1/users/${accountId}`;
      let channelApi =base + `/api/v1/video-channels/${channelName}`;
      console.log("⚡️⚡️ down for it",accountApi,channelApi);
      let channelInfo;
      try {
        channelInfo = await axios.get(channelApi);
      } catch (e) {
        console.log("⚡️⚡️ had error getting channel info for new channel")
      }
      if (channelInfo && channelInfo.data){
        console.log("⚡️⚡️ got channel info for new channel",channelInfo.data);
      }
      let userName;
      if (channelInfo && channelInfo.data && channelInfo.data.ownerAccount){
        userName  = channelInfo.data.ownerAccount.name;
      }
      let v4vsettings,storedWallet;
      if (userName){
        v4vsettings= await storageManager.getData('v4vsettings-'+userName.replace(/\./g, "-"));
      }
      if (!v4vsettings && userName){
      //if (userName){
        console.log("⚡️⚡️⚡️⚡️ no saved v4v settings, checking for wallet info");
        storedWallet = await storageManager.getData("lightning-" + userName.replace(/\./g, "-"));
      }
      console.log("⚡️⚡️⚡️⚡️v4v",v4vsettings,"wallet",storedWallet);
      let lightningAddress;
      if (v4vsettings && v4vsettings.boostBack){
        lightningAddress = v4vsettings.boostBack;
      }
      if (!lightningAddress && storedWallet && storedWallet.address){
        lightningAddress = storedWallet.address;
      }
      let createApi = base + `/plugins/lightning/router/createsplit?channel=` + channelName + `&splitaddress=` + lightningAddress + `&name=` + userName;
      let createResult;
      try{
        createResult = await axios.get(createApi);
      } catch (e){
        console.log("failed to create split for new channel",createApi);
      }
    }
  })
  registerHook({
    target: 'filter:feed.podcast.channel.create-custom-tags.result',
    handler: async (result, params) => {
      // { video: VideoChannelModel }
      const { videoChannel } = params
      if (params && params.videoChannel && params.videoChannel.dataValues && params.videoChannel.dataValues.Actor){
        var channel = params.videoChannel.dataValues.Actor.dataValues.preferredUsername;
      }
      var storedSplitData = await getSavedSplit(channel);
      var blocks = []
      if (storedSplitData) {
        for (var split of storedSplitData) {
          let newBlock = {};
          newBlock.name = split.name;
          newBlock.type = "node";
          newBlock.split = split.split;
          if (split.address && split.address != "custom"){
            newBlock.keysend = split.address;
          }
          if (split.fee) {
            newBlock.fee = split.fee;
          }
          if (split.keysend){
            newBlock.address = split.keysend.pubkey;
            if (Array.isArray(split.keysend.customData) && split.keysend.customData[0] && split.keysend.customData[0].customKey) {
              newBlock.customKey = split.keysend.customData[0].customKey;
              newBlock.customValue = split.keysend.customData[0].customValue;
            }
          }
          blockWrap = {};
          blockWrap.name = "podcast:valueRecipient"
          blockWrap.attributes = newBlock
          blocks.push(blockWrap);
        }
      } else {
        console.log("⚡️⚡️ no split info for channel", channel);
      }
      if (blocks.length > 0) {
        let podreturn = [
          {
            name: "podcast:value",
            attributes: {
              "type": "lightning",
              "method": "keysend",
              "suggested": "0.00000005000"
            },
            value: blocks,
          }
        ];
        if (enableDebug) {
          console.log("⚡️⚡️ channel level tags to add", podreturn);
        }
        return result.concat(podreturn)
      }
    }
  })
  registerHook({
    target:  'action:live.video.state.updated',
    handler: async (video) => {
      if (enableDebug){
        if (video && video.video){
          console.log("⚡️⚡️ live video updated",video.video.uuid,video.video.state);
        } else {
          console.log("⚡️⚡️ video.video missing from action",video.dataValues,video.DataModel,video.video);
          return;
        }
      }
      if (video.video.state !=1){
         console.log("⚡️⚡️ live stream ended");
        return;
      }
      let liveValue;
      try {
        liveValue = await storageManager.getData("livevalue-" + video.video.uuid);
        console.log("⚡️⚡️got live value", liveValue, "for",video.video.uuid);
      } catch {
        console.log("⚡️⚡️ hard failed getting lightning live value",video, video.video.uuid);
      }
      if (liveValue){
        const socket = io(liveValue);
        socket.on("connect", () => {
          console.log("⚡️⚡️\n⚡️⚡️Connected to socket!\n⚡️⚡️");
        });
        socket.on('remoteValue', (data) => {
          console.log(`⚡️⚡️\n⚡️⚡️message from socket to socket! \n⚡️⚡️`);
          console.log(data.value);
          storageManager.storeData("liveremotesplit-"+video.video.uuid,data);
        });
      }
      return;
    }
  })

  // For item level value tags
  registerHook({
    target: 'filter:feed.podcast.video.create-custom-tags.result',
    handler: async (result, params) => {
      // { video: VideoModel, liveItem: boolean }
      const { video, liveItem } = params
      console.log("⚡️⚡️⚡️⚡️ initial video values ⚡️⚡️⚡️⚡️",result,params);
     // console.log("⚡️⚡️⚡️⚡️ initial video values 2⚡️⚡️⚡️⚡️",params,params.video.VideoChannel.dataValues);
      if (liveItem) {
      }
      var videoUuid = params.video.dataValues.uuid;
      var storedSplitData = await getSavedSplit(videoUuid);
      let remoteSplitData = await getRemoteSplit(videoUuid);
      if (remoteSplitData && !storedSplitData){
        console.log(console.log("⚡️⚡️⚡️⚡️ remote split without stored split, param data",params,params.video.dataValues.videoChannel));
      }
      if (remoteSplitData && !storedSplitData){
        console.log("⚡️⚡️⚡️⚡️ need to get channel split because apps are whack",params.video.videoChannel.dataValues);
      }
      var blocks = []
      //var videoJSON = await peertubeHelpers.videos.loadByIdOrUUID(videoUuid);
      //console.log("⚡️⚡️⚡️⚡️ video helper json",videoJSON)
      if (storedSplitData) {
        for (var split of storedSplitData) {
          let newBlock = {};
          newBlock.name = split.name;
          newBlock.type = "node";
          if (split.address && split.address !="custom"){
            newBlock.lightning = split.address
          }
          newBlock.split = split.split;
          if (split.fee) {
            newBlock.fee = split.fee;
          }
          newBlock.address = split.keysend.pubkey;
          if (split.keysend.customData[0] && split.keysend.customData[0].customKey) {
            newBlock.customKey = split.keysend.customData[0].customKey;
            newBlock.customValue = split.keysend.customData[0].customValue;
          }
          blockWrap = {};
          blockWrap.name = "podcast:valueRecipient"
          blockWrap.attributes = newBlock
          blocks.push(blockWrap);
        }
      }
      let remoteSplitBlock= [];
      if (remoteSplitData){
        console.log("⚡️⚡️⚡️⚡️ remote split data",remoteSplitData);
        for (var valueSplit of remoteSplitData.blocks){
          if (!valueSplit){
            continue;
          }
          console.log("⚡️⚡️⚡️⚡️ remote split ",valueSplit.title,valueSplit.feedGuid,valueSplit.itemGuid,valueSplit.duration,valueSplit.startTime)
          if (valueSplit.startTime && valueSplit.duration){
            let remoteSplit ={};
            remoteSplit.name = "podcast:valueTimeSplit"
            remoteSplit.attributes={
              "startTime": valueSplit.startTime,
              "remotePercentage": valueSplit.settings.split,
              "duration": valueSplit.duration,
            }
            if (valueSplit.feedGuid && valueSplit.itemGuid){
              let remoteItem={};
              remoteItem.name="podcast:remoteItem"
              remoteItem.attributes={
                "feedGuid": valueSplit.feedGuid,
                "itemGuid": valueSplit.itemGuid
              }
              let hack = [];
              hack.push(remoteItem);
              console.log("hack",hack);
              remoteSplit.value = hack;
            }
            blocks.push(remoteSplit);
          }
        }
        console.log("⚡️⚡️⚡️⚡️ remote split",blocks);
      }
      let customObjects = [];
      let valueBlock
      if (blocks.length > 0) {
        valueBlock = {
          name: "podcast:value",
          attributes: {
            "type": "lightning",
            "method": "keysend",
            "suggested": "0.00000005000"
          },
          value: blocks,
        }
        console.log("⚡️⚡️ value block",JSON.stringify(valueBlock, null, 4));
        console.log("⚡️⚡️ blocks",JSON.stringify(blocks, null, 4));
        customObjects.push(valueBlock);
        dirtyHack=valueBlock;
      }
      if (liveItem){
        let liveValue;
        try {
          liveValue = await storageManager.getData("livevalue-" + videoUuid);
        } catch {
          console.log("⚡️⚡️ hard failed getting lightning live value");
        }
        if (liveValue){
          let liveValueTag = {
              name: "podcast:liveValue",
              attributes: {
                "uri": liveValue,
                protocol: "socket.io",
              }
          }
          customObjects.push(liveValueTag);
        }
      }
      return result.concat(customObjects);
    }
  })
  registerHook({
    target: 'action:api.video.updated',
    handler: ({ video, body }) => {
      if (enableDebug) {
        console.log("⚡️⚡️updating video\n",body.pluginData);
      }
      //if (!body.pluginData) return

      const seasonNode = body.pluginData['seasonnode'];
      const seasonName = body.pluginData['seasonname'];
      const episodeNode = body.pluginData['episodenode'];
      const episodeName = body.pluginData['episodename'];
      const chapters = body.pluginData['chapters'];
      const itemTxt = body.pluginData['itemtxt'];

      //if (!value) return
      try {
        if (seasonNode){
          storageManager.storeData('seasonnode-' + video.id, seasonNode)
        }
        if (seasonName){
          storageManager.storeData('seasonname-' + video.id, seasonName)
        }
        if (episodeNode){
          storageManager.storeData('episodenode-' + video.id, episodeNode)
        }
        if (episodeName){
          storageManager.storeData('episodename-' + video.id, episodeName)
        }
        if (chapters) {
          storageManager.storeData('chapters-' + video.id, chapters)
        }
        if (itemTxt){
          storageManager.storeData('itemtxt-' + video.id, itemTxt)
        }
      } catch (err) {
      console.log("⚡️⚡️error updating video plugin data\n",err,body);
      }
      return;
    }
  })

  const router = getRouter();
  //TODO normalize behavior for account and address
  router.use('/walletinfo', async (req, res) => {
    let now = Date.now();
    if (enableDebug) {
      console.log("⚡️⚡️Request for wallet info\n", req.query)
    }
    if (!enableLnurl && !enableKeysend) {
      return res.status(503).send("No Lightning services enabled for plug-in");
    }
    let foundLightningAddress;
    if (req.query.address) {
      let storedWallet = await storageManager.getData("lightning-" + req.query.address.replace(/\./g, "-"));
      if (storedWallet && !req.query.refresh){
        let timePassed = (now - storedWallet.retrieved)/milliday;
        if (enableDebug) {
          console.log(`⚡️⚡️ found cached wallet data for ${req.query.address} from ${timePassed} days ago`,storedWallet)
        }
        if (timePassed < 1){
          return res.status(200).send(storedWallet);
        }
      }
      let newWallet = await createWalletObject(req.query.address);
      if (enableDebug) {
        console.log(`⚡️⚡️ created new wallet`,newWallet)
      }
      if (newWallet && (newWallet.lnurl || newWallet.keysend)){
        await storageManager.storeData("lightning-" + req.query.address.replace(/\./g, "-"), newWallet);
        return res.status(200).send(newWallet);
      }
      return res.status(400).send(`Error creating wallet info object for ${address}`);
    }
    if (req.query.account) {
      var storedWallet
      storedWallet = await storageManager.getData("lightning-" + req.query.account.replace(/\./g, "-"));
      if (storedWallet && !req.query.refresh && (storedWallet.lnurl || storedWallet.keySend)) {
        if (enableDebug) {
          console.log("⚡️⚡️ successfully found stored wallet data for account", req.query.account, storedWallet);
        }
        let timePassed = (now - storedWallet.retrieved)/milliday;

        if (enableDebug){
          let cacheDate = new Date(storedWallet.retrieved);
          console.log(`⚡️⚡️ saved wallet ${timePassed} days ago on ${cacheDate.toLocaleDateString()}`);
        }
        if (timePassed < 7){
          return res.status(200).send(storedWallet);
        } else {
          console.log(`⚡️⚡️ saved wallet data expired after ${timePassed} days`);
        }
        if (storedWallet.address){
          let newWallet = await createWalletObject(storedWallet.address);
          if (newWallet.keysend){
            saveWellKnown(req.query.account, newWallet.keysend);
          }
          if (newWallet && newWallet.lnurl){
            saveWellKnownLnurl(req.query.account, newWallet.lnurl);
          }
          await storageManager.storeData("lightning-" + req.query.account.replace(/\./g, "-"), newWallet);
          
          return res.status(200).send(newWallet);
        } else {
          console.log("no stored address to update wallet");
        }
      } else {
        if (enableDebug) {
          console.log("⚡️⚡️no stored wallet for account", req.query);
        }
      }
      let parts = req.query.account.split("@")
      if (parts.length >1){
        let remoteWalletInfoApi = `https://${parts[1]}/plugins/lightning/router/walletinfo?account=${parts[0]}`;
        if (enableDebug){
          console.log("⚡️⚡️checking for remote instance wallet info via plugin",remoteWalletInfoApi);
        }
        let remoteWalletInfo;
        try {
          remoteWalletInfo = await axios.get(remoteWalletInfoApi);
        } catch (e){
           console.log("⚡️⚡️ error requesting remote wallet info",e);
        }
        if (remoteWalletInfo && remoteWalletInfo.data){
          if (enableDebug) {
            console.log("⚡️⚡️got wallet info via  peertube api",remoteWalletInfoApi, remoteWalletInfo.data.length);
          }
          if (remoteWalletInfo.data.lnurl || remoteWalletInfo.data.kesend){
            console.log("⚡️⚡️verified wallet config");
            await storageManager.storeData("lightning-" + req.query.account.replace(/\./g, "-"), newWallet);
            return res.status(200).send(remoteWalletInfo.data);
          } else {
            console.log("⚡️⚡️peertube plugin response fails to pass validation");
          }
        }
      }
      if (parts.length > 1) {
        apiCall = "https://" + parts[1] + "/api/v1/accounts/" + parts[0];
      } else {
        apiCall = base + "/api/v1/accounts/" + req.query.account;
      }
      let accountData;
      try {
        accountData = await axios.get(apiCall);
      } catch (err) {
        console.log("⚡️⚡️hard failure pulling acount information", apiCall, err);
      }
      if (!accountData) {
        //hack for mastardon's lame api
        apiCall = "https://" + parts[1] + "/api/v1/accounts/lookup?acct=" + parts[0]
        try {
          accountData = await axios.get(apiCall);
        } catch (err) {
          console.log("⚡️⚡️errored trying to pull information from mastodon", apiCall, err);
        }
      }
      if (accountData) {
        let account = accountData.data
        if (enableDebug) {
          console.log("⚡️⚡️account to search for address", account);///////////////
        }
        console.log("⚡️⚡️ description to search",account.description);
        if (account.description) {
          foundLightningAddress = await findLightningAddress(account.description);
        }
        console.log("⚡️⚡️ fields to search",account.fields);
        if (!foundLightningAddress && account.fields) {
          for (var field of account.fields) {
            console.log("⚡️⚡️ checking",field.name.charCodeAt(0),'⚡️'.charCodeAt(0));
            if (field.name.toLowerCase() === "lightning address" || field.name.toLowerCase() == "lud16" || field.name.charCodeAt(0) == 9889) {
              foundLightningAddress = field.value;
            } else {
              console.log("⚡️⚡️ no match",` >${field.name}< != >⚡️<`);
            }
          }
        }
        console.log("⚡️⚡️ notes to search",account.note);
        if (!foundLightningAddress && account.note) {
          foundLightningAddress = await findLightningAddress(account.note);
        }
        if (!foundLightningAddress){
          console.log("⚡️⚡️ no lightning address found");
          return res.status(420).send();
        }
        console.log("⚡️⚡️lightning address found", foundLightningAddress);
        let newWallet = await createWalletObject(foundLightningAddress);
        if (newWallet && (newWallet.lnurl || newWallet.keysend)){
          if (newWallet.keysend){
            saveWellKnown(req.query.account, newWallet.keysend);
          }
          if (newWallet.lnurl){
            saveWellKnownLnurl(req.query.account, newWallet.lnurl);
          }
          console.log("⚡️⚡️wallet being saved and returned", newWallet);///////////////
          await storageManager.storeData("lightning-" + req.query.account.replace(/\./g, "-"), newWallet);
          return res.status(200).send(newWallet);
        } else {
          console.log("⚡️⚡️new wallet failed validation", newWallet);///////////////
        }
      }
    }
  })

  router.use('/dirtyhack', async (req, res) => {
    console.log("⚡️⚡️⚡️⚡️ dirty hack",dirtyHack,req.query);
     if (req.query.cp){
      console.log("⚡️⚡️⚡️⚡️ clearing patronage paid days");
      let subscriptions = await storageManager.getData('subscriptions');
      let list = [];
      if (subscriptions){
        for (var sub of subscriptions){
          sub.paiddays=0;
        }
        storageManager.storeData("subscriptions", subscriptions);
        return res.status(200).send(subscriptions);
      }
    }
    if (req.query.sub){
      console.log("⚡️⚡️⚡️⚡️ patronage list");
      let subscriptions = await storageManager.getData('subscriptions');
      let list = [];
      if (subscriptions){
        for (var sub of subscriptions){
          console.log(sub);
          if (sub.public){
            list.push(sub);
          }
          let startDate=new Date(sub.startdate);
          let paidDate = sub.startdate+(sub.paiddays*milliday);
          let today = Date.now();  
          let unPaidTime = today-paidDate;
          let payDays = parseInt(Math.floor(unPaidTime / milliday));
          let payStart = new Date(paidDate);
          let payEnd = new Date(paidDate+(milliday*payDays));
          console.log("⚡️payStart",payStart.toLocaleDateString(),"⚡️pay end",payEnd.toLocaleDateString(),"⚡️pay days",payDays);
          console.log("⚡️paidDate",paidDate,"⚡️today",today,"⚡️unpaidTime",unPaidTime);   
          console.log("⚡️start date",startDate,"⚡️paid days",sub.paiddays,"⚡️confetti",sub.pendingconfetti); 
        }
        //storageManager.storeData("subscriptions", subscriptions);
        return res.status(200).send(list);
      }
    }
    if (req.query.dosub){
      doSubscriptions();
    }
    if (req.query.splitkit){
      let remoteSplitData = await getRemoteSplit(req.query.splitkit);

      let remoteSplitBlock= [];
      if (remoteSplitData){
        console.log("⚡️⚡️⚡️⚡️ remote split data",remoteSplitData);
        for (var valueSplit of remoteSplitData.blocks){
          console.log("⚡️⚡️⚡️⚡️ remote split ",valueSplit.title,valueSplit.feedGuid,valueSplit.itemGuid,valueSplit.duration,valueSplit.startTime)
          if (valueSplit.startTime && valueSplit.duration){
            let remoteSplit ={};
            remoteSplit.name ="podcast:valueTimeSplit"
            remoteSplit.startTime=valueSplit.startTime;
            remoteSplit.remotePercentage= valueSplit.settings.split;
            remoteSplit.duration=valueSplit.duration;
            if (valueSplit.feedGuid && valueSplit.itemGuid){
              let remoteItem={};
              remoteItem.name = "podcast:remoteItem";
              remoteItem.feedGuid = valueSplit.feedGuid;
              remoteItem.itemGuid = valueSplit.itemGuid;
              remoteSplit.remoteItem = remoteItem;
            }
            remoteSplitBlock.push(remoteSplit);
          }
        }
        dirtyHack =remoteSplitData;
        let split = dirtyHack.blocks[1];
        console.log("remotesplit",remoteSplitData);
        console.log("split",split);
        console.log("⚡️⚡️⚡️⚡️ remote split",remoteSplitBlock);
      }
    }
    if (req.query.status){
      let wow = `Statuses:\nid:${client_id}\nlogon enabled:${enableAlbyAuth}\nkey length:${client_secret.length}`;
      return res.status(200).send(wow);
    }
    return res.status(200).send(dirtyHack);
  });
  router.use('/setWallet', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️wallet setting request", req.query);
    }
    let user = await peertubeHelpers.user.getAuthUser(res);
    if (user && user.dataValues && req.query.address) {
      let userName = user.dataValues.username;
      if (enableDebug) {
        console.log("███ got authorized peertube user", user.dataValues.username);
      }
      if (enableDebug) {
        console.log("⚡️⚡️⚡️⚡️ user", userName, "address:",req.query.address);
      }
      let newWallet = await createWalletObject(req.query.address);
      if (newWallet.keysend){
        saveWellKnown(userName, newWallet.keysend);
      }
      if (newWallet && newWallet.lnurl){
        saveWellKnownLnurl(userName, newWallet.lnurl);
      }
      storageManager.storeData("lightning-" + userName.replace(/\./g, "-"), newWallet);
      return res.status(200).send(newWallet);
    }
    return res.status(420).send();
    /* disabling pubkey/custom value for now
    if (!req.query.key) {
      return res.status(400).send("missing key");
    }
    if (req.query.address) {
      let walletInfo = getKeysendInfo(req.query.address);
      if (walletInfo) {
        let lightning = {};
        lightning.address = req.query.address;
        lightning.data = newData
        console.log("⚡️⚡️saving wallet data", req.query.key, lightning);
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
    console.log("⚡️⚡️saving wallet data", req.query.key, lightning);
    //storageManager.storeData("lightning" + "-" + req.query.key, lightning);
    return res.status(200).send(lightning);
    */
  })
  router.use(`/podcast2`, async (req,res) => {
    let original = `${req.protocol}://${req.get('host')}${req.originalUrl}`
    let redirect = original.replace("lightning","podcast2");
    res.set('location', redirect);
    return res.status(301).send()
  })
  router.use('/getinvoice', async (req, res) => {
    //  console.log(req);
    if (enableDebug) {
      console.log("⚡️⚡️ getting lnurl invoice", req.query);
    }
    if (!enableLnurl) {
      return res.status(503).send();
    }
    let message = encodeURIComponent(req.query.message);
    let invoiceRequest = req.query.callback + "?amount=" + req.query.amount + "&comment=" + message;
    //console.log("⚡️⚡️invoice request url", invoiceRequest);
    let result;
    try {
      result = await axios.get(invoiceRequest);
    } catch (err) {
      console.log("⚡️⚡️failed to get invoice", err);
      return res.status(400).send(err);
    }
    //console.log("⚡️⚡️ Invoice data",result.data);
    return res.status(200).send(result.data);
  })
  router.use('/getfeedid', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️getting feed id", req.query);
    }
    let channel = req.query.channel;
    if (!channel) {
      return res.status(420).send("no channel in feed id request");
    }
    let feed;
    let parts = channel.split('@');
    if (parts.length > 1) {

      return res.status(420).send("remote channel returned no feed id");
    }
    if (channel) {
      try {
        feed = await storageManager.getData("podcast" + "-" + channel)
      } catch (err) {
        console.log("⚡️⚡️error getting feedid", channel);
      }
    }
    //console.log("⚡️⚡️ feed", feed);
    if (feed) {
      return res.status(200).send(feed.toString());
    } else {
      return res.status(400).send("no feed id found for requested channel");
    }
  })
  router.use('/setfeedid', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️setting feed id", req.query);
    }
    let channel = req.query.channel;
    let feedID = req.query.feedid;
    if (channel) {
      try {
        await storageManager.storeData("podcast" + "-" + channel, feedID);
        return res.status(200).send();
      } catch (err) {
        console.log("⚡️⚡️ error storing feedid", channel, feedID);
        return res.status(400).send();
      }
    }
  })
  router.use('/getitemid', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️getting item id", req.query);
    }
    let uuid = req.query.uuid;
    let item;
    if (uuid) {
      try {
        item = await storageManager.getData("podcast" + "-" + uuid);
      } catch (err) {
        console.log("⚡️⚡️ error getting stored itemid", uuid);
      }
    }
    if (item) {
      return res.status(200).send(item.toString());
    } else {
      var apiCall = base + "/api/v1/videos/" + uuid;
      let videoData;
      try {
        videoData = await axios.get(apiCall);
      } catch {
        console.log("⚡️⚡️failed to pull information for provided video id", apiCall);
      }
      if (videoData) {
        let videoHost = videoData.data.channel.host
        if ("https://" + videoHost != base) {
          let hostApi = "https://" + videoHost + "/plugins/lightning/router/getitemid?uuid=" + uuid;
          let hostItemId;
          try {
            hostItemId = await axios.get(hostApi);
          } catch {
            console.log("⚡️⚡️failed to pull item ID from video host", hostApi);
          }
          if (hostItemId) {
            try {
              await storageManager.storeData("podcast" + "-" + uuid, hostItemId);
            } catch {
              console.log("⚡️⚡️failed to store item ID from host", uuid, hostItemId);
            }
            return res.status(200).send(hostItemId.data.toString());
          } else {
            console.log("⚡️⚡️ No id provided by hosting instance");
          }
        }
        let channel = videoData.data.channel.name;
        let feedApi = base + "/plugins/lightning/router/getfeedid?channel=" + channel;
        try {
          feedId = await axios.get(feedApi);
        } catch {
          console.log("⚡️⚡️ error when tring to get feed id ", feedApi);
          return res.status(404).send();
        }

      }
      console.log("⚡️⚡️no videodata available", apiCall);
      return res.status(400).send();
    }
  })
  router.use('/getlnurl', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️getting lnurl info", req.query);
    }
    if (!enableLnurl) {
      return res.status(503).send();
    }
    let result = getLnurlInfo(req.query.address);
    if (result) {
      return res.status(200).send(result);
    } else {
      return res.status(400).send();
    }
  })
  router.use('/setitemid', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️setting item id", req.query.uuid);
    }
    let uuid = req.query.uuid;
    let itemID = req.query.itemid;
    if (uuid) {
      try {
        await storageManager.storeData("podcast" + "-" + uuid, itemID);
        return res.sendStatus(200);
      } catch (err) {
        console.log("⚡️⚡️error setting item id", uuid, itemID);
        return res.sendStatus(400).send();
      }
    }
  })
  router.use('/setChannelGuid', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️setting channel guid", req.query);
    }
    let channel = req.query.channel;
    let guid = req.query.guid;
    if (channel && guid) {
      try {
        await storageManager.storeData("channelguid" + "-" + channel, guid);
        return res.status(200).send();
      } catch (err) {
        console.log("⚡️⚡️ error storing feedid", channel, guid,err);
        return res.status(400).send();
      }
    }
  })
  router.use('/getchannelguid', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️getting channel guid", req.query);
    }
    if (hiveTube){
      console.log("⚡️⚡️Hive tube managing channel guids");
      return res.status(420).send("hive in charge of channel GUID");
    }
    let host,channelOnly;
    let channel = req.query.channel;
    parts = channel.split("@");
    if (parts.length>1){
      host = parts[1];
      channelOnly = parts[0];
    }
    let channelGuid;
    if (channel) {
      try {
        channelGuid = await storageManager.getData("channelguid" + "-" + channel)
      } catch (err) {
        console.log("⚡️⚡️ error getting channel guid with full channel", channel);
        return res.status(400).send();
      }
    }
    if (channelOnly) {
      try {
        channelGuid = await storageManager.getData("channelguid" + "-" + channelOnly)
      } catch (err) {
        console.log("⚡️⚡️ error getting channel only without host", channelOnly,err);
        return res.status(400).send();
      }
    }
    if (!channelGuid && host && host !=hostDomain){
      apiUrl = `https://${host}/plugins/lightning/router/getchannelguid?channel=${channelOnly}`;
      try {
        console.log("⚡️⚡️ stuff",base,host,apiUrl);
        let guidData = await axios.get(apiUrl);
        if (guidData && guidData.data) {
          //console.log("⚡️⚡️channel guid", guidData.data);
          channelGuid = guidData.data;
        }
      } catch {
        console.log("⚡️⚡️unable to load channel guid", apiUrl);
      }
    }

    if (channelGuid) {
      return res.status(200).send(channelGuid);
    } else if (podcast2){
      return res.status(420).send("no saved value, podcast2 should be in charge");
    } else {
      //TODO properly create guid
      let rssUrl;
      if (channelOnly){
        rssUrl= await getRss(channelOnly);
      } else {
        rssUrl = await getRss(channel);
      }
      if (enableDebug) {
        console.log("⚡️⚡️creating channel guid", rssUrl);
      }
      channelGuid = await v5('url',rssUrl);
      if (channelGuid) {
        try {
          await storageManager.storeData("channelguid" + "-" + channel, channelGuid);
        } catch {
          console.log("⚡️⚡️failed to store channel guid", channel, channelGuid);
        }
        return res.status(200).send(channelGuid);
      } else {
        console.log("⚡️⚡️ error attempting to generate channel guiid",channel);
        return res.status(400).send();
      }
    }
  })
  router.use('/getsplit', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️Request for split info\n", req.query)
    }
    if (!enableKeysend && !enableLnurl) {
      console.log("⚡️⚡️No lighting support")
      return res.status(503).send();
    }
    var storedSplitData;
    if (req.query.video) {
      let liveRemoteSplit=await storageManager.getData("liveremotesplit-"+req.query.video);
      if (!liveRemoteSplit && req.query.channel){
        let parts = req.query.channel.split("@");
        if (parts.length>1 && parts[1] != hostDomain){
          console.log("mismatched domaines",parts[1],hostDomain);
          if (enableDebug){
            console.log("⚡️⚡️- calling remote split from main getsplit for video⚡️⚡️");
          }
          let remoteSplitApi = `https://${parts[1]}/plugins/lightning/router/getsplit?video=${req.query.video}`;
          console.log("remote split api",remoteSplitApi);
          try {
            let resultRemoteSplit = await axios.get(remoteSplitApi);
            if (resultRemoteSplit && resultRemoteSplit.data){
              liveRemoteSplit = resultRemoteSplit.data;
            }
            console.log("live remote split",liveRemoteSplit);
          } catch (e){
            console.log("erorred getting remote split from ",parts[1]);
          }
        } else {
          console.log("matched domaines",parts[1],hostDomain);
        }
      }
      if (liveRemoteSplit && liveRemoteSplit.value){
        console.log("⚡️⚡️ found remote video split",liveRemoteSplit)
        let splits=[];
        let total=0;
        for (var cut of liveRemoteSplit.value.destinations){
          let fixedSplit = eval(cut.split)
          total = total+fixedSplit;
          console.log(total,fixedSplit);
          let split = {
            "name": cut.name,
            "split": fixedSplit
          };
          let keysend={
            "tag": "keysend",
            "pubkey": cut.address,
          }
          split.keysend = keysend;
          if (cut.customKey){
            let custom = [{
              "customKey": cut.customKey,
              "customValue": cut.customValue
            }];
            split.keysend.customData=custom;
          }
          //TODO do splits and fees properly

          splits.push(split);
        }
        splits.sort((a,b) => (a.split < b.split) ? 1 : -1);
        if (enableDebug){
          console.log("total",total,"highest",splits[0].split);
        }
        if (total != 100){
          let xFactor = total -100;
          splits[0].split = splits[0].split - xFactor;
          
        }  
        splits[0].title=liveRemoteSplit.title;
        splits[0].image=liveRemoteSplit.image;
        splits[0].feedguid=liveRemoteSplit.feedGuid;
        splits[0].itemguid=liveRemoteSplit.itemGuid;
        console.log("⚡️⚡️ converted steve's split to alby split",splits);
        return res.status(200).send(splits);
      } 
      storedSplitData = await storageManager.getData("lightningsplit" + "-" + req.query.video);
      if (enableDebug){
        console.log("⚡️⚡️ found stored video split",storedSplitData);
      }
      if (storedSplitData) {
        return res.status(200).send(storedSplitData);
      }
      console.log("⚡️⚡️ failed to get video stored split",req.query.video);
    }
    if (req.query.channel){
      storedSplitData = await storageManager.getData("lightningsplit-" + req.query.channel.replace(/\./g, "-"));
      if (enableDebug){
        console.log("⚡️⚡️ found stored channel split",storedSplitData);
      }
      if (storedSplitData) {
        return res.status(200).send(storedSplitData);
      }
      console.log("⚡️⚡️ failed to get channel stored split",req.query.channel);
    }
    let parts;
    if (req.query.channel) {
      parts = req.query.channel.split("@");
      if (enableDebug){
        console.log("⚡️⚡️ looking for remote channel video splits",parts);
      }
      if (parts.length > 1) {
        if (enableDebug){
          console.log("⚡️⚡️- calling remote split from main getsplit ⚡️⚡️");
        }
        var apiCall = `https://${parts[1]}/plugins/lightning/router/getsplit?video=${req.query.video}&channel=${req.query.channel}`; 
        let remoteSplit;
        try {
          remoteSplit = await axios.get(apiCall);
          if (enableDebug && remoteSplit){
            console.log("⚡️⚡️ found remote channel/video split",apiCall,remoteSplit.data);
          }
        } catch {
          console.log("⚡️⚡️unable to fetch remote split data", apiCall);
        }
        if (remoteSplit) {
          if (enableDebug) {
            console.log("⚡️⚡️ caching channel/video remote split found");
          }
          try {
            let fixedSplit = await setCache(remoteSplit.data)
            await storageManager.storeData("lightningsplit-" + req.query.channel.replace(/\./g, "-"), fixedSplit);
            console.log("⚡️⚡️saving ",req.query.channel, fixedSplit);
            await saveWellKnownSplit(req.query.channel, remoteSplit.data);
          } catch {
            console.log("⚡️⚡️failed to store lightning split", req.query.channel, remoteSplit.data);
          }
          return res.status(200).send(remoteSplit.data);
        } else {
          if (enableDebug){
            console.log("⚡️⚡️ no remote split found",apiCall);
          }
        } 
      } else {
          if (enableDebug){
            console.log("⚡️⚡️ not enough parts",parts.length,parts);
          }
      }
    }
    //if no channel provided for video, need to look it up channel
    if (!req.query.channel) {
      console.log("⚡️⚡️ looking for remote video only split");
      var apiCall = base + "/api/v1/videos/" + req.query.video;
      let videoData;
      try {
        videoData = await axios.get(apiCall);
      } catch {
        console.log("⚡️⚡️failed to pull information for provided video id", apiCall);
      }
      if (videoData) {
        console.log("⚡️⚡️ got video data");
        let videoChannel = videoData.data.channel.name;
        let videoHost = "https://" + videoData.data.channel.host;
        storedSplitData = await getSavedSplit(videoChannel);
        console.log("⚡️⚡️retrieved chaNNEL split info for video", videoChannel, storedSplitData);
        if (storedSplitData) {

          return res.status(200).send(storedSplitData);
        }
        if (videoHost != base) {
          if (enableDebug){
            console.log("⚡️⚡️- calling remote split for channel from main getsplit ⚡️⚡️");
          }
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
        console.log("⚡️⚡️channels", videoData.data.channel);
        let foundLightningAddress = await findLightningAddress(videoData.data.description + " " + videoData.data.support + " " + videoData.data.channel.description + " " + videoData.data.channel.support + " " + videoData.data.account.description);
        if (foundLightningAddress) {
          console.log("⚡️⚡️lightning address found in video description [" + foundLightningAddress + ']');
          let keysendData = await getKeysendInfo(foundLightningAddress);
          let lnurlData = await getLnurlInfo(foundLightningAddress);
          if (lnurlData || keysendData) {
            let walletData = {};
            walletData.address = foundLightningAddress;
            if (keysendData) {
              walletData.keysend = keysendData;
              console.log("⚡️⚡️successfully retrieved keysend data for wallet in video", videoData.data.channel.name, keysendData);
              //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);
            }
            if (lnurlData) {
              walletData.lnurl = lnurlData;
              console.log("⚡️⚡️successfully retrieved lnurl data for wallet in video", videoData.data.channel.name, lnurlData);
              //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);

            }
            var splitData = new Array();
            walletData.split = 100;
            splitData.push(walletData);
            if (hostWalletData && (videoHost == base)) {
              splitData[0].split = 100 - hostWalletData.split;
              splitData.push(hostWalletData);
            }
            try {
              await storageManager.storeData("lightningsplit" + "-" + req.query.video.replace(/\./g, "-"), splitData);
            } catch {
              console.log("⚡️⚡️failed to store lightning split", req.query.video, splitData);
            }
            return res.status(200).send(splitData);
          } else {
            console.log("⚡️⚡️lightning address in video description does not resolve", foundLightningAddress);
          }
        } else {
          console.log("⚡️⚡️no lightning address found in video description");
        }
      }
    }
    //console.log("unable to find any split info in video data");
    //return res.status(400).send();
    if (req.query.channel) {
      var storedSplitData;
      try {
        storedSplitData = await storageManager.getData("lightningsplit" + "-" + req.query.channel.replace(/\./g, "-"));
        if (enableDebug && remoteSplit){
          console.log("⚡️⚡️ found cached channel split",apiCall,remoteSplit.data);
        }
      } catch {
        console.log("⚡️⚡️failed to get channel onlylightning split", req.query.channel);
      }
      if (storedSplitData) {
        let expired=false;
        for (var splitSlot in storedSplitData) {
          if (storedSplitData[splitSlot].keysend && storedSplitData[splitSlot].keysend.cache) {
            let cached = storedSplitData[splitSlot].keysend.cache
            let since = new Date().getTime - cached;
            if (since>7*24*60*60*1000){
              console.log("⚡️⚡️ channel only cached wallet data is expired",storedSplitData[splitSlot].address)
              expired = true;
            } 
          }
        } 
        if (enableDebug){
          console.log("⚡️⚡️ stored split found for channel",expired,storedSplitData);
        }
        if (!expired){
          return res.status(200).send(storedSplitData);
        } 
      } 
      let remoteHost, remoteChannel;
      if (req.query.channel.indexOf("@") > 1) {
        let channelParts = req.query.channel.split("@");
        remoteHost = channelParts[1];
        remoteChannel = channelParts[0];
      }
      var apiCall;
      if (remoteHost) {
        console.log("⚡️⚡️getting remote data");
        if (enableDebug){
          console.log("⚡️⚡️- calling remote split from main getsplit again! ⚡️⚡️");
        }
        apiCall = "https://" + remoteHost + "/plugins/lightning/router/getsplit?channel=" + remoteChannel;
        let remoteSplit;
        try {
          remoteSplit = await axios.get(apiCall);
          if (enableDebug && remoteSplit){
            console.log("⚡️⚡️ found remote split data",apiCall,remoteSplit.data);
          }
        } catch {
          console.log("⚡️⚡️unable to fetch remote split data", apiCall);
        }
        if (remoteSplit) {
          if (enableDebug) {
            console.log("⚡️⚡️ caching returning remote split", apiCall, remoteSplit.data);
          }
          try {
            let fixedSplit = await setCache(remoteSplit)
            console.log("⚡️⚡️saving ",req.query.channel, fixedSplit);
            await storageManager.storeData("lightningsplit-" + req.query.channel.replace(/\./g, "-"), fixedSplit);
            await saveWellKnownSplit(req.query.channel, splitData);
          } catch {
            console.log("⚡️⚡️failed to store lightning split", req.query.channel, splitData);
          }
          return res.status(200).send(remoteSplit.data);
        }
      }
      apiCall = base + "/api/v1/video-channels/" + req.query.channel;
      let channelData;
      try {
        channelData = await axios.get(apiCall);
      } catch {
        console.log("⚡️⚡️failed to pull information for provided channel id", apiCall);
      }
      if (channelData) {
        if (enableDebug){
          console.log("⚡️⚡️ searching channel data for lightning address",apiCall,channelData.data);
        }
        //console.log("channeldata",channelData);
        let foundLightningAddress = await findLightningAddress(channelData.data.description + " " + channelData.data.support+channelData.data.ownerAccount.description);
        if (foundLightningAddress) {
          let keysendData, lnurlData;
          if (enableKeysend) {
            keysendData = await getKeysendInfo(foundLightningAddress);
          }
          if (enableLnurl) {
            lnurlData = await getLnurlInfo(foundLightningAddress);
          }
          if (lnurlData || keysendData) {
            let walletData = {};
            walletData.address = foundLightningAddress;
            if (keysendData) {
              walletData.keysend = keysendData;
            }
            if (lnurlData) {
              walletData.lnurl = lnurlData;
            }
            var splitData = new Array;

            walletData.split = 100;
            splitData.push(walletData);
            if (hostWalletData) {
              splitData[0].split = 100 - hostWalletData.split;
            }
            splitData.push(hostWalletData);
            try {
              await storageManager.storeData("lightningsplit" + "-" + req.query.channel.replace(/\./g, "-"), splitData);
              await saveWellKnownSplit(req.query.channel, splitData);
            } catch {
              console.log("⚡️⚡️failed to store lightning split", req.query.channel, splitData);
            }
            return res.status(200).send(splitData);
          } else {
            console.log("⚡️⚡️lightning address in channel description does not resolve", foundLightningAddress);
          }
        } else {
          console.log("⚡️⚡️no lightning address found in channel description");
        }
        return res.status(400).send();
      }
    }
    console.log("⚡️⚡️unable to lookup split info for", req.query);
    return res.status(400).send();
  })
  router.use('/addsplit', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️add split called\n", req.query)
    }
    if (!enableKeysend && !enableLnurl) {
      return res.status(503).send();
    }
    var storedSplitData;
    var split = new Array();
    var newAddress = req.query.splitaddress;
    var newSplit = req.query.split;
    var channel = req.query.channel;
    var name = req.query.name;
    var customKey = req.query.customkey;
    var customValue = req.query.customvalue;
    var node = req.query.node;
    var customKeysend = req.query.customkeysend;
    var video = req.query.video;
    if (video) {
      try {
        storedSplitData = await storageManager.getData("lightningsplit" + "-" + video);
      } catch {
        console.log("⚡️⚡️failed to get lightning split for video", video);
      }
      console.log("⚡️⚡️retrieved split info for video ", video, "\n", storedSplitData);
      if (!storedSplitData) {
        console.log("⚡️⚡️stored split data not found");
        if (video) {
          console.log("⚡️⚡️base", base);
          var apiCall = base + "/api/v1/videos/" + video;
          console.log("⚡️⚡️ getting video data", apiCall);
          let videoData;
          try {
            videoData = await axios.get(apiCall);
          } catch {
            console.log("⚡️⚡️failed to pull information for provided video id", apiCall);
          }
          if (videoData) {
            console.log("⚡️⚡️channel data", videoData.data.channel);
            if (!channel) {
              channel = videoData.data.channel.name;
            }
            storedSplitData = await storageManager.getData("lightningsplit" + "-" + channel.replace(/\./g, "-"));
            //let foundLightningAddress = await findLightningAddress(videoData.data.description + " " + videoData.data.support + " " + videoData.data.channel.description + " " + videoData.data.channel.support + " " + videoData.data.account.description);
            if (storedSplitData) {
              split = storedSplitData;
              /*
              console.log("⚡️⚡️split data found");
              let keysendData = await getKeysendInfo();
              let lnurlData = await getLnurlInfo();
              if (lnurlData || keysendData) {
                let walletData = {};
                walletData.address = foundLightningAddress;
                if (keysendData) {
                  walletData.keysend = keysendData;
                  console.log("⚡️⚡️successfully retrieved keysend data for wallet in video", videoData.data.channel.name, keysendData);
                  //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);
                }
                if (lnurlData) {
                  walletData.lnurl = lnurlData;
                  console.log("⚡️⚡️successfully retrieved lnurl data for wallet in video", videoData.data.channel.name, lnurlData);
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
                if (hostWalletData && (hostWalletData.split > 1)) {
                  splitData[0].split = 100 - hostWalletData.split;
                }
                splitData.push(hostWalletData);
                //await storageManager.storeData("lightningsplit" + "-" + req.query.video, splitData);
                return res.status(200).send(splitData);
              } else {
                console.log("⚡️⚡️lightning address in video description does not resolve", foundLightningAddress);
              }
              */
            } else {
              console.log("⚡️⚡️no lightning address found in video description");
            }
          }
        }

      } else {
        split = storedSplitData;
      }
    } else if (req.query.channel) {
      try {
        storedSplitData = await storageManager.getData("lightningsplit" + "-" + req.query.channel.replace(/\./g, "-"));
      } catch {
        console.log("⚡️⚡️failed to get lightning split", req.query.channel);
      }
      if (storedSplitData) {
        console.log("⚡️⚡️add split retrieved chaNNEL split info", req.query.channel, "\n", storedSplitData.length);
        split = storedSplitData;

      } else {
        console.log("⚡️⚡️no stored split, unable to add", req.query);
        return res.status(400).send();
      }
    }
    console.log("⚡️⚡️⚡️⚡️ got split", channel, video, split);
    if (!split) {
      console.log("⚡️⚡️Unable to add split", req.query);
      return res.status(400).send();
    }
    console.log("⚡️⚡️split", split);
    console.log("⚡️⚡️Attempt to add new address [" + newAddress + ']', customKeysend);
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
      if (!walletData.split) {
        walletData.split = 0;
      }
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
      console.log("⚡️⚡️ setup custom wallet", walletData);
    } else {
      let keysendData = await getKeysendInfo(newAddress);
      let lnurlData = await getLnurlInfo(newAddress);
      if (lnurlData || keysendData) {
        if (keysendData) {
          walletData.keysend = keysendData;
          console.log("⚡️⚡️no walletsuccessfully retrieved keysend data for wallet in channel", channel, keysendData);
          //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);
        } else {
          console.log("⚡️⚡️no keysend info")
        }
        if (lnurlData) {
          walletData.lnurl = lnurlData;
          console.log("⚡️⚡️successfully retrieved lnurl data for wallet in channel", channel, lnurlData);
          //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);
        } else {
          console.log("⚡️⚡️no keysend info")
        }
      } else {
        console.log("⚡️⚡️no wallet data retured for address", newAddress);
        return res.status(404).send();
      }
      console.log("⚡️⚡️ wallet", walletData);
    }
    //var splitData = new Array;
    split.push(walletData);
    let otherSplit = 0
    for (i = 1; i < split.length; i++) {
      console.log("⚡️⚡️split", i, split[i]);
      if (parseInt(split[i].split) < 1) {
        split[i] = 1;
      }
      otherSplit = otherSplit + split[i].split;
    }
    console.log("⚡️⚡️othersplit", otherSplit);

    let creatorSplit = split[0].split - newSplit
    split[0].split = parseInt(creatorSplit);
    console.log("⚡️⚡️split about to be written to storage manager",channel,req.query.channel,video, split);
    try {
      if (!req.query.channel && req.query.video) {
        await storageManager.storeData("lightningsplit" + "-" + req.query.video, split);
      } else {
        await storageManager.storeData("lightningsplit" + "-" + channel.replace(/\./g, "-"), split);
        await saveWellKnownSplit(channel, split);

      }
    } catch {
      console.log("⚡️⚡️failed to store lightning split", channel, split);
    }
    await pingPI(channel);
    return res.status(200).send(split);
  })
  router.use('/updatesplit', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️updating split info\n", req.query)
    }
    if (!enableKeysend && !enableLnurl) {
      return res.status(503).send();
    }
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
    if (node == undefined && newAddress && newAddress.length == 66){
      node=newAddress
      customKeysend=true;
    }
    if (!slot) {
      return res.status(400).send("no split specified to update");
    }
    if (video && !channel) {
      storedSplitData = await getSavedSplit(video);
      if (enableDebug) {
        console.log("⚡️⚡️retrieved split info for video ", video, "\n", storedSplitData);
      }
      if (!storedSplitData) {
        console.log("⚡️⚡️stored split data for video not found");
        console.log("⚡️⚡️base", base);
        var apiCall = base + "/api/v1/videos/" + video;
        console.log("⚡️⚡️ getting video data", apiCall);
        let videoData;
        try {
          videoData = await axios.get(apiCall);
        } catch {
          console.log("⚡️⚡️failed to pull information for provided video id", apiCall);
          return res.status(400).send();
        }
        if (videoData && !channel) {
          console.log("⚡️⚡️getting channel split instead", videoData.data.channel.name);
          channel = videoData.data.channel.name;

        } else {
          console.log("⚡️⚡️failed to find video data", apiCall);
          return res.status(400).send();
        }
      } else {
        split = storedSplitData;
      }
    }
    if (channel && !split) {
      split = await getSavedSplit(channel);
      console.log("⚡️⚡️retrieved chaNNEL split info", channel, "\n", split);
    }
    console.log("⚡️⚡️retrieved split info", split);
    if (split) {
      //TODO may need to relook at this
      if (split[slot].keysend && !split[slot].keysend.pubkey && newAddress.length == 66){
        split[slot].keysend.pubkey = newAddress;
      }
      if (!customKeysend) {
        keysendData = await getKeysendInfo(newAddress);
      }
      //let lnurlData = await getLnurlInfo(newAddress);
      if (enableDebug) {
        console.log(`⚡️⚡️updating from`, split[slot]);
      } if (newAddress) {
        split[slot].address = newAddress;
      }
      if (newSplit) {
        split[slot].split = parseInt(newSplit);
        if (!split[slot].split) {
          split[slot].split = 0;
        }
      }
      if (customKeysend) {
        console.log("⚡️⚡️custom keysend enabled")
        split[slot].customKeysend = true;
        if (node) {
          if (split[slot].keysend){
            split[slot].keysend.pubkey = node;
          } else {
            let keysend={ "status": "OK", "tag": "keysend"}
            keysend.pubkey=node;
            split[slot].keysend = keysend; 
          }
        }
        if (!split[slot].keysend.customData) {
          split[slot].keysend.customData = [{}];
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
        console.log("⚡️⚡️regular lightning address keysend");
        split[slot].keysend = keysendData;
        split[slot].customKeysend = false;
      }
      //console.log("⚡️⚡️customs ",split[slot].keysend,split[slot].keysend.customData);
      if (name) {
        split[slot].name = name;
      }

      //split[slot].keysend = keysendData;
      //split[slot].lnurl = lnurlData;
      let otherSplit = 0;
      for (i = 1; i < split.length; i++) {
        console.log("⚡️⚡️split", i, split[i].split, split[i].address);
        if (parseInt(split[i].split) < 1) {
          split[i].split = 1
        }
        otherSplit = otherSplit + parseInt(split[i].split);
      }
      console.log("⚡️⚡️othersplit", otherSplit);
      let creatorSplit = 100 - otherSplit
      split[0].split = parseInt(creatorSplit);
      console.log("⚡️⚡️ split", split);
      try {
        if (req.query.channel) {
          await saveSplit(channel, split);
          await saveWellKnownSplit(channel, split);
        }
        if (req.query.video) {
          await saveSplit(video,split);
        }
      } catch {
        console.log("⚡️⚡️failed to store lightning split", req.query.video, channel, split);
      }
      console.log("⚡️⚡️updated slot", slot, "with", split[slot]);
      //saveWellKnownSplit(channel,split); 
      if (channel) {
        await pingPI(channel);
      }
      return res.status(200).send(split)
    }
    return res.status(400).send();
  })
  router.use('/removesplit', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️removing split info\n", req.query)
    }
    if (!enableKeysend && !enableLnurl) {
      return res.status(503).send();
    }
    var storedSplitData;
    var split;
    var slot = req.query.slot;
    var channel = req.query.channel;
    var video = req.query.video;
    console.log("⚡️⚡️data for remove split", req.query, slot,channel,video,req.query.channel);
    if (!slot) {
      return res.status(400).send("no slot to remove specified");
    }
    if (req.query.video) {
      storedSplitData = await getSavedSplit(video);
      var apiCall;
      console.log("⚡️⚡️retrieved split info", req.query.key, "\n", storedSplitData);
      if (!storedSplitData) {
        console.log("⚡️⚡️stored split data for video not found");
        if (req.query.video) {
          console.log("⚡️⚡️base", base);
          apiCall = base + "/api/v1/videos/" + req.query.video;
          console.log("⚡️⚡️ getting video data", apiCall);
          let videoData;
          try {
            videoData = await axios.get(apiCall);
          } catch {
            console.log("⚡️⚡️failed to pull information for provided video id", apiCall);
          }
          if (videoData) {
            console.log("⚡️⚡️video channel data", videoData.data.channel);
            channel = videoData.data.channel
          }
        }

      } else {
        split = storedSplitData;
      }
    }
    if (channel) {
      try {
        split = await getSavedSplit(channel);
      } catch {
        console.log("⚡️⚡️failed to get lightning split for channel", channel);
      }
      console.log("⚡️⚡️retrieved chaNNEL split info", channel, "\n", split);
    }
    if (split) {
      console.log(`⚡️⚡️removing`, split[slot].address, " of ", split.length, " from ", channel);
      let otherSplit = 0
      let newSplit = new Array();
      for (i = 0; i < split.length; i++) {
        console.log("⚡️⚡️split", i, "of ", split.length, split[i].address);
        if (i == slot) {
          console.log("⚡️⚡️skipping", i)
        } else {
          newSplit.push(split[i]);
          if (i > 0) {
            otherSplit = otherSplit + split[i].split;
          }
        }
      }
      console.log("⚡️⚡️othersplit", otherSplit);
      console.log("⚡️⚡️data for remove split", req.query, slot,channel,video);
      let creatorSplit = 100 - otherSplit
      newSplit[0].split = parseInt(creatorSplit);
      console.log("⚡️⚡️split about to be writ", channel, req.query.channel, newSplit.length);
      console.log("⚡️⚡️data for remove split brefore", req.query, slot,channel,video,req.query.key);
      try {
        if (req.query.channel) {
          await saveSplit(channel, newSplit);
          await saveWellKnownSplit(channel, newSplit);
        }
        if (req.query.video) {
          await saveSplit(video, newSplit);
        }
      } catch (err) {
        console.log("⚡️⚡️failed to store lightning split", channel, newSplit, err);
      }
      console.log("⚡️⚡️⚡️⚡️ slot removed", slot, ".", newSplit.length, "splits remaining");
      await pingPI(channel);
      return res.status(200).send(newSplit);
    } else {
      console.log("⚡️⚡️stored split data not found");
      //TODO check channel owner account for wallet info
      return res.status(400).send();
    }
  })
  router.use('/getversion', async (req, res) => {
    return res.status(200).send(version);
  })
  router.use('/createsplit', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️creating split info\n", req.query)
    }
    if (!enableKeysend && !enableLnurl) {
      return res.status(503).send("Lightning not enabled by sysop");
    }
    var storedSplitData;
    var split = new Array();
    var newAddress = req.query.splitaddress;
    var newSplit = req.query.split;
    var channel = req.query.channel
    var name = req.query.name;
    if (req.query.video) {
      storedSplitData = await getSavedSplit(video)
      if (enableDebug) {
        console.log("⚡️⚡️retrieved video split info", video, "\n", storedSplitData);
      }
      if (!storedSplitData) {
        console.log("⚡️⚡️stored video split data not found");
        if (req.query.video) {
          console.log("⚡️⚡️base", base);
          var apiCall = base + "/api/v1/videos/" + req.query.video;
          console.log("⚡️⚡️ getting video data", apiCall);
          let videoData;
          try {
            videoData = await axios.get(apiCall);
          } catch {
            console.log("⚡️⚡️failed to pull information for provided video id", apiCall);
          }
          if (videoData) {
            console.log("⚡️⚡️video channel data", videoData.data.channel);
            let foundLightningAddress = await findLightningAddress(videoData.data.description + " " + videoData.data.support + " " + videoData.data.channel.description + " " + videoData.data.channel.support + " " + videoData.data.account.description);
            if (foundLightningAddress) {
              console.log("⚡️⚡️lightning address found in video description [" + foundLightningAddress + ']');
              let keysendData = await getKeysendInfo(foundLightningAddress);
              let lnurlData = await getLnurlInfo(foundLightningAddress);
              if (lnurlData || keysendData) {
                let walletData = {};
                walletData.address = foundLightningAddress;
                if (keysendData) {
                  walletData.keysend = keysendData;
                  console.log("⚡️⚡️successfully retrieved keysend data for wallet in video", videoData.data.channel.name, keysendData);
                  //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);
                }
                if (lnurlData) {
                  walletData.lnurl = lnurlData;
                  console.log("⚡️⚡️successfully retrieved lnurl data for wallet in video", videoData.data.channel.name, lnurlData);
                  //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);

                }
                var splitData = new Array();
                walletData.split = 100;
                if (name) {
                  walletData.name = name;
                } else {
                  walletData.name = "anon";
                }
                splitData.push(walletData);
                if (hostWalletData && parseInt(hostwalletData.split) > 0) {
                  splitData[0].split = 100 - hostWalletData.split;
                }
                splitData.push(hostWalletData);
                //await storageManager.storeData("lightningsplit" + "-" + req.query.video, splitData);
                return res.status(200).send(splitData);
              } else {
                console.log("⚡️⚡️lightning address in video description does not resolve", foundLightningAddress);
              }
            } else {
              console.log("⚡️⚡️no lightning address found in video description");
            }
          }
        }
        console.log("⚡️⚡️Unable to add split", req.query);
        return res.status(400).send();

      } else {
        split = storedSplitData;
      }
    } else if (channel) {
      if (newAddress.length === 66) {
        console.log("⚡️⚡️66 chars, probably a node key\n", newAddress);
      }
      storedSplitData = await getSavedSplit(channel);
      if (storedSplitData) {
        console.log("⚡️⚡️create split retrieved existing channel split info", req.query.channel, "\n", storedSplitData.length);
        console.log('⚡️⚡️already existing splitData for', req.query.channel, storedSplitData);
        return res.status(400).send();
      } else {
        console.log("⚡️⚡️stored split data not found, generating channel split data", req.query.channel);
        //return res.status(400).send();
      }
    }
    console.log("⚡️⚡️split", split);
    console.log("⚡️⚡️Create split attempting to add new address [" + newAddress.length + ']', req.query);
    let keysendData, lnurlData;

    if (newAddress.length === 66) {
      keysendData = { pubkey: newAddress };
      keysendData.customData = [];
      newAddress = "custom";
    } else {
      if (newAddress.indexOf("@") < 0) {
        console.log("⚡️⚡️malformed address without @");
        return res.status(400).send();
      }
      keysendData = await getKeysendInfo(newAddress);
      lnurlData = await getLnurlInfo(newAddress);
    }
    let walletData = {};
    if (lnurlData || keysendData) {
      walletData.address = newAddress;
      walletData.split = 100;
      if (keysendData) {
        walletData.keysend = keysendData;
        console.log("⚡️⚡️successfully retrieved keysend data for wallet in channel", channel, keysendData);
        //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);
      }
      if (lnurlData) {
        walletData.lnurl = lnurlData;
        console.log("⚡️⚡️successfully retrieved lnurl data for wallet in channel", channel, lnurlData);
        //storageManager.storeData("lightning" + "-" + videoData.data.channel.name, videoLightning);

      }
      //var splitData = new Array;
      if (name) {
        walletData.name = name;
      } else {
        walletData.name = newAddress;
      }
      split.push(walletData);
      if (hostWalletData && hostWalletData.split > 0) {

        split[0].split = 100 - hostWalletData.split;
        split.push(hostWalletData);
      } else {
        split[0].split = 100;
      }
      if (enableDebug) {
        console.log("⚡️⚡️saving created channel split\n", channel, split)
      }
      await saveSplit(channel, split);
      await saveWellKnownSplit(channel,split);
      await pingPI(channel);
      return res.status(200).send(split);
    } else {
      console.log("⚡️⚡️lightning address in channel description does not resolve", newAddress);
      return res.status(400).send("Lightning address failed to resolve");
    }
    return res.status(400).send("failed to update");
  })
  router.use('/callback', async (req, res) => {
    console.log("\n⚡️⚡️\n callback", req.query, req.body);
    var state;
    if (req.query.state && req.query.state != 'peertube') {
      state = await storageManager.getData("alby-" + req.query.state.replace(/\./g, "-"));
      console.log("\n⚡️⚡️\ncurrent wallet value", state, req.query.state);
    } 
    if (state == 'pending'  || req.query.state == 'peertube') {
      let callbackUrl = base + "/plugins/lightning/router/callback";
      var formFull = new URLSearchParams();
      //formFull = new FormData();
      formFull.append('code', req.query.code);
      formFull.append('grant_type', 'authorization_code');
      formFull.append('redirect_uri', callbackUrl);
      formFull.append('client_id', client_id);
      formFull.append('client_secret', client_secret);

      let url = "https://api.getalby.com/oauth/token";
      let response;
      let albyWalletData;
      try {
        response = await axios.post(url, formFull, { auth: { username: client_id, password: client_secret } });
      } catch (err) {
        console.log("\n⚡️⚡️⚡️⚡️axios failed to post to alby", err, url, formFull)
      }
      if (response && response.data) {
        console.log("\n⚡️⚡️⚡️⚡️response to token request axios", response.data);
        storageManager.storeData("alby-" + req.query.state.replace(/\./g, "-"), response.data);
        let albyToken = response.data.access_token
        
        let headers = { headers: { "Authorization": `Bearer ` + albyToken } }
        let walletApiUrl = "https://api.getalby.com/user/me"
        try {

          albyWalletData = await axios.get(walletApiUrl, headers);
        } catch (err) {
          console.log("\n⚡️⚡️⚡️⚡️error attempting to get wallet data\n", walletApiUrl, headers, err);
        }
        console.log("\n⚡️⚡️⚡️⚡️wallet data:\n", albyWalletData.data);
        
      }
      if (req.query.state == 'peertube' && enableAlbyAuth){
        let userName = albyWalletData.data.email.split("@")[0];
        let userEmail = albyWalletData.data.email;
        let displayName = albyWalletData.data.name;
        let lightning = albyWalletData.data.lightning_address;
        if (!displayName) {
          displayName=userName;
        }
        if (!userName || !userEmail){return}
        let newWallet = await createWalletObject(lightning);
        if (newWallet.keysend){
          saveWellKnown(userName, newWallet.keysend);
        }
        if (newWallet && newWallet.lnurl){
          saveWellKnownLnurl(userName, newWallet.lnurl);
        }
        storageManager.storeData("lightning-" + userName.replace(/\./g, "-"), newWallet);
        storageManager.storeData("alby-" + userName.replace(/\./g, "-"), response.data);
        console.log("⚡️⚡️ returned user data",userName,userEmail,displayName,lightning,newWallet,response.data);
        let returnData = {
          req,
          res,
          username: userName,
          email: userEmail,
          role: 2,
          displayName: displayName,
        }
        return result.userAuthenticated(returnData);
      }
      storageManager.storeData("alby-" + req.query.state.replace(/\./g, "-"), response.data);
      storageManager.storeData("lightning-" + req.query.state.replace(/\./g, "-"), albyWalletData.data.lightning_address);
      return res.status(200).send(`<h1>User authorized to boost</h1>hr<div class="callout" data-closable>
        <img src="https://media.tenor.com/bwNyT4OBWz4AAAAC/yay-surprise.gif">
        </div>`);
    }
    //TODO fix this
    //return res.redirect(base);
   
  })
  router.use('/setauthorizedwallet', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️setting authorized wallet", req.query);
    }
    if (!client_id){
      console.log("⚡️⚡️ no client id configured, unable to authorize");
      return res.status(420).send("This PeerTube instance has not configured an Alby API Key "+client_id+" "+enableAlbyAuth);
    }
    let userName;
    let user = await peertubeHelpers.user.getAuthUser(res);
    if (user && user.dataValues) {
      if (enableDebug) {
        console.log("⚡️⚡️ got authorized peertube user", user.dataValues.username);
      }
      userName = user.dataValues.username;
    } else {
      console.log("⚡️⚡️ not a valid user");
      return res.status(200).send("not a logged in PeerTube user (" + req.query + ") [" + user + ")");
    }
    if (req.query.clear) {
      storageManager.storeData("alby-" + userName.replace(/\./g, "-"), "cleared");
      console.log("⚡️⚡️cleared", userName);
    } else {
      storageManager.storeData("alby-" + userName.replace(/\./g, "-"), "pending");
      console.log("⚡️⚡️set", userName, "to pending");
    }
    return res.status(200).send(true);
  })
  router.use('/checkauthorizedwallet', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️checking authorized wallet", req.query);
    }
    let userName;
    let user = await peertubeHelpers.user.getAuthUser(res);
    if (user && user.dataValues) {
      userName = user.dataValues.username;
    } else {
      console.log("⚡️⚡️no user found in header");
      return res.status(420).send(` user ${req}`);
    }
    let albyData = await storageManager.getData("alby-" + userName.replace(/\./g, "-"));
    console.log("⚡️⚡️stored data", albyData);
    if (albyData && albyData.access_token) {
      return res.status(200).send(true);
    } else {
      console.log("failed to get alby data", albyData);
      return res.status(420).send(`no stored alby access token for ${userName}`);
    }
  })
  router.use('/sendalbypayment', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️sending payment", req.query, req.body);
    }
    let userName;
    let user = await peertubeHelpers.user.getAuthUser(res);
    if (user && user.dataValues) {
      userName = user.dataValues.username;
    } else {
      console.log("⚡️⚡️no user found");
      return res.status(420).send();
    }
    let albyData = await storageManager.getData("alby-" + userName.replace(/\./g, "-"));
    //console.log("⚡️⚡️stored data", albyData);
    if (albyData && albyData.access_token) {
      let albyToken = albyData.access_token
      let albyWalletData
      let headers = { headers: { "Authorization": `Bearer ` + albyToken } }
      let walletApiUrl = "https://api.getalby.com/payments/keysend"
      let data = req.body;
      console.log("-=--=-=-=-=-", data, headers, walletApiUrl)
      dirtyHack=data;
      try {
        albyWalletData = await axios.post(walletApiUrl, data, headers);
        if (enableDebug) {
          if (albyWalletData){
            console.log("⚡️⚡️payment sending result", albyWalletData.data);
          } else {
            console.log("⚡️⚡️payment sending result is undefined?",walletApiUrl,data,headers);
          }
        }
        if (albyWalletData.data && albyWalletData.data.error){
          return res.status(420).send(albyWalletData.data);
        }
        return res.status(200).send(true);
      } catch (err) {
        console.log("\n⚡️⚡️⚡️⚡️error attempting to send boost\n", err.response.status, err.response.data);
        albyWalletData = err.response.status;
      }
      if (albyWalletData == 401) {
        console.log("need to refresh token!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        let albyUrl = 'https://api.getalby.com/oauth/token'
        var form = new URLSearchParams();
        form.append('refresh_token', albyData.refresh_token);
        form.append('grant_type', "refresh_token");
        let headers = { auth: { username: client_id, password: client_secret } };
        let response;
        try {
          response = await axios.post(albyUrl, form, headers);
        } catch (err) {
          console.log("\n⚡️⚡️⚡️⚡️axios failed to refresh alby token", err, albyUrl, form);
        }
        if (response && response.data && response.data.access_token) {
          //console.log("\n⚡️⚡️⚡️⚡️response to token refreshrequest axios", response.data);
          await storageManager.storeData("alby-" + userName.replace(/\./g, "-"), response.data);
          headers = { headers: { "Authorization": `Bearer ` + response.data.access_token } }
          try {
            albyWalletData = await axios.post(walletApiUrl, data, headers)
          } catch (err) {
            console.log("\n⚡️⚡️⚡️⚡️error attempting to send boost\n", err.response.status, err.response.data);
            return res.status(420);
          }
          return res.status(200).send(true);
        }
      }

    } 
    return res.status(420).send(false);
    
  })
  router.use('/getboosts', async (req,res) => {
    if (enableDebug) {
      console.log("⚡️⚡️getting boosts", req.query, req.body);
    }
    let userName;
    let user = await peertubeHelpers.user.getAuthUser(res);
    if (user && user.dataValues) {
      userName = user.dataValues.username;
      console.log(`⚡️⚡️user ${userName} authorized from header`);
    } else {
      console.log("⚡️⚡️no user found in header");
      return res.status(420).send(` user ${req}`);
    }
    let albyData = await storageManager.getData("alby-" + userName.replace(/\./g, "-"));
    console.log("⚡️⚡️stored data", albyData);
    if (albyData && albyData.access_token) {
      let albyToken = albyData.access_token
      let albyWalletData,response;
      let headers = { headers: { "Authorization": `Bearer ` + albyToken } }
      let albyHook;
      if (req.query.in && req.query.out){
        albyHook = `https://api.getalby.com/invoices?items=1000`
      } else if (req.query.out) {
        albyHook = `https://api.getalby.com/invoices/outgoing?items=1000`
      } else {
        albyHook = `https://api.getalby.com/invoices/incoming?items=1000`
      }
      if (req.query.page){
        albyHook = albyHook+`&page=${req.query.page}`;
      }
      console.log("⚡️⚡️⚡️⚡️", headers, albyHook)
      try {
        response = await axios.get(albyHook, headers);
        if (response){
          console.log("\n⚡️⚡️⚡️⚡️got incoming invoices")
          return res.status(200).send(response.data);
        }
      } catch (err) {
        console.log("\n⚡️⚡️⚡️⚡️error attempting to get incoming invoices\n", err);
        albyWalletData = err.response.status;
      }
      console.log('⚡️⚡️⚡️⚡️ response', response, albyWalletData);
      if (albyWalletData == 401) {
        console.log('⚡️⚡️⚡️⚡️ attempting to refresh token');
        response = await refreshAlbyToken(albyData,botAccount);
        if (response) {
          headers = { headers: { "Authorization": `Bearer ` + response.access_token } }
          try {
            response = await axios.get(albyHook, headers);
            if (response){
              console.log("\n⚡️⚡️⚡️⚡️got incoming invoices with refreshed token");
              return res.status(200).send(response.data);
            }
          } catch (err) {
            console.log("\n⚡️⚡️⚡️⚡️error attempting to get incoming invoices with refreshed token\n", err);
            albyWalletData = err.response.status;
            return res.status(420).send(err);
          }
        } else {
           return res.status(420).send("Authorization failure, try de-auth and re-auth");
        }

      }
    } else {
      console.log('⚡️⚡️⚡️⚡️ no stored wallet data for bot', botAccount);
    }
  })
  router.use('/enablewebhook', async (req, res) => {
    let albyHook = "https://api.getalby.com/webhook_endpoints"
    let body = {};
    body.description = "super chat invoices";
    body.url = base + "/plugins/lightning/router/clearedinvoice";
    body.filter_types = ["invoice.incoming.settled"]
    let albyData = await storageManager.getData("alby-" + botAccount);
    let response;
    console.log("⚡️⚡️stored data", albyData);
    if (albyData && albyData.access_token) {
      let albyToken = albyData.access_token
      let albyWalletData
      let headers = { headers: { "Authorization": `Bearer ` + albyToken } }
      console.log("⚡️⚡️⚡️⚡️", body, headers, albyHook)
      try {
        response = await axios.post(albyHook, body, headers)
        console.log("\n⚡️⚡️⚡️⚡️ created web hook", response)
        return res.status(200).send(response.data);
      } catch (err) {
        console.log("\n⚡️⚡️⚡️⚡️error attempting to set webhook\n", err);
        albyWalletData = err.response.status;
      }
      console.log('⚡️⚡️⚡️⚡️ response', response, albyWalletData);
      if (albyWalletData == 401) {
        console.log('⚡️⚡️⚡️⚡️ attempting to refresh token');
        response = await refreshAlbyToken(albyData,botAccount);
        if (response) {
          headers = { headers: { "Authorization": `Bearer ` + response.access_token } }
          try {
            response = await axios.post(albyHook, body, headers)
            return res.status(200).send(response);
          } catch (err) {
            console.log("\n⚡️⚡️⚡️⚡️error attempting to set webhook\n", err);
            albyWalletData = err.response.status;
            return res.status(420).send(err);
          }
        } else {

        }

      }
    } else {
      console.log('⚡️⚡️⚡️⚡️ no stored wallet data for bot', botAccount);
    }

  })
  router.use('/clearedinvoice', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️\n\n\n\n\n⚡️⚡️cleared invoice", req.query, req.body);
    }
    let suid = req.body.payer_name + (Math.round(parseInt(req.body.creation_date) / 10));
    if (invoices.includes(suid)) {
      console.log("⚡️⚡️\n\n\n\n\n⚡️⚡️duplicate payment ", suid);
      return res.status(200).send();
    }
    invoices.push(suid);
    if (enableDebug) {
      console.log("⚡️⚡️\n\n\n\n\n⚡️⚡️cleared payment", suid, req.query, req.body, req.headers);
    }
    if (!req.body.boostagram){
      console.log("⚡️⚡️\n\n\n\n\n⚡️⚡️ not a boostagram ", suid);
      return res.status(200).send(); 
    }
    let tip = req.body.fiat_in_cents.toString();
    if (simpletipToken && tip > 1000) {


      let simpleTip = {
        "Source": simpletipToken,
        "SourceID": req.body.identifier,
        "UserName": req.body.payer_name,
        "TextContent": req.body.boostagram.message,
        "PaymentAmount": tip
      }
      console.log("simple tip ", simpleTip)
      let tipApi;
      if (simpletipToken) {
        tipApi = "https://simpletipapi.azurewebsites.net/Nugget/ExternalNugget"
      } else {
        tipApi = base + "/plugins/lightning/router/dirtyhack"
      } let simpleTipResult
      try {
        simpleTipResult = await axios.post(tipApi, simpleTip);
      } catch (err) {
        console.log("⚡️⚡️\n\n\n\n\n⚡️⚡️ simple tip failed", tipApi, err.response.data);
      }
      console.log("⚡️⚡️\n\n\n\n\n⚡️⚡️ simple tip", simpleTipResult);
    }
    if (botToken && req.body.boostagram && req.body.boostagram.message) {
      let source = "";
      if (req.body.boostagram.app_name != "PeerTube") {
        source = "using " + req.body.boostagram.app_name;
      }
      let postBody = `${req.body.boostagram.value_msat_total / 1000} Sat ${tipVerb} from ${req.body.payer_name} ${source} \n${req.body.boostagram.message}`;
      if (req.body.boostagram.episode_guid) {
        let parts = req.body.boostagram.episode_guid.split("/");
        let videoUUID = parts[parts.length - 1].split(";")[0];
        let postApi = base + "/api/v1/videos/" + videoUUID + "/comment-threads";
        try {
          await axios.post(postApi, { "text": postBody }, { headers: { "Authorization": `Bearer ` + botToken } })
        } catch (err) {
          console.log("⚡️⚡️\n\n\n\n\n⚡️⚡️ error posting comment", postBody, postApi, err);
        }
      }
    }
    return res.status(200).send();
  })
  router.use('/getchatToken', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️getting chat room", req.query);
    }
    if (!enableChat) {
      return res.status(503).send();
    }
    let channel = req.query.channel;
    let parts = channel.split('@');
    let customChat;
    if (parts.length > 1) {
      let chatApi = "https://" + parts[1] + "/plugins/lightning/router/getchatroom?channel=" + parts[0];
      try {
        customChat = await axios.get(chatApi);
      } catch {
        console.log("⚡️⚡️hard error getting custom chat room for ", channel, "from", parts[1], chatApi);
      }
      if (customChat) {
        //console.log("⚡️⚡️ returning", customChat.toString(), "for", channel);
        return res.status(200).send(customChat.data);
      }
    }
    let chatRoom;
    if (channel) {
      try {
        chatRoom = await storageManager.getData("irc" + "-" + channel)
      } catch (err) {
        console.log("⚡️⚡️error getting chatroom for ", channel);
      }
    }
    //console.log("⚡️⚡️ Irc chat room", chatRoom);
    if (chatRoom) {
      return res.status(200).send(chatRoom);
    } else {
      return res.status(400).send();
    }
  })
  router.use('/setchattoken', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️setting chat token", req.query);
    }
    let user = await peertubeHelpers.user.getAuthUser(res);
    if (user && user.dataValues && req.query.token) {
      let userName = user.dataValues.username;
      if (enableDebug) {
        console.log("███ got authorized peertube user", user.dataValues.username);
      }
      if (enableDebug) {
        console.log("⚡️⚡️⚡️⚡️ user", userName);
      }
      storageManager.storeData("tipToken-" + user.dataValues.username.replace(/\./g, "-"), req.query.token);
      return res.status(200).send();
    }
    return res.status(420).send();
  })
  router.use('/getwebhooks', async (req, res) => {
    let albyHook = "https://api.getalby.com/webhook_endpoints"
    let body = {};
    let albyData = await storageManager.getData("alby-" + botAccount);
    let response;
    console.log("⚡️⚡️stored data", albyData);
    if (albyData && albyData.access_token) {
      let albyToken = albyData.access_token
      let albyWalletData
      let headers = { headers: { "Authorization": `Bearer ` + albyToken } }
      try {
        response = albyWalletData = await axios.get(albyHook, body, headers)
        return res.status(200).send(response);
      } catch (err) {
        console.log("\n⚡️⚡️⚡️⚡️error attempting to get webhook\n", err);
        albyWalletData = err.response.status;
      }
      let newToken = await refreshAlbyToken(albyData,botAccount);
      headers = { headers: { "Authorization": `Bearer ` + newToken.access_token} }
      try {
        response = albyWalletData = await axios.get(albyHook, body, headers)
        return res.status(200).send(response);
      } catch (err) {
        console.log("\n⚡️⚡️⚡️⚡️error attempting to get webhook\n", err);
        albyWalletData = err.response.status;
      }
      console.log('⚡️⚡️⚡️⚡️ response', response, albyWalletData);
    }
    console.log('⚡️⚡️⚡️⚡️ no stored wallet data for bot', botAccount);
    return res.status(404).send(response);
  })
  router.use('/createsubscription',async(req,res) => {
    if (enableDebug) {
      console.log("⚡️⚡️⚡️⚡️ creqting subscription", req.query,req.body);
    }
    if (!req.query.channel){
      return res.status(420).send ("malformed request");
    }
    let user = await peertubeHelpers.user.getAuthUser(res);
    if (!(user && user.dataValues)){
      return res.status(420).send ("unable to confirm authorized user making request");
    }
    let userName;
    if (user && user.dataValues) {
      userName = user.dataValues.username;
      if (enableDebug) {
        console.log("███ got authorized peertube user", user.dataValues.username);
      }
      if (enableDebug) {
        console.log("⚡️⚡️⚡️⚡️ user", userName);
      }
    }
    let replyTo;
    let walletApi = base+`/plugins/lightning/router/walletinfo?account=${userName}`;
    let walletData;
    try {
      walletData = await axios.get(walletApi);
    } catch {
      console.log("⚡️⚡️⚡️⚡️ failed to get reply to address for user", userName,walletApi);
    }
    if (walletData && walletData.data && walletData.data.address){
      replyTo = walletData.data.address;
    }

    let newSubscription = {
      user: userName,
      name: userName,
      channel: req.body.channel,
      amount: (req.body.amount) ? req.body.amount :69 ,
      type: (req.body.type) ? req.body.type : "Daily",
      startdate: Date.now(),
      paiddays: 0,
      public: (req.body.public) ? req.body.public : true,
      pendingconfetti: 0,
      confirmedSats: 0,
      paused: false,
      address: (replyTo) ? replyTo : "",
    }
    if (enableDebug){
      console.log("⚡️⚡️⚡️⚡️ new subscription",newSubscription);
    }
    let totalAmount = newSubscription.amount;
    let days = 1;
    switch(newSubscription.type){
      case "Weekly":
        totalAmount  = totalAmount*7;
        days=7;
        break;
      case "Monthly":
        totalAmount  = totalAmount*30;
        days = 30;
        break;
      case "Yearly":
        totalAmount  = totalAmount*365;
        days = 365;
        break;
    }
    let subscriptions = await storageManager.getData('subscriptions');
    if (!subscriptions){
      if (enableDebug){
        console.log("⚡️⚡️⚡️⚡️ no subscriptions, initializing empty array");
      }
      subscriptions = [];
    }
    //console.log("⚡️⚡️⚡️⚡️ subscriptions plus new one",subscriptions,newSubscription);
    subscriptions.push(newSubscription);
    //console.log("⚡️⚡️⚡️⚡️ subscriptions",subscriptions);
    await storageManager.storeData("subscriptions", subscriptions);
    if (await sendPatronPayment(userName,req.body.channel,totalAmount, "first patron payment",days)){
      console.log("⚡️⚡️⚡️⚡️ made first subscription payment",newSubscription,subscriptions);
      return res.status(200).send(newSubscription);
    } else {
      console.log("⚡️⚡️⚡️⚡️ Failed to make first subscription payment");
      return res.status(420).send("unable to patronize");
    }
  })
  router.use('/clearconfetti', async (req,res) => {
    let channel=req.query.channel;
    let user = await peertubeHelpers.user.getAuthUser(res);
    let userName;
    if (user && user.dataValues){
      userName = user.dataValues.username;
    } else {
      return res.status(420).send("not a user");
    }
    let subscriptions = await storageManager.getData('subscriptions');
    if (subscriptions){
      for (var sub of subscriptions){
        if (userName == sub.user && channel == sub.channel){
          sub.pendingconfetti=0
        }
      }
      storageManager.storeData("subscriptions", subscriptions);
      console.log("⚡️⚡️⚡️⚡️ Saving subscriptions", subscriptions);
      return res.status(200).send("confetti cleared");
    }
  })
  router.use('/deletesubscription', async (req, res) => {
    if (!req.query.channel || !req.query.user) {
      return res.status(420).send("malformed request");
    }
    console.log(req.query);
    let user = await peertubeHelpers.user.getAuthUser(res);
    if (!(user && user.dataValues)){
      return res.status(420).send ("unable to confirm authorized user making request");
    }
    /* need to add capability for mods or channel to delete sub
    let userName = req.query.user;
    if (user && user.dataValues && (user.dataValues.username == req.query.user)) {
      userName = user.dataValues.username;
      if (enableDebug) {
        console.log("███ got authorized peertube user", user.dataValues.username);
      }
      if (enableDebug) {
        console.log("⚡️⚡️⚡️⚡️ user", userName);
      }
    }
    */
    userName = user.dataValues.username;
    let channel = req.query.channel;
    console.log("⚡️⚡️⚡️⚡️ deleting subs",userName,channel);
    let subscriptions = await storageManager.getData('subscriptions');
    let list = [];
    let subs = [];
    //console.log("⚡️⚡️⚡️⚡️ subscriptions",subscriptions);
    if (subscriptions){
      for (var sub of subscriptions){
        console.log("⚡️⚡️⚡️⚡️ subscription",sub.user,sub.channel);
        if (userName != sub.user || channel != sub.channel){
          list.push(sub);
          subs.push(sub.channel)
        } else {
          console.log("⚡️⚡️⚡️⚡️ deleted subscription",sub)
        }
      }
      storageManager.storeData("subscriptions", list);
      console.log("⚡️⚡️⚡️⚡️ Saving subscriptions", subs);
      return res.status(200).send("subscription deleted");
    }
    console.log("⚡️⚡️⚡️⚡️ found subscriptions", list,list.length);
  })
  router.use('/updateSubscription', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️ updating subscription ", req.query, req.body);
    }
    if (!req.body || !req.query.channel){
      return res.status(420).send("⚡️⚡️malformed request");
    }
    let user = await peertubeHelpers.user.getAuthUser(res);
    if (!(user && user.dataValues)){
      return res.status(420).send ("unable to confirm authorized user making request");
    }
    let userName;
    if (user && user.dataValues) {
      userName = user.dataValues.username;
      if (enableDebug) {
        console.log("⚡️⚡️⚡️⚡️ user", userName);
      }
    }
    let subscriptions = await storageManager.getData('subscriptions');
    if (!subscriptions){
      console.log ("⚡️⚡️ no subscriptions to update");
      return res.status(420).send("subscription data not foud");
    }
    console.log ("⚡️⚡️ trying to match",userName,req.query.channel);
    let list = [];
    if (subscriptions){
      for (var sub of subscriptions){
        console.log("⚡️⚡️⚡️⚡️ subscription",sub.user,sub.channel);
        if (userName != sub.user || req.query.channel != sub.channel){
          list.push(sub);
        } else {
          list.push(req.body);
          console.log("⚡️⚡️⚡️⚡️ updated subscription",sub,req.body);
        }
      }
      storageManager.storeData("subscriptions", list);
      return res.status(200).send("subscription updated");
    }
  })
  router.use('/getsubscriptions', async (req, res) => {
    if (enableDebug){
      console.log("⚡️⚡️⚡️⚡️get subscriptions", req.query);
    }
      //if (!req.query.channel || !req.query.user) {
    //  return res.status(420).send("malformed request");
    //}
    let user = await peertubeHelpers.user.getAuthUser(res);
    let userName;
    if (user && user.dataValues){
      userName  = user.dataValues.username;
    }
    if (enableDebug) {
      console.log("⚡️⚡️⚡️⚡️ verified user", userName);
    }
    let subscriptions = await storageManager.getData('subscriptions');
    let list = [];
    console.log("⚡️⚡️⚡️⚡️ trying to match ",req.query.channel,req.query.user,userName);
    if (subscriptions){
      for (var sub of subscriptions){
        console.log("⚡️⚡️⚡️⚡️ sub",sub.user,sub.channel,sub.name,sub.public,sub.address,sub.type);
        // public subscriptions of a user 
        if (!req.query.channel && req.query.user && (req.query.user == sub.user) && (sub.public || userName == req.query.user)){
          list.push(sub);
          console.log("⚡️ found as user's subscription",sub.user,sub.channel,sub.name,sub.public,sub.address,sub.type);
        }
        // public subscribers to channel, not used currently and had some issues with "peertuber" overwriting user
        //else if (!req.query.user && req.query.channel && (req.query.channel == sub.channel) && (sub.public || sub.user == userName)) {
        //  list.push(sub);
        //  console.log("⚡️ found as a channel's subscriber",sub.user,sub.channel,sub.name,sub.public,sub.address,sub.type);
        //} 
        // public subscription of a user for a channel
        else if ((req.query.user && req.query.channel) && userName == sub.user && req.query.channel == sub.channel && (sub.public || sub.user == userName)){
          list.push(sub);
          console.log("⚡️ found exact subscription",sub.user,sub.channel,sub.name,sub.public,sub.address,sub.type);
        }
        // user request for list of their subscribed channels
        else if (!req.query.user && !req.query.channel && userName == sub.user) {
          list.push(sub);
          console.log("⚡️ authorized user's subscriptions",sub.user,sub.channel,sub.name,sub.public,sub.address,sub.type);
         } 
        
      }
    }
    console.log("⚡️⚡️⚡️⚡️ found subscriptions", list,list.length);
    if (list.length>0){
      return res.status(200).send(list);
    } else {
      return res.status(200).send();
    }
  })
  router.use('/setlivevalue', async (req,res) => {
    if (enableDebug) {
      console.log("⚡️⚡️setting livevalue tag", req.query);
    }
    if (req.query.video && req.query.url){
      storageManager.storeData("livevalue-"+req.query.video, req.query.url);
      console.log("⚡️⚡️set live value", req.query.video,req.query.url);
      return res.status(200).send();
    }
    return res.status(420).send();
  })
  router.use('/getlivevalue', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️getting live value", req.query);
    }
    let liveValue;
    try {
      liveValue = await storageManager.getData("livevalue-" + req.query.video);
       console.log("⚡️⚡️got live value", liveValue);
    } catch {
      console.log("⚡️⚡️ hard failed getting lightning live value",req.query);
      return res.status(420).send(`failed getting lightning live value from ${req.query}`);
    }
    console.log("⚡️⚡️returning live value", liveValue);
    return res.status(200).send(liveValue)
  })
  router.use('/setsplitkitid', async (req,res) => {
    if (enableDebug) {
      console.log("⚡️⚡️setting split kit import id", req.query);
    }
    if (req.query.video && req.query.id){
      storageManager.storeData("splitkitid-"+req.query.video, req.query.id);
      console.log("⚡️⚡️set split kit", req.query.video,req.query.id);
      return res.status(200).send();
    }
    return res.status(420).send();
  })
  router.use('/getsplitkitid', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️getting split kit import id", req.query);
    }
    let splitKitId;
    try {
      splitKitId = await storageManager.getData("splitkitid-" + req.query.video);
       console.log("⚡️⚡️got split kit import id", splitKitId);
    } catch {
      console.log("⚡️⚡️ hard failed getting split kit import id",req.query);
      return res.status(420).send(`failed getting split kit id from ${req.query}`);
    }
    console.log("⚡️⚡️returning split kti id", splitKitId);
    return res.status(200).send(splitKitId)
  })
  router.use('/getsplitkitblock', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️getting split kit block", req.query);
    }
    let splitKitId;
    if (req.query.splitkitid){
      splitKitId = req.query.splitkitid;
    }
    if (!splitKitId && req.query.video){
      try {
        splitKitId = await storageManager.getData("splitkitid-" + req.query.video);
        console.log("⚡️⚡️got stored split kit import id", splitKitId);
      } catch {
        console.log("⚡️⚡️ hard failed getting split kit import id",req.query);
        return res.status(420).send(`failed getting split kit id from ${req.query}`);
      } 
    }
    if (!splitKitId && req.query.instance){
      let splitKitIdApi = `https://${req.query.instance}/plugins/lightning/router/getsplitkitid?video=${req.query.video}`
      console.log("⚡️⚡️tryuing to get remote splitkit",splitKitIdApi)
      try {
        let remoteResult = await axios.get(splitKitIdApi);
        console.log("⚡️⚡️ remote result getting split kit id",remoteResult.data);
        if (remoteResult && remoteResult.data){
          splitKitId = remoteResult.data
        }
      } catch {
        console.log("⚡️⚡️error getting remote split kit id",splitKitId);
      }
    }
    if (!splitKitId){
      console.log("⚡️⚡️failed to find any split kit id for video");
      return res.status(420).send();
    } else {
      console.log("⚡️⚡️ound split kit id",splitKitId);
    }
    let splitKitBlock;
    let splitkitBlockApi = `https://curiohoster.com/api/sk/getblocks?guid=${splitKitId}`;
    try {
      splitKitBlock = await axios.get(splitkitBlockApi);
    } catch (err){
      console.log("hard failure requesting split kit block",splitkitBlockApi);
      return res.status(420).send(`failed getting split kit id from ${req.query}`);
    }
    if (splitKitBlock && splitKitBlock.data)
    console.log("⚡️⚡️returning split kit block", splitKitId,splitKitBlock);
    return res.status(200).send(splitKitBlock.data);
  })
  router.use('/updatev4v', async (req, res) => {
    if (enableDebug) {
      console.log("⚡️⚡️ updating v4v", req.query, req.body);
    }
    let user = await peertubeHelpers.user.getAuthUser(res);
    if (!(user && user.dataValues)){
      return res.status(420).send ("unable to confirm authorized user making request");
    }
    let userName;
    if (user && user.dataValues) {
      userName = user.dataValues.username;
      if (enableDebug) {
        console.log("⚡️⚡️⚡️⚡️ user", userName);
      }
    }
    if (!userName){
      return res.status(420).send("⚡️⚡️ unable to confirm authorized user making request");
    }
    let v4vsettings = await storageManager.getData('v4vsettings-'+userName.replace(/\./g, "-"));
    if (!v4vsettings){
      console.log ("⚡️⚡️ no v4v settings to update",req.body);
    } else {
      console.log ("⚡️⚡️  settings",v4vsettings,"\n new v4v settings",req.body);
    }
    storageManager.storeData('v4vsettings-'+userName.replace(/\./g, "-"), req.body);
    let newWallet = await createWalletObject(req.body.boostBack);
    console.log ("⚡️⚡️ new wallet",newWallet,req.body);
    if (newWallet.keysend){
      saveWellKnown(userName, newWallet.keysend);
    }
    if (newWallet.lnurl){
      saveWellKnownLnurl(userName, newWallet.lnurl);
    }
    storageManager.storeData("lightning-" + userName.replace(/\./g, "-"), newWallet);
    return res.status(200).send("v4v settings updated");
  })
  router.use('/getv4v', async (req, res) => {
    if (enableDebug){
      console.log("⚡️⚡️⚡️⚡️get v4v settings", req.query);
    }
    let v4vsettings;
    let user = await peertubeHelpers.user.getAuthUser(res);
    let userName,storedWallet;
    if (user && user.dataValues){
      userName  = user.dataValues.username;
    }
    if (enableDebug) {
      console.log("⚡️⚡️⚡️⚡️ verified user", userName);
    }
    if (userName){
      v4vsettings= await storageManager.getData('v4vsettings-'+userName.replace(/\./g, "-"));
    }
    if (!v4vsettings && userName){
      console.log("⚡️⚡️⚡️⚡️ no saved v4v settings, checking for wallet info");
      storedWallet = await storageManager.getData("lightning-" + userName.replace(/\./g, "-"));
    }
    if (!v4vsettings && !userName){
      console.log("⚡️⚡️⚡️⚡️ no saved v4v settings, checking for wallet info");
      v4vsettings = {
        boostFrom: "PeerTuber",
        boostAmount: 1000,
        streamAuto: false,
        streamAmount: 69,
      }
      if (storedWallet && storedWallet.address){
        v4vsettings.boostBack=storedWallet.address;
      }
      if (userName){
        v4vsettings.boostFrom=userName;
      }
    } 
    if (enableDebug){
      console.log("⚡️⚡️⚡️⚡️ found v4v settings", v4vsettings);
    }
    return res.status(200).send(v4vsettings);
  })
  router.use('/getpatronlevels', async (req,res) => {
    if (enableDebug){
      console.log("⚡️⚡️get patron settings", req.query);
    }
    let channel;
    if (req.query.channel){
      channel=req.query.channel;
    } else {
      return res.status(420).send("No channel found in request");  
    }
    let levels = await storageManager.getData("patronLevels-" + channel.replace(/\./g, "-"));
    console.log("⚡️⚡️⚡️⚡️patron levels", levels);
    if (levels){
      return res.status(200).send(levels);
    } else {
      let parts=channel.split("@");
        if (parts.length>1 && parts[1] != hostDomain){
        let remotePatronLevelsApi = `https://${parts[1]}/plugins/lightning/router/getpatronlevels?channel=${channel}`
        try {
          console.log("⚡️⚡️⚡️⚡️",parts[0],parts[1],hostDomain,remotePatronLevelsApi);
          let remoteData = await axios.get(remotePatronLevelsApi);
          if (remoteData.data){
            console.log("⚡️⚡️⚡️⚡️remote patron levels", remoteData.data); 
            return res.status(200).send(remoteData.data);
          }

        } catch (e){
          console.log("⚡️⚡️⚡️⚡️ error getting remote levels",e)
        }
      }
      return res.status(404).send("No levels found for channel");
    }
  })
  router.use('/setpatronlevels', async (req,res) => {
    if (enableDebug){
      console.log("⚡️⚡️⚡️⚡️set patron settings", req.query,req.body);
    }
    let channel;
    if (req.query.channel){
      channel=req.query.channel;
    } else {
      return res.status(420).send("No channel found in request");  
    }
    let levels;
    if (req.body ){
      levels = req.body
      console.log("⚡️⚡️⚡️⚡️set patron settings", levels);
      await storageManager.storeData("patronLevels-" + channel.replace(/\./g, "-"),levels);
      return res.status(200).send();
    }
     return res.status(420).send("generic failure to set patron levels");
  })
  router.use('/getcurrentkeysend', async (req,res) => {
    if (enableDebug){
      console.log("⚡️⚡️⚡️⚡️get keysend", req.query);
    }
    let address;
    if (req.query.address){
      address=req.query.address;
    } else {
      return res.status(420).send("No address found in request");  
    }
    let walletParts = address.split("@");
    let walletHost = walletParts[1];
    let walletUser = walletParts[0];
    let apiRequest = "https://" + walletHost + "/.well-known/keysend/" + walletUser
    console.log("⚡️⚡️requesting wallet data from provider", apiRequest);
    let walletData;
    try {
      walletData = await axios.get(apiRequest);
    } catch (err) {
      console.log("⚡️⚡️ error attempting to get wallet info", apiRequest, err.message)
      return res.status(420).send(`error trying to get wallet data for ${address}`);
    }
    if (walletData.data.status != "OK") {
      console.log("⚡️⚡️ Error in lightning address data", walletData.data);
      return res.status(420).send(`failed to get OK requesting data for ${address}`);
    }
    walletData.data.cache = Date.now();
    walletData.data.address =address;
    console.log("⚡️⚡️ wallet data", walletData.data)
    //TODO update wallet and well known info with fresh info
    /*
    let whatHappened;
    try {
      whatHappened = await storageManager.storeData(storageIndex, walletData.data);
      //saveWellKnown(parts[0], walletData.data);
    } catch {
      console.log("⚡️⚡️failed to store lighting address", storageIndex, walletData.data);
    }
    
    console.log("⚡️⚡️ stored keysend data", whatHappened, storageIndex, walletData.data);
    */
    if (walletData) {
      return res.status(200).send(walletData.data);
    } else {
      return res.status(420).send(`failed to get wallet data for ${address}`);
    }
  })
  async function saveSplit(uuid, split) {
    try {
      storageManager.storeData("lightningsplit-" + uuid, split);
    } catch {
      console.log("⚡️⚡️failed to store lightning split", uuid, split);
    }
  }
  async function getSavedSplit(uuid) {
    try {
      storedSplitData = await storageManager.getData("lightningsplit-" + uuid);
    } catch {
      console.log("⚡️⚡️ hard failed to get lightning split", uuid);
    }
    if (enableDebug){
     // console.log("⚡️ Got saved split ", uuid, storedSplitData);
    }
    var splitTotal = 0;
    let missing = 0;
    if (storedSplitData) {
      for (var split of storedSplitData) {
        if (enableDebug) {
          console.log("⚡️ split math ", splitTotal, split);
        }
        if (!Number.isInteger(split.split)) {
          //console.log("⚡️ no split value found ", split);
          missing++
        } else {
          splitTotal = splitTotal + split.split;
        }
      }
      if (Number.isInteger(splitTotal) && splitTotal != 100) {
        //console.log("⚡️Split math error!", splitTotal, storedSplitData);
        if (missing == 1) {
          let fixSplit = 100 - splitTotal;
          for (var split of storedSplitData) {
            if (!Number.isInteger(split.split)) {
              split.split = fixSplit;
            }
          }
        }
      }
    }
    if (enableDebug) {
      console.log("⚡️ returned saved split ", storedSplitData);
    }
    return storedSplitData;
  }
  async function getRemoteSplit(uuid) {
    let splitKitId;
    try {
      splitKitId = await storageManager.getData("splitkitid-" + uuid);
    } catch {
      console.log("⚡️⚡️ hard failed to get splitkit id", uuid);
    }
    if (enableDebug){
      console.log("⚡️ Got saved splitkit id ", uuid, splitKitId);
    }
    if (!splitKitId){
      return splitKitId;
    }
    let remoteSplitData;
    let remoteApi = `https://curiohoster.com/api/sk/getblocks?guid=${splitKitId}`
    try {
      remoteSplitData = await axios.get(remoteApi);
    } catch {
      console.log("⚡️⚡️failed to get remote splits", remoteApi);
    }
    return remoteSplitData.data;
  }
  async function pingPI(pingChannel) {
    let feedApi = base + "/plugins/lightning/router/getfeedid?channel=" + pingChannel;
    let feedId;
    try {
      feedId = await axios.get(feedApi);
      let pingResult;
      if (feedId) {
        pingResult = await axios.get("https://api.podcastindex.org/api/1.0/hub/pubnotify?id=" + feedId.data);
      }
      if (pingResult && pingResult.data) {
        return (pingResult.data);
      }
    } catch {
      console.log("⚡️⚡️hard error when trying ping podcast index ", feedId, feedApi);
    }
  }
  async function getKeysendInfo(address) {
    if (enableDebug) {
      console.log("⚡️⚡️getting keysend info for", address);
    }
    if (!address) { return };
    //TODO need proper function to validate actor address and derived index value
    if ((address.indexOf(`"`) >= 0) || (address.indexOf(">") >= 0) || (address.indexOf("<") >= 0)) {
      return;
    }
    let parts = address.split("@");
    if ((parts.length < 2) || (parts[1].indexOf(".") < 1)) {
      return;
    }
    var storageIndex = "lightning-" + address.replace(/\./g, "-");
    console.log("⚡️⚡️Getting Address", address, storageIndex);
    var storedLightning;
    try {
      storedLightning = await storageManager.getData(storageIndex);
    } catch {
      console.log("⚡️⚡️failed to get stored lighting address", storageIndex);
    }
    if (storedLightning) {
      console.log("⚡️⚡️returning stored lightning address", storageIndex);
      //saveWellKnown(parts[0],storedLightning);
      return storedLightning;
    } else {
      console.log("⚡️⚡️no stored data", storageIndex, storedLightning)
    }
    console.log("⚡️⚡️ getting wallet data", address);
    address = address.toString();
    let walletParts = address.split("@");
    let walletHost = walletParts[1];
    let walletUser = walletParts[0];
    let apiRequest = "https://" + walletHost + "/.well-known/keysend/" + walletUser
    console.log("⚡️⚡️requesting wallet data from provider", apiRequest);
    let walletData;
    try {
      walletData = await axios.get(apiRequest);
    } catch (err) {
      console.log("⚡️⚡️ error attempting to get wallet info", apiRequest, err.message)
      return;
    }
    if (walletData.data.status != "OK") {
      console.log("⚡️⚡️ Error in lightning address data", walletData.data);
      return;
    }
    walletData.data.cache = Date.now();
    console.log("⚡️⚡️ wallet data", walletData.data)
    let whatHappened;
    try {
      whatHappened = await storageManager.storeData(storageIndex, walletData.data);
      //saveWellKnown(parts[0], walletData.data);
    } catch {
      console.log("⚡️⚡️failed to store lighting address", storageIndex, walletData.data);
    }
    console.log("⚡️⚡️ stored keysend data", whatHappened, storageIndex, walletData.data);

    return walletData.data;
  }
  async function getLnurlInfo(address) {
    if (enableDebug) {
      console.log("⚡️⚡️getting lnurl info", address);
    }
    if (!address) { return };
    address = address.toString();
    let walletParts = address.split("@");
    let walletHost = walletParts[1];
    let walletUser = walletParts[0];
    let apiRequest = "https://" + walletHost + "/.well-known/lnurlp/" + walletUser
    console.log("⚡️⚡️ requesting lnurlp data from provider", apiRequest);
    let walletData;
    try {
      walletData = await axios.get(apiRequest);
    } catch {
      console.log("⚡️⚡️⚡️⚡️error attempting to get lnurlp info", apiRequest)
      return;
    }
    if (!walletData.data.callback) {
      console.log("⚡️⚡️ Error in lightning address data", walletData.data);
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
    console.log("⚡️⚡️ match", match);
    if (match) return match[3];
    const matchAlbyLink = text.match(
      /http(s)?:\/\/(www[.])?getalby\.com\/p\/(\w+)/
    );
    console.log("⚡️⚡️ match", matchAlbyLink);
    if (matchAlbyLink) {

      return matchAlbyLink[3] + "@getalby.com";
    }
  }
  async function saveWellKnown(account, keySend) {
    //return;
    const folderName = '/var/www/peertube/storage/well-known/keysend/';
    try {
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
      }
    } catch (err) {
      console.error("⚡️⚡️ problem with well known keysend folder", err, account);
    }
    if (enableDebug) {
      console.log("⚡️⚡️ about to save keysend data", account, keySend);
    }
    try {
      fs.writeFileSync(folderName + account, JSON.stringify(keySend));
    } catch (err) {
      console.error("⚡️⚡️ trouble saving the keysend info to peertube folder", err, account);
    }
  }
  async function saveWellKnownLnurl(account, lnurl) {
    //return;
    const folderName = '/var/www/peertube/storage/well-known/lnurlp/';
    try {
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
      }
    } catch (err) {
      console.error("⚡️⚡️ problem with well known lnurlp folder", err, account);
    }
    if (enableDebug) {
      console.log("⚡️⚡️ about to save lnurl data", account, lnurl);
    }
    try {
      fs.writeFileSync(folderName + account, JSON.stringify(lnurl));
    } catch (err) {
      console.error("⚡️⚡️ trouble saving the lnurl info to peertube folder", err, account);
    }
  }
  async function saveWellKnownSplit(channel, splits) {
    const folderName = '/var/www/peertube/storage/well-known/split/';
    console.log("⚡️⚡️⚡️⚡️ saving well known split",folderName,channel,splits);
    let knownSplits = [];
    for (const split of splits) {
      let newSplit = {};
      console.log("⚡️⚡️⚡️⚡️ old split info",split);
      newSplit.name = split.name;
      newSplit.split = split.split;
      newSplit.keysend = split.keysend;
      newSplit.type='node';
      if (newSplit.keysend.cache){
        delete newSplit.keysend.cache;
      }
            if (newSplit.keysend.status){
        delete newSplit.keysend.status;
      }
            if (newSplit.keysend.tag){
        delete newSplit.keysend.tag;
      }
      if (split.fee) {
        newSplit.fee = split.fee;
      }
      if (split.address && split.address !='' && split.address !='custom'){
        newSplit.keysend.keysend = split.address;
      }
      console.log("⚡️⚡️⚡️⚡️ new split info",newSplit);
      knownSplits.push(newSplit);
    }
    console.log("⚡️⚡️ new split data", knownSplits, "⚡️⚡️ channel:", channel, "⚡️⚡️ raw splits", splits);
    try {
      if (!fs.existsSync(folderName)) {
        fs.mkdirSync(folderName);
      }
    } catch (err) {
      console.error("⚡️⚡️ problem with well known keysend split folder", err, channel);
    }
    try {
      fs.writeFileSync(folderName + channel, JSON.stringify(knownSplits));
    } catch (err) {
      console.error("⚡️⚡️ trouble saving the keysend split info to peertube folder", err, channel);
    }
    console.log("⚡️⚡️ saved ⚡️⚡️ saved ⚡️⚡️ saved ⚡️⚡️", knownSplits);
  }
  async function buildFormData(formData, data, parentKey) {
    if (data && typeof data === 'object' && !(data instanceof Date)) {
      Object.keys(data).forEach(key => {
        buildFormData(formData, data[key], parentKey ? `${parentKey}[${key}]` : key);
      });
    } else {
      const value = data == null ? '' : data;

      formData.append(parentKey, value);
    }
  }
  async function getPeerTubeToken(username, password) {
    var clientTokenPath = base + "/api/v1/oauth-clients/local";
    var userTokenPath = base + "/api/v1/users/token";
    try {
      let clientResult = await axios.get(clientTokenPath);
      if (clientResult && clientResult.data) {
        let peertubeClientId = clientResult.data.client_id;
        let clientSecret = clientResult.data.client_secret;
        var data = new URLSearchParams();
        data.append('client_id', peertubeClientId);
        data.append('client_secret', clientSecret);
        data.append('grant_type', 'password');
        data.append('response_type', 'code');
        data.append('username', username);
        data.append('password', password);
        var postData = data.toString();
        let tokenresponse = await axios.post(userTokenPath, data);
        console.log("token request respoonse", tokenresponse.data);
        bearerToken = tokenresponse.data.access_token;
        return (bearerToken);
      } else {
        console.log("failed to get client token");
      }
    } catch (error) {
      console.log("error in get token", ptuser, ptpassword, ptApi);
      return (-1);
    }
    return;
  }
  async function sendPatronPayment(user,channel,amount, message,days,name, public, replyTo,) {
    if (enableDebug) {
      console.log("⚡️⚡️sending patron payment", user, channel,amount,message);
    }
    let albyData = await storageManager.getData("alby-" + user.replace(/\./g, "-"));
    //if (enableDebug) {console.log("⚡️⚡️stored paying wallet data", albyData)}
    if (albyData && albyData.access_token) {
      let albyToken = albyData.access_token
      let albyWalletData
      let boostHeaders = { headers: { "Authorization": `Bearer ` + albyToken } }
      let walletApiUrl = "https://api.getalby.com/payments/keysend/multi"
      let data = {crap:true};
      let worked=0;
      var storedSplitData;
      // try getting cached split info with full address
      try {
        let target = "lightningsplit-" + channel;
        storedSplitData = await storageManager.getData(target);
        if (enableDebug) {
          console.log("⚡️⚡️ got cached split info", target, storedSplitData);
        }
      } catch {
        console.log("⚡️⚡️hard failed to get lightning split with full address", channel);
        //return;
      }
      let remoteChannel,host,remoteApi;
      if (channel.indexOf('@')>1){
        remoteChannel= channel.split('@')[0];
        host = channel.split('@')[1];
        if (enableDebug){
          console.log("⚡️⚡️- calling remote split from pay patron ⚡️⚡️");
        }
        remoteApi = "https://"+host+"/plugins/lightning/router/getsplit?channel="+remoteChannel;
        if (enableDebug) {
          console.log("⚡️⚡️ user name and host", remoteChannel,host,remoteApi);
        }
      }
      
      //try for local stored split data
      if (!storedSplitData && host){
        try {
          storedSplitData = await storageManager.getData("lightningsplit" + "-" + remoteChannel.replace(/\./g, "-"));
          if (enableDebug && storedSplitData) {
            console.log("⚡️⚡️ got cached split data on second try", remoteChannel);
          }
        } catch {
          console.log("⚡️⚡️hard failed to get lightning split for remote channel", remoteChannel);
          //return;
        }
        //try plugin API
        if (!storedSplitData){
          try {
            let splitData = await axios.get(remoteApi);
            storedSplitData = splitData.data;
            if (enableDebug) {
              console.log("⚡️⚡️ got remote split data", remoteChannel,host,remoteApi,storedSplitData);
            }
            //console.log("⚡️⚡️ remoteAp",i call remoteApi,storedSplitData);
          }
          catch {
            console.log("⚡️⚡️hard failed to get lightning split via remote api", channel,remoteApi);
            //return;
          }
        }
      }  
      if (!storedSplitData){
        console.log("⚡️⚡️unable to get split block for channel", channel);
        return false;
      }
      // need to generate split blocks data her zoinks.
      let boosts=[];
      let fullUser = user+"@" + hostDomain;
      for (var payee of storedSplitData){
        if (!payee.split){
          payee.split=1;
        }
        //console.log("⚡️⚡️ wtfff ",payee);

        let splitAmount = Math.trunc(amount*payee.split/100)
        let msat = splitAmount*1000;
        let totalAmount= amount*1000;
        let boostName
        if (public){
          if (name){
            boostName = name;
          } else {
            boostName = user;
          }
          
        } else {
          boostName="Anonymous";
          replyTo=null
        }
        let boost = {
          "app_name": "PeerTube",
          "app_version": version,
          "value_msat_total": totalAmount, // TOTAL Number of millisats for the payment (all splits together, before fees. The actual number someone entered in their player, for numerology purposes.)
          "value_msat": msat, // Number of millisats for this split payment
          "podcast": channel,
          "action": "auto",
          "name": payee.name,
          "sender_name": boostName,
          "message": message
        }
        if (replyTo && replyTo != ''){
          boost.reply_address = replyTo;
        }
        console.log("⚡️⚡️ wtfff ",boost,totalAmount, amount, splitAmount,payee.split);

        let keysend;
        if (payee.keysend && Array.isArray(payee.keysend.customData) && payee.keysend.customData[0] && payee.keysend.customData[0].customKey){
          //console.log("⚡️⚡️ customData found", payee.keysend.customData[0]);
          let customKeyHack = payee.keysend.customData[0].customKey;
          let customValue = payee.keysend.customData[0].customValue;
          keysend = {
            'destination': payee.keysend.pubkey,
            'amount': splitAmount,
            'customRecords': {
              7629169: JSON.stringify(boost),
              [customKeyHack]: customValue,
            }
          };
        } else if (payee && payee.keysend) {
          keysend = {
            'destination': payee.keysend.pubkey,
            'amount': splitAmount,
            'customRecords': {
              7629169: JSON.stringify(boost),
            }
          };
        }
          // could not get multipayment working, here's a hack to send the pieces individually
        if (albyData && albyData.access_token) {
          let albyToken = albyData.access_token
          let albyWalletData
          let headers = { headers: { "Authorization": `Bearer ` + albyToken } }
          let walletApiUrl = "https://api.getalby.com/payments/keysend"
          if (enableDebug) {
            console.log("⚡️⚡️ attempting to pay", walletApiUrl,keysend);
          }
          try {
            albyWalletData = await axios.post(walletApiUrl, keysend, headers);
            //console.log("\n⚡️⚡️⚡️⚡️sent subscription\n", albyWalletData);
          } catch (err) {
            console.log("\n⚡️⚡️⚡️⚡️error attempting to send boost\n", err.response.status,err.response.data);
            albyWalletData = err.response.status;
          }
          if (albyWalletData === 401 ){
            if (enableDebug) {
              console.log("⚡️⚡️ attempting to refresh", user);
            }
            try {
              let newToken = await refreshAlbyToken(albyData,user);
              if (newToken){
                headers = { headers: { "Authorization": `Bearer ` + newToken.access_token } }
                if (enableDebug) {
                  console.log("⚡️⚡️ new token obtained");
                }
                albyData=newToken;
              }
            } catch (err){
               console.log("⚡️⚡️ hard error refreshing token",users,headers,);
            }
            try {
              albyWalletData = await axios.post(walletApiUrl, keysend, headers);
              //console.log("\n⚡️⚡️⚡️⚡️sent subscription\n", albyWalletData);
            } catch (err) {
              console.log("\n⚡️⚡️⚡️⚡️ hard error attempting to send boost with refreshed token\n", err.response.status,err.response.data);
            }
          }
          if (albyWalletData && albyWalletData.status == 200){
            worked = worked+payee.split;
            if (enableDebug) {
              console.log("⚡️⚡️ alby payment worked", worked, albyWalletData.data);
            }
          }
        }
        console.log("\n⚡️⚡️⚡️⚡️ subscription paid",worked)

        boosts.push(keysend);
      }
        if (enableDebug) {
          console.log("⚡️⚡️ finished working split", worked);
        }
        if (worked>1){
          let subscriptions = await storageManager.getData('subscriptions');
          let list = [];
          let subs = [];
          //console.log("⚡️⚡️⚡️⚡️ subscriptions",subscriptions);
          if (subscriptions){
            for (var sub of subscriptions){
              //console.log("⚡️⚡️⚡️⚡️ subscription",sub);
              if (user != sub.user || channel != sub.channel){

                list.push(sub);
                //subs.push(sub.channel)
              } else {
                if (enableDebug) {
                  console.log("⚡️⚡️ updating subscription paid days", days,sub);
                }
                sub.paiddays = sub.paiddays+days;
                sub.pendingconfetti = sub.pendingconfetti+days;
                list.push(sub);
                subs.push(sub);
                console.log("⚡️⚡️⚡️⚡️ updated subscription",sub)
              }
            }
            storageManager.storeData("subscriptions", list);
            return true ;
          }
        } else {
          return false;
        }
      return;
      dirtyHack=boosts
      console.log("-=--=-goku-=-=-=-", boosts,boosts[0],boosts[0].custom_records);

      try {
        albyWalletData = await axios.post(walletApiUrl, boosts, boostHeaders)
      } catch (err) {
        console.log("\n⚡️⚡️⚡️⚡️error attempting to send boost\n", err);
        albyWalletData = err.response.status;
      }
      if (albyWalletData == 401) {
        console.log("need to refresh token!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        let albyUrl = 'https://api.getalby.com/oauth/token'
        var form = new URLSearchParams();
        form.append('refresh_token', albyData.refresh_token);
        form.append('grant_type', "refresh_token");
        let refreshHeaders = { auth: { username: client_id, password: client_secret } };
        let response;
        try {
          response = await axios.post(albyUrl, form, refreshHeaders);
        } catch (err) {
          console.log("\n⚡️⚡️⚡️⚡️axios failed to refresh alby token", err, albyUrl, form);
        }
        if (response && response.data) {
          console.log("\n⚡️⚡️⚡️⚡️response to token refreshrequest axios", response.data);
          storageManager.storeData("alby-" + userName.replace(/\./g, "-"), response.data);
          boostHeaders = { headers: { "Authorization": `Bearer ` + response.data.access_token } }
          console.log("-=--=-=-=-=-", data, boostHeaders, walletApiUrl)
          try {
            await axios.post(walletApiUrl, data, boostHeaders)
          } catch (err) {
            console.log("\n⚡️⚡️⚡️⚡️error attempting to send boost with refreshed token\n", err.response.status);
          }
        }
      }
      return;
    } 
  }
  async function doSubscriptions() {
    let subscriptions = await storageManager.getData('subscriptions');
    //console.log("⚡️⚡️⚡️⚡️ subscriptions",subscriptions);
    if (subscriptions){
      console.log("⚡️⚡️⚡️⚡️ doing subscriptons ",subscriptions.length);
      const date = new Date();
      const today = date.getTime()
      for (var sub of subscriptions){
        console.log(`⚡️⚡️ ${sub.user} subscription to ${sub.channel}`);
        let paidDate = sub.startdate+(sub.paiddays*milliday);
        if (paidDate<today){
          let unPaidTime = today-paidDate;
          let payDays = parseInt(Math.floor(unPaidTime / milliday));
          //console.log("⚡️⚡️⚡️⚡️what the hell man",payDays,unPaidTime,milliday,unPaidTime/milliday)
          if (payDays>0){
            console.log(`⚡️⚡️ ${payDays} behind on ${sub.channel}`);
            let payAmount = payDays*sub.amount;
            switch(sub.type){
              case "Weekly":
                payAmount = payAmount*7;
                payDays = 7
                break;
              case "Monthly":
                payAmount = payAmount*30;
                payDays = 30
                break;
              case "Yearly":
                payAmount = payAmount*365;
                payDays = 365
                break;
            }
            let payStart = new Date(paidDate);
            let payEnd = new Date(paidDate+(milliday*payDays));
            console.log("payStart",payStart,"pay end",payEnd,"pay days",payDays,"what",(milliday*payDays),"days",(milliday*payDays)/milliday)
            let mess = `Patronage for ${sub.channel} for ${payStart.toLocaleDateString()} to `+payEnd.toLocaleDateString()
            let paid = await sendPatronPayment(sub.user,sub.channel,payAmount, mess,payDays,sub.name,sub.public,sub.address);
            if (paid){
              console.log(`${sub.user} patronized ${sub.channel}`);
            } else {
              console.log(`${sub.user} failed to pay for ${sub.channel}`);
            }
          } else {
            console.log(`⚡️⚡️ ${sub.user} paid up for ${sub.channel}`)
          }
        }
      }
    } else {
      console.log("⚡️⚡️⚡️⚡️ no subscriptions found "); 
    }

  }
  async function cacheValid(splits){
    let expired=false;
    for (var splitSlot in splits) {
      if (storedSplitData[splitSlot].keysend && storedSplitData[splitSlot].keysend.cache) {
        let cachedDate = storedSplitData[splitSlot].keysend.cache
        let since = Date.now() - cachedDate;
        if (since>7*24*60*60*1000){
          console.log("⚡️⚡️cached wallet data is expired",storedSplitData[splitSlot].address)
          expired = true;
        } 
      }
    }
    return !expired; 
  }
  async function setCache (splits){
    let now = new Date().getTime();
    for (var slot of splits){
      slot.keysend.cache=now;
      console.log("⚡️⚡️⚡️⚡️ slot",slot);
    }
    return splits
  }
  async function createWalletObject(address){
    if (enableDebug) {
      console.log("⚡️⚡️creating wallet object for ", address);
    }
    let walletData = {};
    walletData.retrieved = Date.now();
    if (address) {
      walletData.address = address;
      if (address.length=66 && address.indexOf("@")<1){
        let keysend={ "status": "OK", "tag": "keysend"}
        keysend.pubkey=address;  
        walletData.keysend=keysend;
        walletData.customKeysend=true;
        return walletData;
      }
      let keysendData;
      let lnurlData;
      if (enableKeysend) {
        keysendData = await getKeysendInfo(address);
      }
      if (enableLnurl) {
        lnurlData = await getLnurlInfo(address);
      }
      if (keysendData) {
        walletData.keysend = keysendData;
        if (enableDebug) {
          console.log("⚡️⚡️successfully retrieved keysend data for ", address, keysendData);
        }
      }
      if (lnurlData) {
        walletData.lnurl = lnurlData;
        if (enableDebug) {
          console.log("⚡️⚡️successfully retrieved lnurl data for ", address, lnurlData);
        }
      }
    }
    console.log("⚡️⚡️returning wallet data", address, walletData);
    return walletData;
  }
  async function refreshAlbyToken(albyData,userName) {
    let response;
    if (enableDebug) {
      console.log(`⚡️⚡️ refreshing token for `,userName );
    }
    let albyUrl = 'https://api.getalby.com/oauth/token'
    var form = new URLSearchParams();
    form.append('refresh_token', albyData.refresh_token);
    form.append('grant_type', "refresh_token");
    let headers = { auth: { username: client_id, password: client_secret } };

    try {
      response = await axios.post(albyUrl, form, headers);
      if (response.data){
        //console.log("\n⚡️⚡️⚡️⚡️response to token refreshrequest axios", response.data);
        await storageManager.storeData("alby-" + userName.replace(/\./g, "-"), response.data);
        return response.data;
      } else {
        console.log("\n⚡️⚡️⚡️⚡️failed to get refresh token", albyUrl,form,headers);
      }
    } catch (err) {
      console.log("\n⚡️⚡️⚡️⚡️axios failed to refresh alby token", err, albyUrl, form);
      return undefined;
    }
    
  }
  async function getRss(channel){
    let apiUrl = base + "/api/v1/video-channels/" + channel;
    let channelData;
    try {
      channelData = await axios.get(apiUrl);
    } catch {
      console.log("⚡️⚡️⚡️⚡️unable to load channel info", apiUrl);
      return ;
    }
    let rssUrl = base + "/feeds/podcast/videos.xml?videoChannelId="+channelData
    return rssUrl;
  }
  function jsonToFormData(data) {
    const formData = new URLSearchParams();

    buildFormData(formData, data);

    return formData;
  }

  //need to find a good way to disable get alby auth without erroring out
  var result;
  if (enableAlbyAuth){
    result = registerExternalAuth({
      authName: 'getalby',
      authDisplayName: () => 'Alby Authentication',
      getWeight: () => 60,
      onAuthRequest: async (req, res) => {
        let callbackUrl = base + "/plugins/lightning/router/callback";
        let albyAuthUrl = `https://getalby.com/oauth?client_id=` + client_id + `&response_type=code&redirect_uri=` + callbackUrl + `&scope=account:read%20invoices:create%20invoices:read%20payments:send&state=peertube`;
        console.log("\n⚡️⚡️⚡️⚡️\n\n\n\n trying to authenticate\n\n\n", albyAuthUrl, callbackUrl);
        return res.redirect(albyAuthUrl)
      },
    });
  }

}

async function unregister() {
  return
}
module.exports = {
  register,
  unregister
}

